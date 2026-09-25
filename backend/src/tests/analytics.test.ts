import request from "supertest";
import { describe, it, expect } from "vitest";
import app from "../app";
import { createTestUser, createTestApiWithKey } from "./helpers/testHelpers";
import { normalizeEndpointPath } from "../services/analytics.service";

describe("Analytics", () => {
  it("normalizes legacy gateway endpoint path formats", () => {
    const apiId = "1urgkby1yxy7p";

    expect(normalizeEndpointPath("/posts", apiId)).toBe("/posts");
    expect(normalizeEndpointPath(`${apiId}/posts`, apiId)).toBe("/posts");
    expect(normalizeEndpointPath(`/gateway/${apiId}/posts`, apiId)).toBe("/posts");
    expect(normalizeEndpointPath(`/gateway-docs/${apiId}/posts`, apiId)).toBe(
      `/gateway-docs/${apiId}/posts`,
    );
  });
  it("should show gateway requests in the overview", async () => {
    // Create a test user
    const token = await createTestUser();

    // Create an API and API key
    const { apiKey } = await createTestApiWithKey(token);

    // Get the API ID from the API list
    const apiResponse = await request(app)
      .get("/apis")
      .set("Authorization", `Bearer ${token}`);

    const apiId = apiResponse.body.data[0].id;

    // Make a request through the gateway
    await request(app).get(`/gateway/${apiId}/posts`).set("x-api-key", apiKey);

    // Get analytics overview
    const response = await request(app)
      .get("/analytics/overview")
      .set("Authorization", `Bearer ${token}`);

    // Analytics request should succeed
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    // At least one request should have been recorded
    expect(response.body.data.totalRequests).toBeGreaterThanOrEqual(1);
  });

  it("should return analytics for a specific API", async () => {
    // Create a test user
    const token = await createTestUser();

    // Create an API and API key
    const { apiId, apiKey } = await createTestApiWithKey(token);

    // Make a request through the gateway
    await request(app).get(`/gateway/${apiId}/posts`).set("x-api-key", apiKey);

    // Get analytics for this API
    const response = await request(app)
      .get(`/analytics/apis/${apiId}`)
      .set("Authorization", `Bearer ${token}`);

    // Analytics request should succeed
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    // The API should have at least one recorded request
    expect(response.body.data.totalRequests).toBeGreaterThanOrEqual(1);

    // The recorded request should be successful
    expect(response.body.data.successfulRequests).toBeGreaterThanOrEqual(1);

    // Response time should have been recorded
    expect(response.body.data.averageResponseTime).toBeGreaterThanOrEqual(0);
  });

  it("should return top endpoints for an API", async () => {
    // Create a test user
    const token = await createTestUser();

    // Create an API and API key
    const { apiId, apiKey } = await createTestApiWithKey(token);

    // Make requests to the same endpoint
    await request(app).get(`/gateway/${apiId}/posts`).set("x-api-key", apiKey);

    await request(app).get(`/gateway/${apiId}/posts`).set("x-api-key", apiKey);

    // Get top endpoints
    const response = await request(app)
      .get(`/analytics/apis/${apiId}/top-endpoints`)
      .set("Authorization", `Bearer ${token}`);

    // Analytics request should succeed
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    // The endpoint should appear in the results
    expect(response.body.data.length).toBeGreaterThan(0);
    expect(response.body.data[0].path).toBe("/posts");
  });

  it("should return status code analytics for an API", async () => {
    // Create a test user
    const token = await createTestUser();

    // Create an API and API key
    const { apiId, apiKey } = await createTestApiWithKey(token);

    // Make a successful gateway request
    await request(app).get(`/gateway/${apiId}/posts`).set("x-api-key", apiKey);

    // Get status code analytics
    const response = await request(app)
      .get(`/analytics/apis/${apiId}/status-codes`)
      .set("Authorization", `Bearer ${token}`);

    // Analytics request should succeed
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    // A successful request should be recorded as 200
    expect(response.body.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          statusCode: 200,
          requests: expect.any(Number),
        }),
      ]),
    );
  });

  it("should return timeline analytics for an API", async () => {
    // Create a test user
    const token = await createTestUser();

    // Create an API and API key
    const { apiId, apiKey } = await createTestApiWithKey(token);

    // Make a gateway request
    await request(app).get(`/gateway/${apiId}/posts`).set("x-api-key", apiKey);

    // Get timeline analytics
    const response = await request(app)
      .get(`/analytics/apis/${apiId}/timeline?range=7d`)
      .set("Authorization", `Bearer ${token}`);

    // Timeline request should succeed
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    // Timeline should contain recorded request data
    expect(response.body.data.length).toBeGreaterThan(0);
    expect(response.body.data[0]).toEqual(
      expect.objectContaining({
        requests: expect.any(Number),
      }),
    );
  });

  it("should not allow a user to access another user's analytics", async () => {
    // Create two separate users
    const tokenA = await createTestUser();
    const tokenB = await createTestUser();

    // Create an API owned by User A
    const { apiId } = await createTestApiWithKey(tokenA);

    // User B tries to access User A's analytics
    const response = await request(app)
      .get(`/analytics/apis/${apiId}`)
      .set("Authorization", `Bearer ${tokenB}`);

    // Request should succeed but return no data belonging to User A
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.totalRequests).toBe(0);
  });

  it("should reject unauthenticated analytics requests", async () => {
    // Try to access analytics without a JWT
    const response = await request(app).get("/analytics/overview");

    // Request should be rejected
    expect(response.status).toBe(401);
  });
});
