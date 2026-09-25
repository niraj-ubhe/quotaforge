# QuotaForge — Developer API Management Platform

QuotaForge is a control plane and API gateway for registering upstream APIs, issuing hashed API keys, enforcing Redis-backed rate limits, and inspecting request analytics.

## Features

- JWT user authentication
- API registration and configuration
- API key generation, revocation, and activation
- Gateway proxy with `x-api-key` authentication
- Rate limiting: Fixed Window, Sliding Window, Token Bucket
- Redis (Upstash) for rate-limit state
- Request logging and analytics
- PostgreSQL + Prisma
- React + TypeScript dashboard
- Docker Compose for local PostgreSQL

## Architecture

```
Client  →  QuotaForge Dashboard (React / Vite)
                ↓ JWT
           Control-plane API (Express)
                ↓
           PostgreSQL (Prisma)

Consumer →  /gateway/:apiId/*  +  x-api-key
                ↓
           API key middleware → rate limiter (Redis) → upstream proxy
                ↓
           ApiRequest log → analytics
```

## Project structure

```
quotaforge/
├── backend/          Express + Prisma API, gateway, rate limiting
├── frontend/         React dashboard
├── docker-compose.yml
└── README.md
```

## Prerequisites

- Node.js 20+
- Docker (for PostgreSQL) or a local Postgres instance
- An Upstash Redis REST database (used by the rate limiter)

## Environment

Copy the examples and fill in local values. Do not commit real secrets.

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Backend variables:

| Name | Purpose |
| --- | --- |
| `PORT` | API port (default `5000`) |
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Signing secret for dashboard JWTs |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis URL |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis token |

Frontend:

| Name | Purpose |
| --- | --- |
| `VITE_API_URL` | Backend origin, default `http://localhost:5000` |

## Run PostgreSQL

```bash
docker compose up -d
```

This starts Postgres 17 on `localhost:5432` with database `quotaforge`, user `postgres`, password `postgres`.

Apply the schema:

```bash
cd backend
npx prisma generate
npx prisma db push
```

## Run the backend

```bash
cd backend
npm install
npm run dev
```

Health check: `GET http://localhost:5000/health`

## Run the frontend

```bash
cd frontend
npm install
npm run dev
```

Open the Vite URL (typically `http://localhost:5173`), register an account, then sign in.

## Gateway usage

Create an API in the dashboard, then create an API key. The raw key is shown **once**. Send it on every gateway request:

```bash
curl -i http://localhost:5000/gateway/<API_ID>/some/path \
  -H "x-api-key: qf_live_XXXX.<secret>"
```

A revoked key returns:

```json
{ "success": false, "message": "API key has been revoked" }
```

### Rate-limit example

For an API configured at **5 requests/minute**:

- Requests 1–5 succeed (subject to the upstream)
- Requests 6 and 7 return HTTP **429** with `{ "success": false, "message": "Rate limit exceeded" }`

## Scripts

Backend: `npm run dev`, `npm run build`, `npm start`, `npm test`

Frontend: `npm run dev`, `npm run build`, `npm run preview`
