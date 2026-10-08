const errorResponse = {
  description: "Request failed",
  content: {
    "application/json": {
      schema: { $ref: "#/components/schemas/Error" },
      example: { success: false, message: "API not found" },
    },
  },
};

const validationResponse = {
  description: "Request body failed validation",
  content: {
    "application/json": {
      schema: { $ref: "#/components/schemas/ValidationError" },
      example: {
        success: false,
        message: "Validation failed",
        errors: { name: ["API name must be at least 3 characters"] },
      },
    },
  },
};

const bearerAuth = [{ BearerAuth: [] }];

const gatewayOperation = {
  tags: ["Gateway"],
  summary: "Proxy a request to the configured upstream API",
  description:
    "The remaining path and query string are forwarded to the upstream API. Non-GET/HEAD request bodies are forwarded. The upstream response status and body are returned and recorded in analytics.",
  security: [{ ApiKeyAuth: [] }],
  parameters: [
    { $ref: "#/components/parameters/ApiId" },
    {
      name: "path",
      in: "path",
      required: true,
      description: "Upstream path after the API ID; may include multiple segments.",
      schema: { type: "string" },
      example: "posts/1",
    },
    {
      name: "query",
      in: "query",
      required: false,
      description: "Query parameters are passed through to the upstream API.",
      schema: { type: "string" },
    },
  ],
  requestBody: {
    required: false,
    description: "Forwarded for methods other than GET and HEAD.",
    content: {
      "application/json": {
        schema: { type: "object", additionalProperties: true },
        example: { title: "Hello", body: "Example payload", userId: 1 },
      },
    },
  },
  responses: {
    "200": {
      description: "Upstream response (status and body are passed through).",
      content: {
        "application/json": {
          schema: { type: "object", additionalProperties: true },
          example: { userId: 1, id: 1, title: "Example post", body: "..." },
        },
      },
    },
    "401": {
      description: "API key is missing, invalid, revoked, or malformed.",
      content: {
        "application/json": {
          schema: { $ref: "#/components/schemas/Error" },
          example: { success: false, message: "API key is required" },
        },
      },
    },
    "404": {
      description: "API does not match the supplied API key.",
      content: {
        "application/json": {
          schema: { $ref: "#/components/schemas/Error" },
          example: { success: false, message: "API not found" },
        },
      },
    },
    "429": {
      description: "Configured rate limit was exceeded.",
      content: {
        "application/json": {
          schema: { $ref: "#/components/schemas/Error" },
          example: { success: false, message: "Rate limit exceeded" },
        },
      },
    },
    "502": {
      description: "The upstream API did not respond.",
      content: {
        "application/json": {
          schema: { $ref: "#/components/schemas/Error" },
          example: { success: false, message: "Bad Gateway" },
        },
      },
    },
    default: {
      description: "Any other HTTP status returned by the upstream API is passed through.",
      content: {
        "application/json": {
          schema: { type: "object", additionalProperties: true },
        },
      },
    },
  },
};

const gatewayPath = Object.fromEntries(
  ["get", "post", "put", "patch", "delete", "options", "head", "trace"].map(
    (method) => [method, gatewayOperation],
  ),
);

const openApiDocument = {
  openapi: "3.0.3",
  info: {
    title: "QuotaForge API",
    version: "1.0.0",
    description:
      "API management, API-key gateway, and request analytics for QuotaForge.",
  },
  servers: [{ url: "/", description: "Current QuotaForge server" }],
  tags: [
    { name: "Health" },
    { name: "Authentication" },
    { name: "APIs" },
    { name: "API Keys" },
    { name: "Gateway" },
    { name: "Analytics" },
  ],
  paths: {
    "/health": {
      get: {
        tags: ["Health"],
        summary: "Check server availability",
        responses: {
          "200": {
            description: "Server is running.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SuccessMessage" },
                example: { success: true, message: "QuotaForge API is running" },
              },
            },
          },
        },
      },
    },
    "/auth/register": {
      post: {
        tags: ["Authentication"],
        summary: "Register a user",
        description:
          "The demo email is reserved. Successful registration returns the selected user object directly (without a success envelope or token).",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "email", "password"],
                properties: {
                  name: { type: "string", example: "Alex Example" },
                  email: { type: "string", example: "alex@example.com" },
                  password: { type: "string", format: "password", example: "••••••••" },
                },
              },
              example: {
                name: "Alex Example",
                email: "alex@example.com",
                password: "password123",
              },
            },
          },
        },
        responses: {
          "200": {
            description: "User registered.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/RegisteredUser" },
                example: {
                  id: "user-id",
                  name: "Alex Example",
                  email: "alex@example.com",
                  createdAt: "2026-01-01T12:00:00.000Z",
                },
              },
            },
          },
          "400": {
            description: "Email already exists or is reserved for the demo account.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
                examples: {
                  duplicateEmail: {
                    value: { success: false, message: "Email already exists" },
                  },
                  reservedDemoEmail: {
                    value: {
                      success: false,
                      message: "This email is reserved for the demo account",
                    },
                  },
              },
            },
          },
          },
          "500": { $ref: "#/components/responses/ServerError" },
        },
      },
    },
    "/auth/login": {
      post: {
        tags: ["Authentication"],
        summary: "Log in with email and password",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string", example: "alex@example.com" },
                  password: { type: "string", format: "password" },
                },
              },
              example: { email: "alex@example.com", password: "password123" },
            },
          },
        },
        responses: {
          "200": {
            description: "Login successful; token expires after seven days.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AuthResponse" },
                example: {
                  success: true,
                  message: "Login successful",
                  data: {
                    token: "<jwt>",
                    user: {
                      id: "user-id",
                      name: "Alex Example",
                      email: "alex@example.com",
                      isDemo: false,
                    },
                  },
                },
              },
            },
          },
          "401": {
            description: "Email or password is invalid.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
                example: { success: false, message: "Invalid email or password" },
              },
            },
          },
          "500": { $ref: "#/components/responses/ServerError" },
        },
      },
    },
    "/auth/demo": {
      post: {
        tags: ["Authentication"],
        summary: "Log in to the shared demo account",
        responses: {
          "200": {
            description: "Demo session created.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AuthResponse" },
                example: {
                  success: true,
                  message: "Demo login successful",
                  data: {
                    token: "<jwt>",
                    user: {
                      id: "demo-user-id",
                      name: "Demo Account",
                      email: "demo@quotaforge.dev",
                      isDemo: true,
                    },
                  },
                },
              },
            },
          },
          "500": { $ref: "#/components/responses/ServerError" },
        },
      },
    },
    "/auth/me": {
      get: {
        tags: ["Authentication"],
        summary: "Get the current user",
        security: bearerAuth,
        responses: {
          "200": {
            description: "Current user details.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: { $ref: "#/components/schemas/PublicUser" },
                  },
                },
                example: {
                  success: true,
                  data: {
                    id: "user-id",
                    name: "Alex Example",
                    email: "alex@example.com",
                    createdAt: "2026-01-01T12:00:00.000Z",
                    isDemo: false,
                  },
                },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
    "/apis": {
      get: {
        tags: ["APIs"],
        summary: "List APIs owned by the current user",
        security: bearerAuth,
        responses: {
          "200": {
            description: "Owned API records, newest first.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: { type: "array", items: { $ref: "#/components/schemas/Api" } },
                  },
                },
                example: { success: true, data: [{ id: "api-id", name: "Niraj Pay" }] },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
        },
      },
      post: {
        tags: ["APIs"],
        summary: "Create an API",
        security: bearerAuth,
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateApi" },
              example: {
                name: "Niraj Pay",
                description: "Payment API demo",
                baseUrl: "https://jsonplaceholder.typicode.com",
                requestsPerMinute: 100,
                rateLimitAlgorithm: "FIXED_WINDOW",
              },
            },
          },
        },
        responses: {
          "201": {
            description: "API created.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiEnvelope" },
                example: {
                  success: true,
                  message: "API created successfully",
                  data: {
                    id: "api-id",
                    name: "Niraj Pay",
                    description: "Payment API demo",
                    baseUrl: "https://jsonplaceholder.typicode.com",
                    ownerId: "user-id",
                    requestsPerMinute: 100,
                    rateLimitAlgorithm: "FIXED_WINDOW",
                    createdAt: "2026-01-01T12:00:00.000Z",
                    updatedAt: "2026-01-01T12:00:00.000Z",
                  },
                },
              },
            },
          },
          "400": validationResponse,
          "401": { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
    "/apis/{id}": {
      parameters: [{ $ref: "#/components/parameters/ApiResourceId" }],
      get: {
        tags: ["APIs"],
        summary: "Get an owned API",
        security: bearerAuth,
        responses: {
          "200": {
            description: "API details.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiEnvelope" },
                example: { success: true, data: { id: "api-id", name: "Niraj Pay" } },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
      patch: {
        tags: ["APIs"],
        summary: "Update an owned API",
        security: bearerAuth,
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UpdateApi" },
              example: { requestsPerMinute: 250, rateLimitAlgorithm: "SLIDING_WINDOW" },
            },
          },
        },
        responses: {
          "200": {
            description: "API updated.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiEnvelope" },
                example: {
                  success: true,
                  message: "API updated successfully",
                  data: { id: "api-id", requestsPerMinute: 250 },
                },
              },
            },
          },
          "400": validationResponse,
          "401": { $ref: "#/components/responses/Unauthorized" },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
      delete: {
        tags: ["APIs"],
        summary: "Delete an owned API and its request/key records",
        description: "Deleting APIs is disabled for the shared demo account.",
        security: bearerAuth,
        responses: {
          "200": {
            description: "API deleted.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SuccessMessage" },
                example: { success: true, message: "API deleted successfully" },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "403": { $ref: "#/components/responses/Forbidden" },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
    },
    "/api-keys": {
      get: {
        tags: ["API Keys"],
        summary: "List keys for the current user's APIs",
        security: bearerAuth,
        responses: {
          "200": {
            description: "Key metadata only; secret values are not returned.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: { type: "array", items: { $ref: "#/components/schemas/ApiKeyMetadata" } },
                  },
                },
                example: {
                  success: true,
                  data: [{ id: "key-id", name: "Demo key", prefix: "qf_live_AB12", isActive: true, apiId: "api-id" }],
                },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
        },
      },
      post: {
        tags: ["API Keys"],
        summary: "Create an API key for an owned API",
        description: "The raw key is returned only once. Store it securely.",
        security: bearerAuth,
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateApiKey" },
              example: { apiId: "api-id", name: "Gateway key" },
            },
          },
        },
        responses: {
          "201": {
            description: "Key created; retain the returned key secret.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "API key generated successfully" },
                    data: {
                      type: "object",
                      properties: { key: { type: "string", example: "qf_live_AB12.<secret>" } },
                    },
                  },
                },
                example: {
                  success: true,
                  message: "API key generated successfully",
                  data: { key: "qf_live_AB12.<secret>" },
                },
              },
            },
          },
          "400": validationResponse,
          "401": { $ref: "#/components/responses/Unauthorized" },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
    },
    "/api-keys/{id}/revoke": {
      patch: {
        tags: ["API Keys"],
        summary: "Revoke an owned API key",
        description: "Revoking keys is disabled for the shared demo account.",
        security: bearerAuth,
        parameters: [{ $ref: "#/components/parameters/KeyId" }],
        responses: {
          "200": {
            description: "Key revoked.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiKeyStatusEnvelope" },
                example: {
                  success: true,
                  message: "API key revoked successfully",
                  data: { id: "key-id", name: "Gateway key", prefix: "qf_live_AB12", isActive: false },
                },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "403": { $ref: "#/components/responses/Forbidden" },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
    },
    "/api-keys/{id}/activate": {
      patch: {
        tags: ["API Keys"],
        summary: "Activate an owned API key",
        security: bearerAuth,
        parameters: [{ $ref: "#/components/parameters/KeyId" }],
        responses: {
          "200": {
            description: "Key activated.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiKeyStatusEnvelope" },
                example: {
                  success: true,
                  message: "API key activated successfully",
                  data: { id: "key-id", name: "Gateway key", prefix: "qf_live_AB12", isActive: true },
                },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
    },
    "/gateway/{apiId}/{path}": gatewayPath,
    "/analytics/overview": {
      get: {
        tags: ["Analytics"],
        summary: "Get request analytics across owned APIs",
        security: bearerAuth,
        responses: {
          "200": {
            description: "Aggregate request counts and average response time in milliseconds.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/OverviewEnvelope" },
                example: {
                  success: true,
                  data: { totalRequests: 120, successfulRequests: 114, failedRequests: 6, averageResponseTime: 48.2 },
                },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
    "/analytics/apis/{apiId}": {
      get: {
        tags: ["Analytics"],
        summary: "Get aggregate analytics for an owned API",
        security: bearerAuth,
        parameters: [{ $ref: "#/components/parameters/ApiId" }],
        responses: {
          "200": {
            description: "Request counts and average response time in milliseconds.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/OverviewEnvelope" },
                example: {
                  success: true,
                  data: { totalRequests: 42, successfulRequests: 40, failedRequests: 2, averageResponseTime: 51.4 },
                },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
    "/analytics/apis/{apiId}/top-endpoints": {
      get: {
        tags: ["Analytics"],
        summary: "Get up to ten most-requested endpoints for an owned API",
        security: bearerAuth,
        parameters: [{ $ref: "#/components/parameters/ApiId" }],
        responses: {
          "200": {
            description: "Endpoint paths and request counts, sorted by count descending.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/TopEndpointsEnvelope" },
                example: { success: true, data: [{ path: "/posts/1", requests: 18 }] },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
    "/analytics/apis/{apiId}/status-codes": {
      get: {
        tags: ["Analytics"],
        summary: "Get response status-code counts for an owned API",
        security: bearerAuth,
        parameters: [{ $ref: "#/components/parameters/ApiId" }],
        responses: {
          "200": {
            description: "Status codes and corresponding request counts.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/StatusCodesEnvelope" },
                example: { success: true, data: [{ statusCode: 200, requests: 40 }, { statusCode: 429, requests: 2 }] },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
    "/analytics/apis/{apiId}/timeline": {
      get: {
        tags: ["Analytics"],
        summary: "Get request counts over time for an owned API",
        security: bearerAuth,
        parameters: [
          { $ref: "#/components/parameters/ApiId" },
          {
            name: "range",
            in: "query",
            required: false,
            description: "Time period; defaults to 7d. 1d groups by hour; 7d and 30d group by day.",
            schema: { type: "string", enum: ["1d", "7d", "30d"], default: "7d" },
          },
        ],
        responses: {
          "200": {
            description: "Time buckets and request counts.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/TimelineEnvelope" },
                example: { success: true, data: [{ date: "2026-01-01T12:00:00.000Z", requests: 8 }] },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      BearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
      ApiKeyAuth: { type: "apiKey", in: "header", name: "x-api-key" },
    },
    parameters: {
      ApiId: {
        name: "apiId",
        in: "path",
        required: true,
        description: "API ID",
        schema: { type: "string" },
        example: "api-id",
      },
      ApiResourceId: {
        name: "id",
        in: "path",
        required: true,
        description: "API ID",
        schema: { type: "string" },
        example: "api-id",
      },
      KeyId: {
        name: "id",
        in: "path",
        required: true,
        description: "API key record ID (not the raw key).",
        schema: { type: "string" },
        example: "key-id",
      },
    },
    responses: {
      Unauthorized: {
        description: "Bearer token is missing, malformed, invalid, or expired.",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/Error" },
            example: { success: false, message: "Invalid or expired token" },
          },
        },
      },
      Forbidden: {
        description: "The action is not allowed for this account.",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/Error" },
            example: { success: false, message: "Forbidden" },
          },
        },
      },
      NotFound: {
        description: "Resource not found or not owned by the current user.",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/Error" },
            example: { success: false, message: "API not found" },
          },
        },
      },
      ServerError: {
        description: "Unexpected server error.",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/Error" },
            example: { success: false, message: "Internal Server Error" },
          },
        },
      },
    },
    schemas: {
      Error: {
        type: "object",
        required: ["success", "message"],
        properties: {
          success: { type: "boolean", example: false },
          message: { type: "string", example: "API not found" },
        },
      },
      ValidationError: {
        type: "object",
        required: ["success", "message", "errors"],
        properties: {
          success: { type: "boolean", example: false },
          message: { type: "string", example: "Validation failed" },
          errors: { type: "object", additionalProperties: { type: "array", items: { type: "string" } } },
        },
      },
      SuccessMessage: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          message: { type: "string" },
        },
      },
      RegisteredUser: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          email: { type: "string" },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      PublicUser: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          email: { type: "string" },
          createdAt: { type: "string", format: "date-time" },
          isDemo: { type: "boolean" },
        },
      },
      AuthResponse: {
        type: "object",
        properties: {
          success: { type: "boolean" },
          message: { type: "string" },
          data: {
            type: "object",
            properties: {
              token: { type: "string", description: "JWT; expires after seven days." },
              user: { $ref: "#/components/schemas/PublicUser" },
            },
          },
        },
      },
      Api: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          description: { type: "string", nullable: true },
          baseUrl: { type: "string", format: "uri" },
          ownerId: { type: "string" },
          requestsPerMinute: { type: "integer", example: 100 },
          rateLimitAlgorithm: { type: "string", enum: ["FIXED_WINDOW", "SLIDING_WINDOW", "TOKEN_BUCKET"] },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      ApiEnvelope: {
        type: "object",
        properties: {
          success: { type: "boolean" },
          message: { type: "string" },
          data: { $ref: "#/components/schemas/Api" },
        },
      },
      CreateApi: {
        type: "object",
        required: ["name", "baseUrl"],
        properties: {
          name: { type: "string", minLength: 3, maxLength: 100 },
          description: { type: "string", maxLength: 500 },
          baseUrl: { type: "string", format: "uri" },
          requestsPerMinute: { type: "integer", minimum: 1, maximum: 100000, default: 100 },
          rateLimitAlgorithm: { type: "string", enum: ["FIXED_WINDOW", "SLIDING_WINDOW", "TOKEN_BUCKET"], default: "FIXED_WINDOW" },
        },
      },
      UpdateApi: {
        type: "object",
        description: "All fields are optional; provided fields use the create constraints.",
        properties: {
          name: { type: "string", minLength: 3, maxLength: 100 },
          description: { type: "string", maxLength: 500 },
          baseUrl: { type: "string", format: "uri" },
          requestsPerMinute: { type: "integer", minimum: 1, maximum: 100000 },
          rateLimitAlgorithm: { type: "string", enum: ["FIXED_WINDOW", "SLIDING_WINDOW", "TOKEN_BUCKET"] },
        },
      },
      CreateApiKey: {
        type: "object",
        required: ["apiId", "name"],
        properties: {
          apiId: { type: "string", minLength: 1 },
          name: { type: "string", minLength: 3, maxLength: 50 },
        },
      },
      ApiKeyMetadata: {
        type: "object",
        properties: {
          id: { type: "string" },
          apiId: { type: "string" },
          name: { type: "string" },
          prefix: { type: "string" },
          isActive: { type: "boolean" },
          lastUsedAt: { type: "string", format: "date-time", nullable: true },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      ApiKeyStatusEnvelope: {
        type: "object",
        properties: {
          success: { type: "boolean" },
          message: { type: "string" },
          data: {
            type: "object",
            properties: {
              id: { type: "string" },
              name: { type: "string" },
              prefix: { type: "string" },
              isActive: { type: "boolean" },
            },
          },
        },
      },
      OverviewEnvelope: {
        type: "object",
        properties: {
          success: { type: "boolean" },
          data: {
            type: "object",
            properties: {
              totalRequests: { type: "integer" },
              successfulRequests: { type: "integer" },
              failedRequests: { type: "integer" },
              averageResponseTime: { type: "number", description: "Milliseconds." },
            },
          },
        },
      },
      TopEndpointsEnvelope: {
        type: "object",
        properties: {
          success: { type: "boolean" },
          data: {
            type: "array",
            items: {
              type: "object",
              properties: { path: { type: "string" }, requests: { type: "integer" } },
            },
          },
        },
      },
      StatusCodesEnvelope: {
        type: "object",
        properties: {
          success: { type: "boolean" },
          data: {
            type: "array",
            items: {
              type: "object",
              properties: { statusCode: { type: "integer" }, requests: { type: "integer" } },
            },
          },
        },
      },
      TimelineEnvelope: {
        type: "object",
        properties: {
          success: { type: "boolean" },
          data: {
            type: "array",
            items: {
              type: "object",
              properties: {
                date: { type: "string", format: "date-time" },
                requests: { type: "integer" },
              },
            },
          },
        },
      },
    },
  },
};

export default openApiDocument;
