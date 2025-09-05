// Export AWS client wrappers
export * from './s3-client';
export * from './secrets-client';

// Re-export commonly used AWS SDK types
export type { 
  S3ClientConfig,
  PutObjectCommandInput,
  GetObjectCommandInput 
} from '@aws-sdk/client-s3';

export type { 
  SecretsManagerClientConfig 
} from '@aws-sdk/client-secrets-manager';