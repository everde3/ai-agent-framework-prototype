import { ObjectId } from "mongodb";
import { z } from "zod";

// Available Models to create embeddings
export const AiUserSchema = z.object({
	_id: z.instanceof(ObjectId),
	name: z.string(),
	role: z.string(),
});

export type AiUserSchema = z.infer<typeof AiUserSchema>;

export const QuestionWithAnswer = z.object({
	question: z.string(),
	subtext: z.string().default(""),
	type: z.string(),
	answer: z.unknown(),
});

export type QuestionWithAnswer = z.infer<typeof QuestionWithAnswer>;

// Report (raw, with userId fields)
export const Report = z.object({
	author: z.array(z.instanceof(ObjectId).nullable()).optional(),
	completeDate: z.union([z.date(), z.string(), z.null()]).optional(),
	dueDate: z.union([z.date(), z.string(), z.null()]).optional(),
	signOffComment: z.string().nullable().optional(),
	formName: z.string(),
	signer: z.array(z.instanceof(ObjectId).nullable()).optional(),
	status: z.string().optional(),
	redacted: z.boolean().default(false),
	visible: z.boolean().default(false),
	questionsWithAnswers: z.array(QuestionWithAnswer),
});

export type Report = z.infer<typeof Report>;

// Task
export const Task = z.object({
	name: z.string(),
	completed: z.boolean().default(false),
	startDate: z.union([z.date(), z.string(), z.null()]),
	completeDate: z.union([z.date(), z.string(), z.null()]),
	subject: z.instanceof(ObjectId),
	participants: z.array(z.instanceof(ObjectId)),
	reports: z.array(Report),
});

export type Task = z.infer<typeof Task>;

export const TaskWithUserInfo = z.object({
	name: z.string(),
	completed: z.boolean().optional(),
	startDate: z.union([z.date(), z.string(), z.null()]),
	completeDate: z.union([z.date(), z.string(), z.null()]),
	subject: AiUserSchema,
	participants: z.array(AiUserSchema),
	reports: z.array(
		z.object({
			author: z.array(AiUserSchema).optional(),
			completeDate: z.union([z.date(), z.string(), z.null()]).optional(),
			dueDate: z.union([z.date(), z.string(), z.null()]).optional(),
			signOffComment: z.string().nullable().optional(),
			formName: z.string(),
			signer: z.array(AiUserSchema).optional(),
			status: z.string().optional(),
			redacted: z.boolean().default(false),
			visible: z.boolean().default(false),
			questionsWithAnswers: z.array(QuestionWithAnswer),
		})
	),
});
export type TaskWithUserInfo = z.infer<typeof TaskWithUserInfo>;

export const reviewInsightPromptVariables = z
	.object({
		reviewId: z.string(),
		reviewSummarizationSettings: z.object({
			strengths: z.boolean(),
			quotes: z.boolean(),
			actions: z.boolean(),
			tone: z.boolean(),
			opinions: z.boolean(),
			summary: z.boolean(),
		}),
	})
	.extend(TaskWithUserInfo.shape);

export type ReviewInsightPromptVariables = z.infer<typeof reviewInsightPromptVariables>;
