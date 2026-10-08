import { afterEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import app from "../app";
import { isSafePublicHttpUrl, isSafeRedirectTarget } from "../security/upstreamUrl";
import { createLoginRateLimit } from "../middleware/loginRateLimit.middleware";
import { validateProductionJwtSecret } from "../config/security";

describe("upstream URL security", () => {
  const publicResolver = async (hostname: string) => {
    if (["api.github.com", "api.open-meteo.com", "httpbin.org"].includes(hostname)) {
      return [{ address: "140.82.112.6", family: 4 }];
    }
    if (hostname === "metadata.google.internal") return [{ address: "169.254.169.254", family: 4 }];
    return [{ address: "10.0.0.8", family: 4 }];
  };

  it.each(["https://api.github.com", "https://api.open-meteo.com", "https://httpbin.org"])(
    "allows public endpoint %s",
    async (url) => expect(await isSafePublicHttpUrl(url, publicResolver)).toBe(true),
  );

  it.each([
    "http://localhost",
    "http://127.0.0.1",
    "http://10.0.0.1",
    "http://169.254.169.254/latest/meta-data",
    "http://metadata.google.internal",
    "file:///etc/passwd",
  ])("blocks unsafe upstream URL %s", async (url) => {
    expect(await isSafePublicHttpUrl(url, publicResolver)).toBe(false);
  });

  it("blocks DNS names resolving to private addresses and unsafe redirects", async () => {
    expect(await isSafePublicHttpUrl("https://internal.example", publicResolver)).toBe(false);
    expect(isSafeRedirectTarget("http:", "127.0.0.1")).toBe(false);
    expect(isSafeRedirectTarget("file:", "example.com")).toBe(false);
    expect(isSafeRedirectTarget("https:", "api.github.com")).toBe(true);
  });
});

describe("authentication and CORS security", () => {
  it("requires a strong non-placeholder JWT secret in production without echoing it", () => {
    for (const JWT_SECRET of [undefined, "short", "replace-with-a-long-random-string", "placeholder-" + "x".repeat(32)]) {
      expect(() => validateProductionJwtSecret({ NODE_ENV: "production", JWT_SECRET } as NodeJS.ProcessEnv))
        .toThrow(/JWT_SECRET/);
    }
    expect(() => validateProductionJwtSecret({ NODE_ENV: "production", JWT_SECRET: "s".repeat(40) }))
      .not.toThrow();
  });

  it("rejects malformed registration and login bodies in the normal validation format", async () => {
    const register = await request(app).post("/auth/register").send({ name: "x", email: "bad", password: "short" });
    const login = await request(app).post("/auth/login").send({ email: "bad", password: "" });
    for (const response of [register, login]) {
      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({ success: false, message: "Validation failed" });
      expect(response.body.errors).toBeDefined();
    }
  });

  it("allows the production frontend and localhost but not arbitrary origins", async () => {
    const production = await request(app).get("/health").set("Origin", "https://quotaforge.vercel.app");
    const local = await request(app).get("/health").set("Origin", "http://localhost:5173");
    const unknown = await request(app).get("/health").set("Origin", "https://attacker.example");
    expect(production.headers["access-control-allow-origin"]).toBe("https://quotaforge.vercel.app");
    expect(local.headers["access-control-allow-origin"]).toBe("http://localhost:5173");
    expect(unknown.headers["access-control-allow-origin"]).toBeUndefined();
    expect(production.headers["x-content-type-options"]).toBe("nosniff");
  });

  it("keeps Swagger UI reachable with security headers", async () => {
    const response = await request(app).get("/api-docs/");
    expect(response.status).toBe(200);
    expect(response.text).toContain("Swagger UI");
    expect(response.headers["x-content-type-options"]).toBe("nosniff");
  });

  it("limits repeated login attempts by IP", async () => {
    const previousEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";
    let count = 0;
    const counter = {
      incr: vi.fn(async () => ++count),
      expire: vi.fn(async () => 1),
    };
    const middleware = createLoginRateLimit(counter, 2, 60);
    const invoke = () => {
      const req = { ip: "192.0.2.15", socket: { remoteAddress: "192.0.2.15" } } as any;
      const res = {
        setHeader: vi.fn(),
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as any;
      const next = vi.fn();
      return Promise.resolve(middleware(req, res, next)).then(() => ({ res, next }));
    };
    try {
      expect((await invoke()).next).toHaveBeenCalledOnce();
      expect((await invoke()).next).toHaveBeenCalledOnce();
      const blocked = await invoke();
      expect(blocked.next).not.toHaveBeenCalled();
      expect(blocked.res.status).toHaveBeenCalledWith(429);
      expect(counter.expire).toHaveBeenCalledOnce();
    } finally {
      if (previousEnv === undefined) delete process.env.NODE_ENV;
      else process.env.NODE_ENV = previousEnv;
    }
  });
});
