import { z } from "zod";

export const RephraseQuestionType = z.union([z.literal("text"), z.literal("multiline"), z.literal("goal")]);

export type RephraseQuestionType = z.infer<typeof RephraseQuestionType>;

export const reviewAuthoringPromptVariables = z.object({
	question: z.string(),
	subText: z.string().default(""),
	subject: z.string(),
	author: z.string(),
	answer: z.array(z.string()),
	context: z.string().optional(),
	goalName: z.string().default(""),
	writingStyle: z.enum(["casual", "businessProfessional", "businessCasual", "formal"]).default("businessCasual"),
	disallowedWords: z.array(z.string()).default([]),
	questionType: RephraseQuestionType,
});

export type ReviewAuthoringPromptVariables = z.infer<typeof reviewAuthoringPromptVariables>;
