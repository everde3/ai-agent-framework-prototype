# AI Agent Framework - Turborepo Monorepo

A modern monorepo demonstrating full-stack health monitoring with React frontend and Fastify backend.

## Project Structure

```
ai-agent-framework-prototype/
├── apps/
│   ├── api/                 # Fastify backend with health endpoint
│   └── web/                 # React frontend with health dashboard
├─ packages/
│   ├─ dtos/                 # Shared data transfer objects
│   ├─ models/               # Typed models that shows what the data schema looks like in the database
│   ├─ service-actions/      # Functions to perform actions across services, frontend to backend request, response, query params, and error handling
│   ├─ service-contracts/    # API request/response definitions between apps/services
│   ├─ isomorphic-utils/     # Utilities shared across backend and frontend
│   ├─ backend-utils/        # Backend-specific helper functions
│   ├─ aws-sdk/              # AWS SDK for backend services
│   └─ ai/                   # AI-related utilities, prompts, and agents
└── dev.sh                   # Development script
```

## Tech Stack

- **Monorepo**: Turborepo with pnpm workspaces
- **Backend**: Fastify with Zod validation
- **Frontend**: React with Vite
- **TypeScript**: Strict configuration with shared types
- **Validation**: Zod schemas for runtime type safety

## Quick Start

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Start development servers
./dev.sh
```

## Available Scripts

- `pnpm build` - Build all apps and packages
- `pnpm dev` - Start development servers for all apps
- `pnpm lint` - Lint all apps and packages
- `pnpm type-check` - Run TypeScript checks
- `pnpm clean` - Clean build artifacts

## Development

The development script (`./dev.sh`) starts both:

- API server on http://localhost:3001
- Web application on http://localhost:3000

The web app automatically proxies API requests to the backend.

## API Endpoints

- `GET /health` - Returns system health status

## Features

- Real-time health monitoring dashboard
- Shared TypeScript types for type safety
- Zod validation for runtime type checking
- Modern monorepo setup with Turborepo
- Hot reload for development
- CORS configured for frontend access
