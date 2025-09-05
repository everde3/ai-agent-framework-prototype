import { z } from "zod";

import { ReviewInsightResponseStream } from "@repo/service-contracts";

export const reviewCycleInsightPromptVariables = z.array(
  ReviewInsightResponseStream
);

export type ReviewCycleInsightPromptVariables = z.infer<
  typeof reviewCycleInsightPromptVariables
>;
