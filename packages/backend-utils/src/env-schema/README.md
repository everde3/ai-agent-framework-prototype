# Environment Validation with Zod

## How to use

The `validateEnv` function validates environment variables according to a predefined schema. You need to pass an array of strings as an argument, where each string is the name of an environment variable that needs to be validated.

```typescript
const requiredKeys = ["AWS_REGION", "BUCKET", "JWT_LOCATION"];
const ENV = validateEnv(requiredKeys);
```

The function will return an object with the validated keys and their values. If an environment variable is missing or does not match the schema, an error will be thrown.

## How to add new environment variables

To add new environment variables, define a new key-value pair in the `envSchema` object.

```typescript
const envSchema: EnvSchema = {
  ...,
  NEW_ENV_VAR: z.string(),  // replace `NEW_ENV_VAR` with your variable name and `z.string()` add transform if it is not a string
  NEW_ENV_BOOLEAN: z.string().transform((val) => val === 'true'), // transform string to boolean
  NEW_ENV_NUMBER: z.string().regex(/^\d+$/).transform(Number), // transform string to number
  NEW_ENV_STARTS_WITH: z.string().startsWith('prefix'), // check if string starts with prefix
  NEW_ENV_UNION: z.union([z.literal('foo'), z.literal('bar')]), // check if string is either 'foo' or 'bar' NOTE: Try to avoid using enums for better error messages

  ...
}
```

Please refer to the [Zod documentation](https://github.com/colinhacks/zod#readme) for more information about defining schemas.

## Benefits of using Zod for environment validation

1. **Type Safety**: Zod ensures that your environment variables match the expected types at runtime, which can prevent many common bugs.
2. **Error Handling**: Zod provides detailed error messages when an environment variable does not match its schema.
3. **Nomenclature Uniformity**: Allows for a consistent naming convention for environment variables.
4. **Documentation**: The schema is defined in a single location, which makes it easy to understand what environment variables are required and what their expected types are.

## Currently in use by

- [api] - API
- [lambdas] - Lambdas (Node only)
