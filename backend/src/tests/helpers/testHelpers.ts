import request from "supertest";
import app from "../../app";

// Creates a test user and returns the JWT token
export async function createTestUser() {
  const email = `test-${Date.now()}@example.com`;
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
export async function createTestApiWithKey(token: string) {
  const apiId = await createTestApi(token);

  const response = await request(app)
    .post("/api-keys")
    .set("Authorization", `Bearer ${token}`)
    .send({
      apiId,
      name: "Test Gateway Key",
    });

  return {
    apiId,
    apiKey: response.body.data.key,
  };
}
