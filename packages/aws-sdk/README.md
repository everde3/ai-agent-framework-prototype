# @repo/aws-sdk

## Purpose
Simplified AWS SDK wrapper providing essential cloud services for the AI demo application. Focuses on file storage and configuration management.

## Contents
- **S3 Client** (`s3-client.ts`): File upload, download, deletion, and presigned URL generation
- **Secrets Manager Client** (`secrets-client.ts`): Configuration and API key management
- **Type exports**: Re-exports commonly used AWS SDK types for convenience

## Current Status
❌ Not currently used by apps (but ready for cloud deployment)

## Future Use Cases
- **File storage**: Store user uploads, AI-generated content, and application assets
- **Configuration management**: Securely store API keys, database credentials, and environment variables
- **Presigned URLs**: Enable direct client-to-S3 uploads without exposing credentials
- **Content delivery**: Serve static assets and user-generated content
- **Backup and archival**: Store application data and logs for compliance and recovery

## Installation
```bash
pnpm add @repo/aws-sdk
```

## Usage Example
```typescript
import { S3ClientWrapper, SecretsClientWrapper } from '@repo/aws-sdk';

// Initialize S3 client
const s3Client = new S3ClientWrapper({
  region: 'us-east-1',
  bucketName: 'my-ai-app-bucket'
});

// Upload a file
await s3Client.uploadFile('uploads/avatar.jpg', fileBuffer, 'image/jpeg');

// Generate presigned download URL
const downloadUrl = await s3Client.getDownloadUrl('uploads/avatar.jpg', 3600);

// Initialize Secrets Manager client
const secretsClient = new SecretsClientWrapper({
  region: 'us-east-1'
});

// Get API keys from secrets
const openaiKey = await secretsClient.getSecret('prod/openai-api-key');

// Get database config as JSON
const dbConfig = await secretsClient.getSecretJson<{
  host: string;
  port: number;
  database: string;
}>('prod/database-config');

// Get multiple secrets at once
const secrets = await secretsClient.getSecrets([
  'prod/openai-api-key',
  'prod/anthropic-api-key'
]);
```

## Architecture Notes
- **Simplified interface**: Wraps complex AWS SDK calls with clean, focused methods
- **Error handling**: Provides meaningful error messages for common failure scenarios
- **Type safety**: Full TypeScript support with proper AWS SDK type integration
- **Resource management**: Handles AWS client lifecycle and connection pooling
- **Security**: Supports IAM roles, temporary credentials, and least-privilege access
- **Performance**: Optimized for common patterns like presigned URLs and streaming uploads

## Configuration
Requires AWS credentials configured via:
- Environment variables (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`)
- IAM roles (recommended for EC2/Lambda deployment)
- AWS credential files
- Or explicit configuration in client constructor

## Security Best Practices
- Use IAM roles instead of hardcoded credentials
- Grant minimal required permissions for each service
- Rotate credentials regularly
- Use VPC endpoints for internal traffic
- Enable CloudTrail logging for audit trails