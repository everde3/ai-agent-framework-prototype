import { z } from 'zod';

/**
 * User creation input DTO
 */
export const CreateUserInputDto = z.object({
  email: z.string().email('Valid email is required'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  role: z.enum(['user', 'admin']).optional().default('user'),
});

/**
 * User response DTO (public-facing)
 */
export const UserDto = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string(),
  role: z.enum(['user', 'admin']),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

/**
 * User update input DTO
 */
export const UpdateUserInputDto = CreateUserInputDto.partial();

/**
 * User list query parameters DTO
 */
export const ListUsersQueryDto = z.object({
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(10),
  role: z.enum(['user', 'admin']).optional(),
});

export type CreateUserInputDto = z.infer<typeof CreateUserInputDto>;
export type UserDto = z.infer<typeof UserDto>;
export type UpdateUserInputDto = z.infer<typeof UpdateUserInputDto>;
export type ListUsersQueryDto = z.infer<typeof ListUsersQueryDto>;