# @repo/backend-utils

## Purpose
Backend-specific helper functions and utilities for server-side operations, database handling, and Node.js environments.

## Contents
- **Database utilities** (`is-objectid`, `remove-duplicate-objectids`): MongoDB ObjectId handling
- **Environment utilities** (`env-schema`, `lookup-database-environment`): Environment configuration and validation
- **AWS utilities** (`get-lambda-function-name`): AWS Lambda specific helpers
- **Observability** (`observability`): Logging, monitoring, and telemetry utilities
- **Connection pools** (`pools`): Database and service connection pooling
- **Reporting utilities** (`reporting-utils`): Backend report generation and data processing
- **CSV utilities** (`csv`): CSV parsing, generation, and processing
- **Cohort utilities** (`cohort-utils`): User cohort and segmentation utilities

## Current Status
❌ Not currently used by apps (but contains useful backend utilities)

## Future Use Cases
- **Database operations**: Safe ObjectId handling and MongoDB utilities
- **Environment management**: Configuration validation and environment detection
- **AWS services**: Lambda function utilities and AWS integrations
- **Data processing**: CSV handling, reporting, and analytics
- **Performance**: Connection pooling for databases and external services
- **Monitoring**: Application observability and health checks

## Installation
```bash
pnpm add @repo/backend-utils
```

## Usage Example
```typescript
import { 
  isObjectId, 
  removeDuplicateObjectIds,
  validateEnvSchema,
  createConnectionPool,
  generateCsv 
} from '@repo/backend-utils';

// ObjectId validation
if (isObjectId(id)) {
  // Safe to use as ObjectId
}

// Clean up duplicate ObjectIds
const uniqueIds = removeDuplicateObjectIds([id1, id2, id1]);

// Environment validation
const config = validateEnvSchema({
  DATABASE_URL: process.env.DATABASE_URL,
  PORT: process.env.PORT
});

// Connection pooling
const pool = createConnectionPool({
  connectionString: config.DATABASE_URL,
  maxConnections: 10
});

// CSV processing
const csvData = generateCsv(data, { headers: true });
```

## Architecture Notes
- Node.js specific utilities (not for browser use)
- Handles database connections and server-side operations
- Integrates with AWS services and cloud infrastructure
- Focused on performance and reliability for backend services
- Comprehensive error handling and validation