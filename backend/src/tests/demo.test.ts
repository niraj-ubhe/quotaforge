import { describe, it, expect } from "vitest";
import request from "supertest";

import app from "../app";
import { createTestApi, createTestUser } from "./helpers/testHelpers";
import { DEMO_USER_EMAIL } from "../config/demo";

describe("Demo authentication", () => {
  it("should authenticate the demo user without a password", async () => {
    const response = await request(app).post("/auth/demo");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty("token");
    expect(response.body.data.user.email).toBe(DEMO_USER_EMAIL);
    expect(response.body.data.user.isDemo).toBe(true);
    expect(response.body.data.user).not.toHaveProperty("password");
  });

  it("should return seeded demo APIs after demo login", async () => {
    const demoResponse = await request(app).post("/auth/demo");
    const token = demoResponse.body.data.token;

    const response = await request(app)
      .get("/apis")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.length).toBeGreaterThanOrEqual(5);
    expect(response.body.data.map((api: { name: string }) => api.name)).toEqual(
      expect.arrayContaining([
        "Niraj Pay",
        "HTTPBin Demo",
        "Demo User Service",
        "Demo Comments Service",
        "Weather API",
      ]),
    );
  });

  it("should not let the demo user access another user's API", async () => {
    const demoResponse = await request(app).post("/auth/demo");
    const demoToken = demoResponse.body.data.token;
    const otherToken = await createTestUser();
    const otherApiId = await createTestApi(otherToken);

    const response = await request(app)
      .delete(`/apis/${otherApiId}`)
      .set("Authorization", `Bearer ${demoToken}`);

    expect(response.status).toBe(404);
  });

  it("should not let another user access a demo API", async () => {
    const demoResponse = await request(app).post("/auth/demo");
    const demoToken = demoResponse.body.data.token;
    const otherToken = await createTestUser();

    const apisResponse = await request(app)
      .get("/apis")
      .set("Authorization", `Bearer ${demoToken}`);
    const demoApiId = apisResponse.body.data[0].id;

    const otherApis = await request(app)
      .get("/apis")
      .set("Authorization", `Bearer ${otherToken}`);

    expect(otherApis.body.data).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ id: demoApiId })]),
    );

    const deleteResponse = await request(app)
      .delete(`/apis/${demoApiId}`)
      .set("Authorization", `Bearer ${otherToken}`);

    expect(deleteResponse.status).toBe(404);
  });

  it("should prevent the demo user from deleting demo APIs", async () => {
    const demoResponse = await request(app).post("/auth/demo");
    const demoToken = demoResponse.body.data.token;

    const apisResponse = await request(app)
      .get("/apis")
      .set("Authorization", `Bearer ${demoToken}`);
    const demoApiId = apisResponse.body.data[0].id;

    const response = await request(app)
      .delete(`/apis/${demoApiId}`)
      .set("Authorization", `Bearer ${demoToken}`);

    expect(response.status).toBe(403);
  });

  it("should keep normal login working", async () => {
    const email = `normal-${Date.now()}@example.com`;
    const password = "password123";

    await request(app).post("/auth/register").send({
      name: "Normal User",
      email,
      password,
    });

    const response = await request(app).post("/auth/login").send({
      email,
      password,
    });

    expect(response.status).toBe(200);
    expect(response.body.data.user.email).toBe(email);
    expect(response.body.data.user.isDemo).toBe(false);
    expect(response.body.data).toHaveProperty("token");
  });

  it("should reject registering the reserved demo email", async () => {
    const response = await request(app).post("/auth/register").send({
      name: "Hijack Demo",
      email: DEMO_USER_EMAIL,
      password: "password123",
    });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe(
      "This email is reserved for the demo account",
    );
  });
});
