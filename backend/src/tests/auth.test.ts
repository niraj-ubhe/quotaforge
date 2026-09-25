import { describe, it, expect } from "vitest";
import request from "supertest";

import app from "../app";

describe("Authentication", () => {
  it("should register a new user", async () => {
    const email = `test-${Date.now()}@example.com`;

    const response = await request(app).post("/auth/register").send({
      name: "Test User",
      email,
      password: "password123",
    });

    expect(response.status).toBe(200);

    expect(response.body).toHaveProperty("id");
    expect(response.body.email).toBe(email);
    expect(response.body.name).toBe("Test User");
  });

  it("should reject an existing email", async () => {
    const email = `duplicate-${Date.now()}@example.com`;

    // First registration
    await request(app).post("/auth/register").send({
      name: "Test User",
      email,
      password: "password123",
    });

    // Second registration with the same email
    const response = await request(app).post("/auth/register").send({
      name: "Another User",
      email,
      password: "password456",
    });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Email already exists");
  });

  it("should login an existing user", async () => {
    const email = `login-${Date.now()}@example.com`;
    const password = "password123";

    // Create the user first
    await request(app).post("/auth/register").send({
      name: "Login User",
      email,
      password,
    });

    // Login
    const response = await request(app).post("/auth/login").send({
      email,
      password,
    });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe("Login successful");

    expect(response.body.data).toHaveProperty("token");
    expect(response.body.data.user.email).toBe(email);
  });

  it("should reject an incorrect password", async () => {
    const email = `wrong-password-${Date.now()}@example.com`;

    await request(app).post("/auth/register").send({
      name: "Test User",
      email,
      password: "password123",
    });

    const response = await request(app).post("/auth/login").send({
      email,
      password: "wrongpassword",
    });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Invalid email or password");
  });
});
