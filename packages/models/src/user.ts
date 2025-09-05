import { z } from 'zod';
import { ObjectId } from 'mongodb';

/**
 * User database model schema
 * Represents the actual structure stored in MongoDB
 */
export const UserModel = z.object({
  _id: z.instanceof(ObjectId),
  email: z.string().email(),
  name: z.string(),
  role: z.enum(['user', 'admin']),
  passwordHash: z.string().optional(), // Internal field, never exposed in DTOs
  emailVerified: z.boolean().default(false),
  createdAt: z.date(),
  updatedAt: z.date(),
});

/**
 * User creation input for database operations
 */
export const CreateUserModel = UserModel.omit({ 
  _id: true, 
  createdAt: true, 
  updatedAt: true 
}).extend({
  _id: z.instanceof(ObjectId).optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

/**
 * User update input for database operations
 */
export const UpdateUserModel = CreateUserModel.partial();

export type UserModel = z.infer<typeof UserModel>;
export type CreateUserModel = z.infer<typeof CreateUserModel>;
export type UpdateUserModel = z.infer<typeof UpdateUserModel>;