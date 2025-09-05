# @repo/models

## Purpose
Database model schemas using Zod for MongoDB document validation and type safety. These represent the actual structure of data stored in the database.

## Contents
- **User Models** (`user.ts`): User account database schema with authentication fields
- **AI Agent Models** (`ai-agent.ts`): AI agent, chat session, and message schemas
- **Common Models** (`common.ts`): Shared base models, audit fields, and API key schemas

## Current Status
❌ Not currently used (but ready for database implementation)

## Future Use Cases
- **Database validation**: Ensure data integrity when inserting/updating MongoDB documents
- **Type safety**: TypeScript types for database operations
- **Schema evolution**: Track and validate database schema changes over time
- **Data migration**: Validate data during database migrations
- **Repository layer**: Type-safe database query results

## Installation
```bash
pnpm add @repo/models
```

## Usage Example
```typescript
import { UserModel, CreateUserModel, AIAgentModel } from '@repo/models';
import { ObjectId } from 'mongodb';

// Create a new user document
const newUser = CreateUserModel.parse({
  email: 'user@example.com',
  name: 'John Doe',
  role: 'user',
  passwordHash: 'hashed_password_here',
  emailVerified: false
});

// Insert with MongoDB
const userId = new ObjectId();
const userDoc = {
  ...newUser,
  _id: userId,
  createdAt: new Date(),
  updatedAt: new Date()
};

// Validate existing document from database
const existingUser = UserModel.parse(documentFromDb);

// Type-safe field access
console.log(existingUser.email); // TypeScript knows this is a string
```

## Architecture Notes
- **Database-first**: Models represent actual MongoDB document structure
- **ObjectId support**: Uses MongoDB ObjectId for _id fields and references
- **Audit trails**: Common audit fields (createdAt, updatedAt, etc.)
- **Internal fields**: Includes fields like passwordHash that should never be exposed via DTOs
- **Validation**: Runtime validation with Zod + compile-time TypeScript types
- **Relationships**: Uses ObjectId references for document relationships

## Key Differences from DTOs
- Models include **internal fields** (passwordHash, keyHash, etc.)
- Models use **ObjectId** for MongoDB compatibility
- Models include **database metadata** (createdAt, updatedAt, etc.)
- DTOs are for **API contracts**, Models are for **data persistence**