# @repo/service-actions

## Purpose
Service action implementations that handle business logic and communication between frontend and backend services. These are the functions that execute actual operations on behalf of the UI.

## Contents
- **User Actions** (`user-actions.ts`): User management operations (CRUD)
- **AI Agent Actions** (`ai-agent-actions.ts`): AI agent management and chat functionality
- **Future actions**: Additional service actions for other domain entities

## Current Status
❌ Not currently used (placeholder implementation for future architecture)

## Future Use Cases
- **Frontend**: Call service actions from React components instead of direct API calls
- **Backend**: Implement these actions as API handlers or service layer functions
- **Testing**: Mock these actions for unit and integration tests
- **Type Safety**: Ensure consistent interfaces between frontend and backend
- **Business Logic**: Centralize business rules and validation logic

## Installation
```bash
pnpm add @repo/service-actions
```

## Usage Example
```typescript
import { createUserActions, createChatActions } from '@repo/service-actions';
import type { CreateUserInputDto } from '@repo/dtos';

// Initialize actions (would be dependency-injected in real implementation)
const userActions = createUserActions();
const chatActions = createChatActions();

// Use in frontend components
const handleCreateUser = async (userData: CreateUserInputDto) => {
  try {
    const user = await userActions.createUser(userData);
    console.log('User created:', user);
  } catch (error) {
    console.error('Failed to create user:', error);
  }
};

// Use in backend handlers
const handleChatMessage = async (messageInput: SendChatMessageInputDto) => {
  const response = await chatActions.sendMessage(messageInput);
  return response;
};
```

## Architecture Notes
- Actions are interfaces that define what operations are available
- Implementations can be swapped based on environment (client-side vs server-side)
- All actions use DTOs for type safety and validation
- Actions abstract away the complexity of API calls, database operations, or AI integrations
- Supports dependency injection for testing and different environments

## Implementation Strategy
When ready to implement:
1. **Frontend**: Replace actions with API client calls to backend
2. **Backend**: Replace actions with database operations and business logic
3. **Testing**: Mock actions for isolated component testing
4. **Validation**: Use DTOs to ensure data consistency across layers