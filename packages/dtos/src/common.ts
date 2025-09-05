import { z } from 'zod';

/**
 * Common error response DTO
 */
export const ErrorResponseDto = z.object({
  error: z.string(),
  message: z.string(),
  statusCode: z.number(),
  timestamp: z.string().datetime(),
});

/**
 * Common success response DTO
 */
export const SuccessResponseDto = z.object({
  success: z.boolean().default(true),
  message: z.string().optional(),
});

/**
 * Paginated response wrapper DTO
 */
export const PaginatedResponseDto = <T extends z.ZodType>(dataSchema: T) => z.object({
  data: z.array(dataSchema),
  pagination: z.object({
    page: z.number().min(1),
    limit: z.number().min(1),
    total: z.number().min(0),
    totalPages: z.number().min(0),
  }),
});

/**
 * API key DTO
 */
export const ApiKeyDto = z.object({
  id: z.string().uuid(),
  name: z.string(),
  key: z.string(), // This would be masked in real responses
  isActive: z.boolean(),
  lastUsed: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
});

/**
 * Create API key input DTO
 */
export const CreateApiKeyInputDto = z.object({
  name: z.string().min(2, 'API key name must be at least 2 characters'),
});

export type ErrorResponseDto = z.infer<typeof ErrorResponseDto>;
export type SuccessResponseDto = z.infer<typeof SuccessResponseDto>;
export type ApiKeyDto = z.infer<typeof ApiKeyDto>;
export type CreateApiKeyInputDto = z.infer<typeof CreateApiKeyInputDto>;