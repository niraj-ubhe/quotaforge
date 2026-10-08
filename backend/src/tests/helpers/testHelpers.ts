import request from "supertest";
import { randomUUID } from "crypto";
import { vi } from "vitest";
import app from "../../app";

// Creates a test user and returns the JWT token
export async function createTestUser() {
  const email = `test-${randomUUID()}@example.com`;
  const password = "password123";

  await request(app).post("/auth/register").send({
    name: "Test User",
    email,
    password,
  });

  const loginResponse = await request(app).post("/auth/login").send({
    email,
    password,
  });

  return loginResponse.body.data.token;
}

// Creates a test API and returns its ID
export async function createTestApi(token: string) {
  const response = await request(app)
    .post("/apis")
    .set("Authorization", `Bearer ${token}`)
    .send({
      name: "Test API",
      baseUrl: "https://jsonplaceholder.typicode.com",
    });

  return response.body.data.id;
}

// Creates a test API with an API key
export async function createTestApiKey(
  token: string,
  apiId: string,
  name: string,
) {
  // Test data persists between runs, while production prefixes are intentionally
  // short. Retry only the database's unique-prefix collision, not other failures.
  for (let attempt = 0; attempt < 10; attempt += 1) {
    let prefixCollision = false;
    const originalConsoleError = console.error;
    const errorSpy = vi.spyOn(console, "error").mockImplementation((...args) => {
      const error = args[0] as {
        code?: string;
        meta?: { target?: string | string[] };
      };
      const target = Array.isArray(error?.meta?.target)
        ? error.meta.target.join(" ")
        : error?.meta?.target ?? "";
      if (error?.code === "P2002" && target.includes("prefix")) {
        prefixCollision = true;
        return;
      }
      originalConsoleError(...args);
    });

    let response;
    try {
      response = await request(app)
        .post("/api-keys")
        .set("Authorization", `Bearer ${token}`)
        .send({ apiId, name });
    } finally {
      errorSpy.mockRestore();
    }

    if (response.status === 201) return response;
    if (prefixCollision) continue;
    throw new Error(`Test API key creation failed with status ${response.status}`);
  }

  throw new Error("Test API key creation repeatedly hit a duplicate prefix");
}

export async function createTestApiWithKey(token: string) {
  const apiId = await createTestApi(token);
  const response = await createTestApiKey(token, apiId, "Test Gateway Key");

  return {
    apiId,
    apiKey: response.body.data.key,
  };
}
