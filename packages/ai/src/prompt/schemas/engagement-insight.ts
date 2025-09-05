import { z } from "zod";

import { EngagementSurveyFormModelByQuestionID } from "@repo/models";
import { EngagementInsightResponseStream } from "@repo/service-contracts";

export const engagementInsightPromptVariables = z.object({
  answers: z.array(EngagementSurveyFormModelByQuestionID),
  cohortName: z
    .string()
    .describe("The cohort or team name the question was sent to."),
  question: z
    .string()
    .describe(
      "The question that was asked. Do not change the question from the original."
    ),
  additionalFeedback: z.boolean().default(false),
  total: z.number().describe("The total number of answers."),
});
export type EngagementInsightPromptVariables = z.infer<
  typeof engagementInsightPromptVariables
>;

export const engagementInsightSummaryOfSummaryPromptVariables = z.object({
  summary_one: EngagementInsightResponseStream,
  summary_two: EngagementInsightResponseStream,
});
export type EngagementInsightSummaryOfSummaryPromptVariables = z.infer<
  typeof engagementInsightSummaryOfSummaryPromptVariables
>;
