import { z } from "zod";

// Health check response schema
export const HealthResponseSchema = z.object({
  status: z.enum(["healthy", "unhealthy"]),
  timestamp: z.string().datetime(),
  uptime: z.number().positive(),
  version: z.string().optional(),
});

export type HealthResponse = z.infer<typeof HealthResponseSchema>;

// API error response schema
export const ErrorResponseSchema = z.object({
  error: z.string(),
  message: z.string(),
  statusCode: z.number(),
  timestamp: z.string().datetime(),
});

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;

// AI endpoint request/response schemas
export const AIRequestSchema = z.object({
  // For future use - accepting any JSON for now
  data: z.record(z.unknown()).optional(),
});

export type AIRequest = z.infer<typeof AIRequestSchema>;

export const AIResponseSchema = z.object({
  message: z.string(),
  type: z.enum(["chat", "rag", "prompt"]),
});

export type AIResponse = z.infer<typeof AIResponseSchema>;

// Export all schemas for validation
export { z };