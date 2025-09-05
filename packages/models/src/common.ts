import { z } from 'zod';
import { ObjectId } from 'mongodb';

/**
 * API key database model schema
 */
export const ApiKeyModel = z.object({
  _id: z.instanceof(ObjectId),
  userId: z.instanceof(ObjectId), // Reference to User._id
  name: z.string(),
  keyHash: z.string(), // Hashed version of the API key
  isActive: z.boolean().default(true),
  lastUsed: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

/**
 * Base audit trail fields that can be extended by other models
 */
export const AuditFields = z.object({
  createdAt: z.date(),
  updatedAt: z.date(),
  createdById: z.instanceof(ObjectId).optional(),
  updatedById: z.instanceof(ObjectId).optional(),
});

/**
 * Common MongoDB document base with ObjectId
 */
export const BaseModel = z.object({
  _id: z.instanceof(ObjectId),
}).extend(AuditFields.shape);

/**
 * API key creation input
 */
export const CreateApiKeyModel = ApiKeyModel.omit({ 
  _id: true, 
  createdAt: true, 
  updatedAt: true,
  lastUsed: true 
}).extend({
  _id: z.instanceof(ObjectId).optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type ApiKeyModel = z.infer<typeof ApiKeyModel>;
export type AuditFields = z.infer<typeof AuditFields>;
export type BaseModel = z.infer<typeof BaseModel>;
export type CreateApiKeyModel = z.infer<typeof CreateApiKeyModel>;