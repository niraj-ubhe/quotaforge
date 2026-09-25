import { describe, it, expect } from "vitest";
import request from "supertest";

import {
  createTestUser,
  createTestApi,
  createTestApiWithKey,
} from "./helpers/testHelpers";

import app from "../app";

describe("Gateway", () => {
  it("should allow a request with a valid API key", async () => {
    // Create a test user and get the JWT
    const token = await createTestUser();

    // Create a test API with an API key
    const { apiId, apiKey } = await createTestApiWithKey(token);

    // Send a request through the gateway
    const response = await request(app)
      .get(`/gateway/${apiId}/posts`)
      .set("x-api-key", apiKey);

    // The valid key should allow the request
    expect(response.status).toBe(200);
  });

  it("should reject a gateway request without an API key", async () => {
    // Create a test user and get the JWT
    const token = await createTestUser();

    // Create a test API
    const apiId = await createTestApi(token);

    // Send a gateway request without an API key
    const response = await request(app).get(`/gateway/${apiId}/posts`);

    // The gateway should reject the request
    expect(response.status).toBe(401);
  });

  it("should reject requests after the rate limit is exceeded", async () => {
    // Create a test user and get the JWT
    const token = await createTestUser();

    // Create a test API with an API key
    const { apiId, apiKey } = await createTestApiWithKey(token);

    // Set the API limit to 2 requests per minute
    await request(app)
      .patch(`/apis/${apiId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        requestsPerMinute: 2,
      });

    // First request should be allowed
    const response1 = await request(app)
      .get(`/gateway/${apiId}/posts`)
      .set("x-api-key", apiKey);

    // Second request should also be allowed
    const response2 = await request(app)
      .get(`/gateway/${apiId}/posts`)
      .set("x-api-key", apiKey);

    // Third request should be blocked
    const response3 = await request(app)
      .get(`/gateway/${apiId}/posts`)
      .set("x-api-key", apiKey);

    expect(response1.status).toBe(200);
    expect(response2.status).toBe(200);
    expect(response3.status).toBe(429);
  });

  it("should enforce the sliding window rate limit", async () => {
    // Create a test user and get the JWT
    const token = await createTestUser();

    // Create a test API with an API key
    const { apiId, apiKey } = await createTestApiWithKey(token);

    // Configure the API to use sliding window with a limit of 2
    await request(app)
      .patch(`/apis/${apiId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        requestsPerMinute: 2,
        rateLimitAlgorithm: "SLIDING_WINDOW",
      });

    // First request should be allowed
    const response1 = await request(app)
      .get(`/gateway/${apiId}/posts`)
      .set("x-api-key", apiKey);

    // Second request should be allowed
    const response2 = await request(app)
      .get(`/gateway/${apiId}/posts`)
      .set("x-api-key", apiKey);

    // Third request should be blocked
    const response3 = await request(app)
      .get(`/gateway/${apiId}/posts`)
      .set("x-api-key", apiKey);

    expect(response1.status).toBe(200);
    expect(response2.status).toBe(200);
    expect(response3.status).toBe(429);
  });

  it("should enforce the token bucket rate limit", async () => {
    // Create a test user and get the JWT
    const token = await createTestUser();

    // Create a test API with an API key
    const { apiId, apiKey } = await createTestApiWithKey(token);

    // Configure the API to use token bucket with a limit of 2
    await request(app)
      .patch(`/apis/${apiId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        requestsPerMinute: 2,
        rateLimitAlgorithm: "TOKEN_BUCKET",
      });

    // First request should be allowed
    const response1 = await request(app)
      .get(`/gateway/${apiId}/posts`)
      .set("x-api-key", apiKey);

    // Second request should be allowed
    const response2 = await request(app)
      .get(`/gateway/${apiId}/posts`)
      .set("x-api-key", apiKey);

    // Third request should be blocked
    const response3 = await request(app)
      .get(`/gateway/${apiId}/posts`)
      .set("x-api-key", apiKey);

    expect(response1.status).toBe(200);
    expect(response2.status).toBe(200);
    expect(response3.status).toBe(429);
  });
});
