# QuotaForge

**Developer API Management & Gateway Platform**

QuotaForge is a multi-tenant API management platform that lets developers register upstream APIs, issue and manage API keys, protect gateway traffic with configurable rate limits, and monitor API usage through analytics.

**Live Demo:** [QuotaForge](https://quotaforge.vercel.app/login)

## What it does

QuotaForge sits between API consumers and upstream services:

```text
API Consumer
     │
     │  API request + x-api-key
     ▼
QuotaForge Gateway
     │
     ├── API-key authentication
     ├── Rate limiting
     ├── Request logging
     └── Analytics
     │
     ▼
Upstream API
```

The dashboard provides a control plane for managing APIs, keys, rate limits, and traffic analytics.

## Features

### API Management
- Register upstream APIs
- Edit API configuration
- Configure per-API rate limits
- Delete APIs with confirmation
- Automatic API ID generation

### API Keys
- Generate API keys
- Secure key handling
- Revoke keys
- Reactivate revoked keys
- Gateway authentication through `x-api-key`

### Rate Limiting
Supports three algorithms:

- Fixed Window
- Sliding Window
- Token Bucket

Rate-limit state is stored in Redis so gateway traffic can be controlled independently of the dashboard.

### Gateway
Requests are proxied through:

```text
/gateway/:apiId/*
```

Example:

```text
/gateway/<API_ID>/posts
```

The gateway authenticates the API key, applies rate limiting, forwards the request to the configured upstream API, and records request information for analytics.

### Analytics
The dashboard provides:

- Request timeline
- HTTP status-code breakdown
- Top endpoints
- Request counts
- Rate-limit activity

Endpoint analytics normalize gateway paths so equivalent requests are represented by the actual upstream endpoint, for example:

```text
/posts
```

rather than:

```text
/gateway/<apiId>/posts
```

### Dashboard UI
- Dark/light theme toggle
- Responsive dashboard
- Consistent reusable components
- Confirmation dialogs
- Toast notifications
- Interactive analytics charts
- Polished authentication screens

## Tech Stack

### Frontend
- React
- TypeScript
- Vite
- Chart.js
- Lucide React

### Backend
- Node.js
- Express
- TypeScript
- Prisma
- JWT
- Zod
- bcrypt
- Axios

### Data & Infrastructure
- PostgreSQL
- Neon
- Redis / Upstash
- Docker Compose for local development

### Deployment
- Frontend: Vercel
- Backend: Render
- Database: Neon
- Redis: Upstash

## Project Structure

```text
quotaforge/
├── backend/
│   ├── prisma/
│   └── src/
├── frontend/
│   ├── public/
│   └── src/
├── docker-compose.yml
└── README.md
```

## Local Development

### Prerequisites

- Node.js 20+
- npm
- Docker Desktop
- PostgreSQL or Docker
- Upstash Redis account for rate limiting

### 1. Clone the repository

```bash
git clone https://github.com/niraj-ubhe/quotaforge.git
cd quotaforge
```

### 2. Configure the backend

Copy:

```text
backend/.env.example
```

to:

```text
backend/.env
```

Set:

```env
PORT=5000
NODE_ENV=development
DATABASE_URL=your_postgresql_connection_string
JWT_SECRET=your_jwt_secret
UPSTASH_REDIS_REST_URL=your_upstash_redis_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_token
```

Never commit `.env` files or real credentials.

### 3. Configure the frontend

Copy:

```text
frontend/.env.example
```

to:

```text
frontend/.env
```

For local development:

```env
VITE_API_URL=http://localhost:5000
```

### 4. Install dependencies

Backend:

```bash
cd backend
npm install
```

Frontend:

```bash
cd ../frontend
npm install
```

### 5. Generate Prisma Client and migrate

From `backend/`:

```bash
npx prisma generate
npx prisma migrate dev
```

For an already-created deployment database, use the appropriate Prisma migration command rather than `db push`.

### 6. Start the backend

From `backend/`:

```bash
npm run dev
```

Backend health check:

```text
GET /health
```

### 7. Start the frontend

From `frontend/`:

```bash
npm run dev
```

Open the Vite development URL shown in the terminal.

## Gateway Example

After registering an API and generating an API key:

```bash
curl -i http://localhost:5000/gateway/<API_ID>/posts \
  -H "x-api-key: <API_KEY>"
```

The same request can be sent to the deployed backend by replacing the local backend origin with the production backend URL.

## Example Rate-Limit Flow

For an API configured for 5 requests per minute:

```text
Requests 1–5  →  upstream request
Requests 6+   →  HTTP 429
```

The exact result also depends on the selected rate-limiting algorithm and upstream response.

## Testing

Backend build:

```bash
cd backend
npm run build
```

Backend tests:

```bash
npm test
```

Frontend production build:

```bash
cd frontend
npm run build
```

## Production Architecture

```text
                         ┌─────────────────────┐
                         │       Vercel        │
                         │  React / Vite App   │
                         └──────────┬──────────┘
                                    │
                                    │ HTTPS / REST
                                    ▼
                         ┌─────────────────────┐
                         │       Render        │
                         │ Express / Node API  │
                         └───────┬─────┬───────┘
                                 │     │
                    ┌────────────┘     └────────────┐
                    ▼                               ▼
             ┌─────────────┐                 ┌─────────────┐
             │    Neon     │                 │   Upstash   │
             │ PostgreSQL  │                 │    Redis    │
             └─────────────┘                 └─────────────┘
```

## Security Notes

- API keys are not intended to be stored as plaintext credentials.
- Raw API keys should be treated as secrets.
- JWT signing secrets must be long, random, and private.
- Production environment variables must be configured through the deployment platform.
- Do not commit `.env` files, database credentials, Redis tokens, or API keys.

## Current Status

QuotaForge currently includes:

- Authentication
- API registration and editing
- API deletion with confirmation
- API-key generation, revocation, and activation
- Gateway proxying
- Fixed Window, Sliding Window, and Token Bucket rate limiting
- Request logging
- Normalized endpoint analytics
- Status and timeline analytics
- Dark/light theme support
- Production frontend and backend deployments

## Roadmap

Possible future improvements:

- API usage quotas
- Per-key rate limits
- API versioning
- Request/response inspection
- Advanced analytics filters
- API documentation generation
- Team/workspace management
- Automated CI checks
- Custom domains and production observability

## Author

**Niraj Ubhe**

Built as a full-stack backend-focused project to explore API gateways, authentication, rate limiting, distributed state, analytics, and production deployment.
