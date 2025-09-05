import { z } from 'zod';
import { ObjectId } from 'mongodb';

/**
 * AI Agent database model schema
 */
export const AIAgentModel = z.object({
  _id: z.instanceof(ObjectId),
  name: z.string(),
  description: z.string().nullable(),
  prompt: z.string(),
  model: z.enum(['gpt-4', 'gpt-3.5-turbo', 'claude-3']),
  temperature: z.number().min(0).max(2),
  isActive: z.boolean(),
  createdById: z.instanceof(ObjectId), // Reference to User._id
  createdAt: z.date(),
  updatedAt: z.date(),
});

/**
 * Chat session database model schema
 */
export const ChatSessionModel = z.object({
  _id: z.instanceof(ObjectId),
  agentId: z.instanceof(ObjectId), // Reference to AIAgent._id
  userId: z.instanceof(ObjectId),  // Reference to User._id
  title: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

/**
 * Chat message database model schema
 */
export const ChatMessageModel = z.object({
  _id: z.instanceof(ObjectId),
  sessionId: z.instanceof(ObjectId), // Reference to ChatSession._id
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string(),
  metadata: z.record(z.unknown()).optional(), // For storing additional AI metadata
  createdAt: z.date(),
});

/**
 * Creation inputs for database operations
 */
export const CreateAIAgentModel = AIAgentModel.omit({ 
  _id: true, 
  createdAt: true, 
  updatedAt: true 
}).extend({
  _id: z.instanceof(ObjectId).optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export const CreateChatSessionModel = ChatSessionModel.omit({ 
  _id: true, 
  createdAt: true, 
  updatedAt: true 
}).extend({
  _id: z.instanceof(ObjectId).optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export const CreateChatMessageModel = ChatMessageModel.omit({ 
  _id: true, 
  createdAt: true 
}).extend({
  _id: z.instanceof(ObjectId).optional(),
  createdAt: z.date().optional(),
});

/**
 * Update inputs for database operations
 */
export const UpdateAIAgentModel = CreateAIAgentModel.partial();
export const UpdateChatSessionModel = CreateChatSessionModel.partial();

export type AIAgentModel = z.infer<typeof AIAgentModel>;
export type ChatSessionModel = z.infer<typeof ChatSessionModel>;
export type ChatMessageModel = z.infer<typeof ChatMessageModel>;
export type CreateAIAgentModel = z.infer<typeof CreateAIAgentModel>;
export type CreateChatSessionModel = z.infer<typeof CreateChatSessionModel>;
export type CreateChatMessageModel = z.infer<typeof CreateChatMessageModel>;
export type UpdateAIAgentModel = z.infer<typeof UpdateAIAgentModel>;
export type UpdateChatSessionModel = z.infer<typeof UpdateChatSessionModel>;