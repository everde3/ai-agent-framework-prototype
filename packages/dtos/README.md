# @repo/dtos

## Purpose
Shared Data Transfer Objects (DTOs) using Zod schemas for type-safe API request and response validation across the entire application.

## Contents
- **User DTOs** (`user.ts`): User creation, updates, and listing
- **AI Agent DTOs** (`ai-agent.ts`): AI agent management and chat functionality
- **Common DTOs** (`common.ts`): Error responses, success responses, pagination, and API keys

## Current Status
❌ Not currently used (but ready for implementation)

## Future Use Cases
- **Frontend**: Validate form inputs before API calls
- **Backend**: Validate incoming requests and format responses
- **Type Safety**: Ensure consistent data shapes across client and server
- **API Documentation**: Auto-generate OpenAPI specs from Zod schemas

## Installation
```bash
pnpm add @repo/dtos
```

## Usage Example
```typescript
import { CreateUserInputDto, UserDto } from '@repo/dtos';

// Validate user input
const userData = CreateUserInputDto.parse({
  email: 'user@example.com',
  name: 'John Doe',
  role: 'user'
});

// Type-safe response
const userResponse: UserDto = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  email: 'user@example.com',
  name: 'John Doe',
  role: 'user',
  createdAt: '2023-01-01T00:00:00.000Z',
  updatedAt: '2023-01-01T00:00:00.000Z'
};
```

## Architecture Notes
- All DTOs use Zod for runtime validation and TypeScript inference
- DTOs are separate from database models to avoid leaking internal fields
- Common patterns are abstracted into reusable schemas
- Pagination and error handling follow consistent patterns