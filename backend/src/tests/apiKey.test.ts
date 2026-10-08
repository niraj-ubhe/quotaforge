import { describe, it, expect } from "vitest";
import request from "supertest";

import { createTestUser, createTestApi } from "./helpers/testHelpers";

import app from "../app";

describe("API Keys", () => {
  it("should create an API key", async () => {
    // Create a test user and get the JWT
    const token = await createTestUser();

    // Create a test API
    const apiId = await createTestApi(token);

    // Generate an API key for that API
    const response = await request(app)
      .post("/api-keys")
      .set("Authorization", `Bearer ${token}`)
      .send({
        apiId,
        name: "My Test Key",
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe("API key generated successfully");

    // Check that a key was returned
    expect(response.body.data).toBeDefined();
  });

  it("should return API keys for the logged-in user", async () => {
    // Create a test user and get the JWT
    const token = await createTestUser();

    // Create a test API
    const apiId = await createTestApi(token);

    // Create an API key
    await request(app)
      .post("/api-keys")
      .set("Authorization", `Bearer ${token}`)
      .send({
        apiId,
        name: "My List Test Key",
      });

    // Get the user's API keys
    const response = await request(app)
      .get("/api-keys")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    // Check that the created key appears in the list
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].name).toBe("My List Test Key");
  });

  it("should revoke an API key", async () => {
    // Create a test user and get the JWT
    const token = await createTestUser();

    // Create a test API
    const apiId = await createTestApi(token);

    // Create an API key
    const keyResponse = await request(app)
      .post("/api-keys")
      .set("Authorization", `Bearer ${token}`)
      .send({
        apiId,
        name: "Key To Revoke",
      });

    // Show the actual API key response
    // Get the generated key's database ID
    const keysResponse = await request(app)
      .get("/api-keys")
      .set("Authorization", `Bearer ${token}`);

    const keyId = keysResponse.body.data[0].id;

    // Revoke the API key
    const response = await request(app)
      .patch(`/api-keys/${keyId}/revoke`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });

  it("should reject a revoked API key", async () => {
    // Create a test user and get the JWT
    const token = await createTestUser();

    // Create a test API
    const apiId = await createTestApi(token);

    // Generate an API key
    const keyResponse = await request(app)
      .post("/api-keys")
      .set("Authorization", `Bearer ${token}`)
      .send({
        apiId,
        name: "Key To Revoke",
      });

    const rawKey = keyResponse.body.data.key;

    // Get the database ID of the key
    const keysResponse = await request(app)
      .get("/api-keys")
      .set("Authorization", `Bearer ${token}`);

    const key = keysResponse.body.data.find(
      (item: any) => item.name === "Key To Revoke",
    );

    const keyId = key.id;

    // Revoke the key
    const revokeResponse = await request(app)
      .patch(`/api-keys/${keyId}/revoke`)
      .set("Authorization", `Bearer ${token}`);

    expect(revokeResponse.status).toBe(200);

    // Try using the revoked key
    const gatewayResponse = await request(app)
      .get(`/gateway/${apiId}/posts`)
      .set("x-api-key", rawKey);

    expect(gatewayResponse.status).toBe(401);
  });

  it("should reject an invalid API key", async () => {
    // Create a test user and get the JWT
    const token = await createTestUser();

    // Create a test API
    const apiId = await createTestApi(token);

    // Send a request using a fake API key
    const response = await request(app)
      .get(`/gateway/${apiId}/posts`)
      .set("x-api-key", "qf_live_this_is_a_fake_key");

    // The gateway should reject the key
    expect(response.status).toBe(401);
  });

  it("should not expose or manage another user's API key", async () => {
    const ownerToken = await createTestUser();
    const otherToken = await createTestUser();
    const apiId = await createTestApi(ownerToken);

    await request(app)
      .post("/api-keys")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ apiId, name: "Private Owner Key" })
      .expect(201);

    const ownerKeys = await request(app)
      .get("/api-keys")
      .set("Authorization", `Bearer ${ownerToken}`);
    const privateKeyId = ownerKeys.body.data.find(
      (key: { name: string }) => key.name === "Private Owner Key",
    ).id;

    const otherKeys = await request(app)
      .get("/api-keys")
      .set("Authorization", `Bearer ${otherToken}`);
    const revokeResponse = await request(app)
      .patch(`/api-keys/${privateKeyId}/revoke`)
      .set("Authorization", `Bearer ${otherToken}`);
    const activateResponse = await request(app)
      .patch(`/api-keys/${privateKeyId}/activate`)
      .set("Authorization", `Bearer ${otherToken}`);

    expect(otherKeys.status).toBe(200);
    expect(otherKeys.body.data).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ id: privateKeyId })]),
    );
    expect(revokeResponse.status).toBe(404);
    expect(revokeResponse.body).toMatchObject({
      success: false,
      message: "API not found",
    });
    expect(activateResponse.status).toBe(404);
    expect(activateResponse.body).toMatchObject({
      success: false,
      message: "API not found",
    });

    const ownerKeysAfter = await request(app)
      .get("/api-keys")
      .set("Authorization", `Bearer ${ownerToken}`);
    expect(
      ownerKeysAfter.body.data.find(
        (key: { id: string }) => key.id === privateKeyId,
      ).isActive,
    ).toBe(true);
  });

  it("should not create a key for another user's API", async () => {
    const ownerToken = await createTestUser();
    const otherToken = await createTestUser();
    const apiId = await createTestApi(ownerToken);

    const response = await request(app)
      .post("/api-keys")
      .set("Authorization", `Bearer ${otherToken}`)
      .send({ apiId, name: "Unauthorized Key" });

    expect(response.status).toBe(404);
    expect(response.body).toMatchObject({
      success: false,
      message: "API not found",
    });
  });
});
