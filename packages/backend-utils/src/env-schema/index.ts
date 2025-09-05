import dotenv from "dotenv";
import { z } from "zod";

export const DB_CORE_SECRET_ID = z.union([
  z.literal("dev/talent/database"),
  z.literal("staging/talent/database"),
  z.literal("sandbox/talent/database"),
  z.literal("prod/talent/database"),
  z.literal("preview/talent/database"),
]);

export type DB_CORE_SECRET_ID = z.infer<typeof DB_CORE_SECRET_ID>;

export const DB_REPORTING_SECRET_ID = z.union([
  z.literal("test/reporting/database"),
  z.literal("prod/reporting/database"),
  z.literal("sandbox/reporting/database"),
  z.literal("preview/reporting/database"),
]);

export type DB_REPORTING_SECRET_ID = z.infer<typeof DB_REPORTING_SECRET_ID>;

export const NODE_ENV = z.union([
  z.literal("development"),
  z.literal("test"),
  z.literal("production"),
  z.literal("local"),
  z.literal("preview"),
]);

export type NODE_ENV = z.infer<typeof NODE_ENV>;

const ARN_SECRET_PREFIX = "arn:aws:secretsmanager:us-east-1:";

const isLocalEnvironment = process.env.NODE_ENV === "local";

const envSchema = {
  NODE_ENV: NODE_ENV,
  AWS_REGION: z.literal("us-east-1"),
  JWT_LOCATION: z.string(),
  repo_DEBUG: z.string().transform((value) => value.toLowerCase() === "true"),
  SIGNED_URL_EXPIRE_TIME: z.string().regex(/^\d+$/).transform(Number),
  APOLLO_GRAPH_VARIANT: z.string(),
  APOLLO_SCHEMA_REPORTING: z.string(),
  EMAIL_ONLY_repo_EMPLOYEES: z
    .string()
    .transform((value) => value.toLowerCase() === "true"),
  ENGAGEMENT_SURVEY_URL: z.string().url(),
  RBAC_CONFIG_FILE: z.string(),
  SECRET_TOKENS_CONFIG: z.string(),
  FINGERPRINT_IGNORE_CONFIG: z.string(),
  ENCRYPTION_KEYS_CONFIG: z.string(),
  DATABASE_CONFIG: z.string(),
  STRIPE_CONFIG: z.string(),
  SLACK_CONFIG: z.string(),
  GOOGLE_CONFIG: z.string(),
  MICROSOFT_CONFIG: z.string(),
  ADP_CONFIG: z.string(),
  BAMBOOHR_CONFIG: z.string(),
  NETCHEX_CONFIG: z.string(),
  GUSTO_CONFIG: z.string(),
  LAMBDA_CONFIG: z.string(),
  MAILGUN_CONFIG: z.string(),
  MAILGUN_SECRET_ID: z.string(),
  LAMBDACHOPS_CONFIG: z.string(),
  TOKENS_CONFIG: z.string(),
  RIPPLING_CONFIG: z.string(),
  REPORTING_DB_CONFIG: z.string(),
  // dev/talent/database
  DB_CORE_SECRET_ID: DB_CORE_SECRET_ID,
  DB_REPORTING_SECRET_ID: DB_REPORTING_SECRET_ID,
  // arn:aws:secretsmanager:us-east-1:093971988747:secret:dev/talent/database-Ambqe6
  DB_CORE_SECRET_ARN: z.string().startsWith(ARN_SECRET_PREFIX),
  DB_REPORTING_SECRET_ARN: z.string().startsWith(ARN_SECRET_PREFIX),
  repo_HOST: z.string().url(),
  COOKIE_DOMAIN: z.string(),
  SFTP_S3_BUCKET: z.string(),
  CSV_S3_BUCKET: z.string(),
  DOCUMENT_S3_BUCKET: z.string(),
  LOGGING_S3_BUCKET: z.string(),
  LAMBDA_JOB_ARN: z.string().startsWith(ARN_SECRET_PREFIX),
  ENCRYPTION_SECRET_ARN: z.string().startsWith(ARN_SECRET_PREFIX),
  FINGERPRINT_TOKEN_ARN: z.string().startsWith(ARN_SECRET_PREFIX),
  GUSTO_SECRET_ARN: z.string().startsWith(ARN_SECRET_PREFIX),
  GUSTO_DOMAIN: z.string().url(),
  ADP_SECRET_ARN: z.string().startsWith(ARN_SECRET_PREFIX),
  RIPPLING_SECRET_ARN: z.string().startsWith(ARN_SECRET_PREFIX),
  UKG_SECRET_ARN: z.string().startsWith(ARN_SECRET_PREFIX),
  NETCHEX_SECRET_ARN: z.string().startsWith(ARN_SECRET_PREFIX),
  MICROSOFT_SECRET_ARN: z.string().startsWith(ARN_SECRET_PREFIX),
  REPORTING_SQS_URL: z.string().url(),
  REPORTING_SQS_ARN: z.string().startsWith("arn:aws:sqs:us-east-1:"),
  WORKERS_SQS_QUEUE_URL: z.string().url(),
  SYNC_MORATORIUM_IN_HOURS: z
    .string()
    .regex(/^\d*\.?\d*$/) // Matches any number, including decimals
    .transform(Number),
  // TODO: Create a union of all the possible values
  CLOUDFRONT_DISTRIBUTION_ID: z.string(),
  APOLLO_KEY: z.string(),
  APOLLO_GRAPH_ID: z.string(),
  PORT: z.string().regex(/^\d+$/).transform(Number),
  SENTRY_DSN: isLocalEnvironment
    ? z.string().url().optional()
    : z.string().url(),
  SENTRY_ENVIRONMENT: isLocalEnvironment ? z.string().optional() : z.string(),
  SENTRY_RELEASE: isLocalEnvironment ? z.string().optional() : z.string(),
  API_GATEWAY_USAGE_PLAN_ID: z.string(),
  GIT_HASH: isLocalEnvironment ? z.string().optional() : z.string(),
  GIT_BRANCH: isLocalEnvironment ? z.string().optional() : z.string(),
  ENVIRONMENT_STAGE: isLocalEnvironment ? z.string().optional() : z.string(),
  TEST_MODE_OVERRIDE: z
    .string()
    .transform((value) => value.toLowerCase() === "true")
    .optional(),
  SHOULD_DELETE_SOURCE: z
    .string()
    .transform((value) => value.toLowerCase() === "true")
    .optional(),
  ACCOUNT_ID: z.string(),
  MAX_FILE_SIZE: z.number(),
  MEDIA_CDN_URL: z.string().url(),
  FORCE_INSTALL: z.string(),
  ENABLE_OPEN_TELEMETRY: z.string(),
  TESTING_MODE: z.string().transform((value) => value.toLowerCase() === "true"),
  CREATE_INDEXES: z
    .string()
    .transform((value) => value.toLowerCase() === "true"),
  TEMPLATE_DIR: z.string().default("templates"),
  SKIP_KEY_CHECK: z
    .string()
    .transform((value) => value.toLowerCase() === "true"),
  VERBOSE: z.string().transform((value) => value.toLowerCase() === "true"),
  OPEN_TELEMETRY_LOGGING_LEVEL: z.number().default(40),
  LOG_LEVEL: z.string().default("info"),
  REDIS_HOST: z.string().url(),
  REDIS_PORT: z.number(),
  SANDBOX_IMPORTER: z.string(),
  SANDBOX_FILE: z.string(),
  FRESHDESK_CONFIG: z.string(),
  AVALARA_CONFIG: z.string(),
  EVENT_CONSUMER_DELAY_SEC: z.string().default("30"),
  AI_SUMMARIZATION_SQS_QUEUE_URL: z.string().url(),
};

/**
 * EnvKeys is a union of all the keys in the envSchema object
 */
export type EnvKeys = keyof typeof envSchema;

/**
 * EnvType is an object that contains all the keys in the envSchema object and their types
 */
export type EnvType = {
  [K in EnvKeys]: z.infer<(typeof envSchema)[K]>;
};

export const isOptional = (schema: z.ZodTypeAny) => {
  return schema.isOptional() || schema.isNullable();
};

export const loadEnvVariables = (): void => {
  const result = dotenv.config({ path: ".env" });

  if (result.error) {
    throw new Error(`Failed to load environment variables: ${result.error}`);
  }
};

/**
 * This function validates environment variables and ensures nomenclature consistency.
 * The function checks if all the keys provided in the params exist in the environment
 * variables, and then validates the environment variable matches the provided schema.
 * If a key is not defined in the schema, an error is thrown.
 * If the value of a key is not valid according to the schema, an error is thrown.
 *
 * @param envKeyArray - an array of strings representing the keys that need to be validated.
 * @returns an object containing the validated keys and their corresponding values.
 * @throws will throw an error if a key is missing in the environment variables, or if the value of a key is not valid according to the schema.
 *
 * @example
 * ```typescript
 *   // Define the keys that need to be validated
 *   const requiredKeys = ['AWS_REGION', 'BUCKET', 'JWT_LOCATION'];
 *
 *   // Call validateEnv with the required keys
 *   const ENV = validateEnv(requiredKeys);
 * ```
 */
export const validateEnv = <K extends EnvKeys>(
  envKeyArray: K[]
): Pick<EnvType, K> => {
  if (process.env.NODE_ENV === "local") {
    loadEnvVariables();
  }

  // Checking if all the keys exist in the environment variables
  const missingVars = envKeyArray.filter((v) => !process.env[v]);
  if (missingVars.length) {
    throw new Error(
      `Required environment variable ${missingVars.join(", ")} is missing`
    );
  }

  const env = {} as EnvType;
  // Checking each environment key at a time
  for (const key of envKeyArray) {
    // Can we find it?
    if (!envSchema[key]) {
      throw new Error(`Environment variable ${key} is not defined in schema`);
    }

    // Can we get the value
    if (process.env[key]) {
      // lets validate it
      const validationResult = envSchema[key].safeParse(process.env[key]);
      // If the validation is successful, we can add it to the env object
      if (validationResult.success) {
        env[key] = validationResult.data as EnvType[K];
      } else {
        if (process.env.NODE_ENV == "test") {
          // If we are in test environment, we can ignore the error
          env[key] = process.env[key] as EnvType[K];
        } else {
          throw new Error(`Unexpected value type for variable ${key}`);
        }
      }
    } else if (!isOptional(envSchema[key])) {
      if (process.env.NODE_ENV == "test") {
        // If we are in test environment, we can ignore the error
        env[key] = process.env[key] as EnvType[K];
      } else {
        throw new Error(`Required environment variable ${key} is missing`);
      }
    }
  }

  return env;
};
