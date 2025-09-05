# @repo/isomorphic-utils

## Purpose
Shared utility functions and helpers that work across both backend and frontend environments (isomorphic/universal code).

## Contents
- **Date utilities** (`date-utils`): Date formatting, timezone handling, parsing
- **String utilities** (`string-utils`): String manipulation, validation, formatting  
- **Type utilities** (`typescript-utils`): TypeScript helper types and utilities
- **Zod utilities** (`zod`): Schema validation helpers and extensions
- **Cache utilities** (`simple-cache`): Lightweight caching mechanisms
- **URL utilities** (`url-utils`): URL parsing, validation, and manipulation
- **Sanitization** (`sanitization`): Input sanitization and cleaning
- **Object utilities** (`get`, `is-plain-object`, `shrink-object-size`): Object manipulation helpers
- **Async utilities** (`invoke-safe`, `promise-resolver`): Safe async operations and promise handling
- **Error utilities** (`errors`, `invariant`): Error handling and assertion utilities
- **Format utilities** (`formatUptime`, `createTimestamp`, `delay`): Common formatting functions
- **Constants** (`constants`): Shared application constants
- **Regex validators** (`regex-validators`): Common validation patterns

## Current Status
✅ Used by current apps (merged from @repo/shared-utils and @repo/utils-isomorphic)

## Future Use Cases
- **Frontend validation**: Client-side form validation and data processing
- **Backend validation**: Server-side request validation and sanitization  
- **Shared business logic**: Logic that needs to work on both client and server
- **Type safety**: Consistent typing across frontend and backend
- **Caching**: Lightweight caching for both browser and server environments

## Installation
```bash
pnpm add @repo/isomorphic-utils
```

## Usage Example
```typescript
import { 
  formatUptime, 
  createTimestamp, 
  delay,
  safeGet,
  isPlainObject,
  sanitizeHtml 
} from '@repo/isomorphic-utils';

// Time formatting
const uptime = formatUptime(3661); // "1h 1m 1s"
const timestamp = createTimestamp(); // "2023-01-01T12:00:00.000Z"

// Safe async operations
await delay(1000); // Wait 1 second

// Safe object access
const value = safeGet(obj, 'nested.property', 'default');

// Type checking
if (isPlainObject(data)) {
  // Process object safely
}

// Sanitization
const clean = sanitizeHtml(userInput);
```

## Architecture Notes
- All utilities work in both Node.js and browser environments
- No environment-specific dependencies (DOM, Node APIs, etc.)
- Pure functions with predictable behavior
- Comprehensive TypeScript support
- Well-tested with high code coverage