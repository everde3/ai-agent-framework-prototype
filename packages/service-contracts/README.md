# @repo/service-contracts

## Purpose
API request and response definitions using Zod schemas. Defines the contract between frontend and backend services, ensuring consistent data shapes across the application.

## Contents
- **Health check schemas** (`HealthResponseSchema`): Application health and status endpoints
- **Error response schemas** (`ErrorResponseSchema`): Standardized error response format
- **AI endpoint schemas** (`AIRequestSchema`, `AIResponseSchema`): AI service request/response contracts
- **Zod re-export**: Direct access to Zod for schema composition and validation

## Current Status
✅ Used by current apps (both API and web applications depend on this)

## Future Use Cases
- **API validation**: Validate incoming requests and outgoing responses in backend routes
- **Frontend validation**: Validate API responses and prepare request data on the client
- **OpenAPI generation**: Auto-generate API documentation from Zod schemas
- **Type safety**: Ensure consistent TypeScript types across frontend and backend
- **Integration testing**: Validate API contracts in automated tests

## Installation
```bash
pnpm add @repo/service-contracts
```

## Usage Example
```typescript
import { 
  HealthResponseSchema, 
  ErrorResponseSchema, 
  AIRequestSchema, 
  AIResponseSchema, 
  z 
} from '@repo/service-contracts';

// Backend: Validate API response
const healthData = HealthResponseSchema.parse({
  status: 'healthy',
  timestamp: new Date().toISOString(),
  uptime: process.uptime(),
  version: '1.0.0'
});

// Frontend: Type-safe API call
const response = await fetch('/api/health');
const data = await response.json();
const health = HealthResponseSchema.parse(data); // Runtime validation + types

// Create custom endpoint schema
const UserLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

// AI endpoint usage
const aiRequest = AIRequestSchema.parse({
  data: { prompt: 'Hello AI', temperature: 0.7 }
});

const aiResponse = AIResponseSchema.parse({
  message: 'Hello! How can I help you?',
  type: 'chat'
});
```

## Architecture Notes
- **Contract-first**: API contracts are defined independently of implementation
- **Runtime validation**: Zod provides both compile-time types and runtime validation
- **Versioning ready**: Schemas can be versioned for backward compatibility
- **Composable**: Small schemas can be composed into larger contracts
- **Framework agnostic**: Works with any HTTP framework (Fastify, Express, etc.)

## Best Practices
- Keep schemas focused and single-purpose
- Use descriptive names that clearly indicate the API endpoint
- Add validation constraints (min, max, email, etc.) for data integrity
- Document breaking changes when updating schemas
- Use optional fields for backward compatibility
- Separate input and output schemas when they differ significantly

## Integration with Other Packages
- **DTOs vs Contracts**: DTOs (`@repo/dtos`) are for internal data structures, contracts are for API boundaries
- **Models vs Contracts**: Models (`@repo/models`) are for database schemas, contracts are for HTTP APIs
- **Actions**: Service actions (`@repo/service-actions`) implement these contracts
- **Error handling**: Works with error classes from `@repo/isomorphic-utils`