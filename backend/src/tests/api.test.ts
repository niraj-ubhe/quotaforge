import { describe, it, expect } from "vitest";
import request from "supertest";

import { createTestUser, createTestApi } from "./helpers/testHelpers";

import app from "../app";

describe("API Management", () => {
  it("should reject access to APIs without a token", async () => {
    const response = await request(app).get("/apis");

    expect(response.status).toBe(401);
  });

  it("should allow access to APIs with a valid token", async () => {
    // Create a test user and get the JWT
    const token = await createTestUser();

    // Access the protected route using the JWT
    const response = await request(app)
      .get("/apis")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
  });

  it("should create an API with a valid token", async () => {
    // Create a test user and get the JWT
    const token = await createTestUser();

    // Create an API using the JWT
    const response = await request(app)
      .post("/apis")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Test API",
        description: "API created during testing",
        baseUrl: "https://jsonplaceholder.typicode.com",
        requestsPerMinute: 5,
        rateLimitAlgorithm: "FIXED_WINDOW",
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe("API created successfully");

    // Check that the created API has an ID
    expect(response.body.data).toHaveProperty("id");

    // Check that the API name is correct
    expect(response.body.data.name).toBe("Test API");
  });

  it("should return APIs belonging to the logged-in user", async () => {
    // Create a test user and get the JWT
    const token = await createTestUser();

    // Create an API
    const createResponse = await request(app)
      .post("/apis")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "My Test API",
        baseUrl: "https://jsonplaceholder.typicode.com",
      });

    expect(createResponse.status).toBe(201);

    // Get all APIs for this user
    const response = await request(app)
      .get("/apis")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    // Check that our created API appears in the list
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].name).toBe("My Test API");
  });

  it("should only return APIs belonging to the logged-in user", async () => {
    // Create two separate users
    const tokenA = await createTestUser();
    const tokenB = await createTestUser();

    // Create one API for User A
    await request(app)
      .post("/apis")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({
        name: "User A API",
        baseUrl: "https://jsonplaceholder.typicode.com",
      });

    // Create one API for User B
    await request(app)
      .post("/apis")
      .set("Authorization", `Bearer ${tokenB}`)
      .send({
        name: "User B API",
        baseUrl: "https://jsonplaceholder.typicode.com",
      });

    // Get APIs as User A
    const response = await request(app)
      .get("/apis")
      .set("Authorization", `Bearer ${tokenA}`);

    expect(response.status).toBe(200);

    // User A should only see their own API
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].name).toBe("User A API");
  });
});
