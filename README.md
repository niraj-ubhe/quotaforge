# QuotaForge

QuotaForge is a multi-tenant API management and gateway platform for configuring upstream APIs, securing access with API keys, enforcing rate limits, and reviewing request analytics.

## Live Demo

- Frontend: [quotaforge.vercel.app](https://quotaforge.vercel.app)
- Backend health: [quotaforge-ax65.onrender.com/health](https://quotaforge-ax65.onrender.com/health)
- API reference: [Swagger UI](https://quotaforge-ax65.onrender.com/api-docs/)
- Source: [github.com/niraj-ubhe/quotaforge](https://github.com/niraj-ubhe/quotaforge)

## What is QuotaForge?

QuotaForge provides a control plane for registering upstream APIs and managing their keys and rate-limit settings. API consumers send traffic through a gateway endpoint instead of calling the upstream directly. The gateway validates the key, applies the configured limit, forwards allowed requests, and records results for the API owner.

## Architecture

```text
Dashboard ── JWT ──> QuotaForge API ──> PostgreSQL
                           │             (users, APIs, keys, analytics)
API Client ── API key ──> Gateway
                           ├── Validate key and target API
                           ├── Check/update rate-limit state ──> Redis
                           ├── Proxy allowed request ──> Upstream API
                           └── Record request analytics ──> PostgreSQL
```

For a gateway request, QuotaForge authenticates the API key, checks that it is active and belongs to the requested API, applies that API's selected rate-limit algorithm, and proxies allowed traffic to its configured upstream. It records the outcome and response time for analytics.

## Key Features

- User registration and JWT-based authentication, including an Explore Demo account.
- Multi-tenant API registration, configuration, and deletion.
- API-key generation, listing, revocation, and reactivation.
- Gateway proxying with per-key Redis rate-limit state and configurable algorithms.
- Analytics for request volume, status codes, response times, popular endpoints, and timelines.
- Swagger/OpenAPI documentation for the backend API.

## Rate Limiting

Each API is configured with a request limit and one of three algorithms:

- **Fixed Window** increments a Redis counter and expires it after the window.
- **Sliding Window** counts requests within the rolling window using a Redis Lua script.
- **Token Bucket** tracks available tokens and refill state using a Redis Lua script.

Redis provides shared state across backend instances. Sliding Window and Token Bucket perform their state checks and updates atomically in Lua; Fixed Window uses Redis's atomic `INCR` operation for its counter.

## Security

- API keys contain a generated secret; the stored secret is bcrypt-hashed. The raw key is returned only when created.
- API management and analytics queries are scoped to the authenticated user's resources. Gateway keys are checked against the requested API.
- Configured upstream URLs are restricted to public HTTP(S) destinations; loopback, private, link-local, and metadata destinations are blocked, and DNS/redirects are rechecked to reduce SSRF risk.
- Production startup validates `JWT_SECRET`; tokens use the explicitly configured HS256 signing algorithm.
- Login attempts are throttled by IP using Redis.
- CORS allows the production frontend and local development origins; Helmet supplies security headers.
- Request logging omits query strings and does not log Authorization or API-key headers.

## Analytics

Gateway requests are recorded with their method, upstream-relative path, status code, response time, and timestamp. The dashboard summarizes request and success/failure counts, average response time, status-code totals, most-used endpoints, and request timelines.

## Tech Stack

| Area | Technologies |
| --- | --- |
| Frontend | React, TypeScript, Vite, Recharts, Lucide React |
| Backend | Node.js, Express, TypeScript, Axios, Zod |
| Authentication and keys | JWT, bcrypt, Node.js cryptographic random bytes |
| Persistence | PostgreSQL, Prisma |
| Rate-limit state | Upstash Redis |
| API documentation | Swagger UI, OpenAPI |
| Tests | Vitest, Supertest |
| CI and deployment | GitHub Actions, Vercel, Render, Neon, Upstash |

## Project Structure

```text
quotaforge/
├── .github/workflows/       # Backend CI workflow
├── backend/
│   ├── prisma/              # Schema and migrations
│   └── src/
│       ├── config/
│       ├── controllers/
│       ├── docs/             # OpenAPI document
│       ├── middleware/
│       ├── routes/
│       ├── security/
│       ├── services/
│       ├── tests/
│       └── validators/
├── frontend/
│   └── src/
│       ├── components/
│       ├── context/
│       ├── layouts/
│       ├── pages/
│       └── services/
├── docker-compose.yml       # Local PostgreSQL service
└── README.md
```

## API Documentation

Swagger UI is served by the backend at [`/api-docs/`](https://quotaforge-ax65.onrender.com/api-docs/). It documents the main authentication, API management, API-key, gateway, and analytics endpoints. The deployed URL was checked and returned the Swagger UI successfully.

## Testing and CI

The backend uses Vitest and Supertest for route, authorization, gateway, analytics, and security regression tests. The current source suite has **59 passing tests**. Run it from `backend/`:

```bash
npm test -- --run --exclude dist
npm run build
```

The GitHub Actions workflow provisions PostgreSQL and a Redis-compatible test service, then runs the backend tests and build.

## Local Development

### Requirements

- Node.js 22 and npm (the version used by backend CI).
- Docker Desktop (or a PostgreSQL instance).
- An Upstash Redis REST endpoint and token for backend rate limiting.

The repository's Docker Compose file starts PostgreSQL only; it does not start Redis.

### Setup

1. Clone the repository and create local environment files:

   ```bash
   git clone https://github.com/niraj-ubhe/quotaforge.git
   cd quotaforge
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   ```

2. Fill in the local backend settings in `backend/.env`, including a private development `JWT_SECRET`, `DATABASE_URL`, and the Upstash Redis REST URL and token. The template's PostgreSQL URL matches the included Docker Compose service.

3. Start PostgreSQL and prepare the backend:

   ```bash
   docker compose up -d postgres
   cd backend
   npm install
   npx prisma generate
   npx prisma migrate dev
   npm run dev
   ```

4. In a second terminal, install and start the frontend:

   ```bash
   cd frontend
   npm install
   npm run dev
   ```

   The frontend template points to `http://localhost:5000`; Vite prints the local frontend URL when it starts.

See [`backend/.env.example`](backend/.env.example) and [`frontend/.env.example`](frontend/.env.example) for the variable names. Never commit `.env` files or real credentials.

### Environment Variables

- Backend: `DATABASE_URL`, `JWT_SECRET`, `UPSTASH_REDIS_REST_URL`, and `UPSTASH_REDIS_REST_TOKEN` configure persistence, authentication, and rate-limit state. `PORT` and `NODE_ENV` control the server; demo-account overrides are optional.
- Frontend: `VITE_API_URL` selects the backend base URL.

## Deployment

The frontend is deployed on Vercel and the Express backend on Render. The deployed backend uses Neon PostgreSQL and Upstash Redis. Production environment variables are configured by the hosting platforms rather than committed to the repository.

## Future Improvements

- Team and workspace roles for shared API administration.
- API versioning and usage-plan or quota policies.
- Configurable analytics retention and export.

## Author

[Niraj Ubhe](https://github.com/niraj-ubhe)
