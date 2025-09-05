import { type Db, ObjectId } from "mongodb";
import { UnknownKeysParam, ZodObject, ZodTypeAny, z } from "zod";

import { AiQueryRequest } from "@repo/service-contracts";

import { PromptNames } from "../prompt";
import { LlmLoggingService } from "./llm-logger";

export type AiResponseEnvelope = {
  promptHash: string;
  isCached: boolean;
  status: "completed" | "in_progress" | "error";
  createdAt?: Date;
  userId?: ObjectId | null;
  data:
    | string
    | Record<string, unknown>
    | AsyncIterable<any> // for streaming
    | { processing: true; totalChunks: number; completedChunks: number }
    | ZodObject<
        any,
        UnknownKeysParam,
        ZodTypeAny,
        { [x: string]: any },
        { [x: string]: any }
      >;
  error?: string;
};
export const getSavedResponse = async <T extends PromptNames>(
  promptName: T,
  request: AiQueryRequest,
  promptHash: string,
  db: Db,
  companyId: ObjectId,
  userId: ObjectId
): Promise<AiResponseEnvelope | null> => {
  const allowedCacheTypes = [
    "review-insight",
    "review-insight-haiku",
    "review-cycle-insight",
  ];
  const llmLogger = new LlmLoggingService({
    db,
    companyId,
    userId,
  });

  // Find cached response by promptHash
  let llmLog = await llmLogger.getLastLogByPromptHash({
    promptHash,
    promptName,
  });

  if (!llmLog) return null;

  // We want to get any current batching that is in progress
  if (llmLog.batches.length > 0) {
    const completed = llmLog.batches.filter(
      (batch) => batch.status === "completed"
    ).length;
    const inProgress = llmLog.batches.filter(
      (batch) => batch.status === "in_progress"
    ).length;
    const isProcessing = inProgress > 0;
    if (isProcessing) {
      return {
        promptHash,
        isCached: true,
        status: isProcessing ? "in_progress" : "completed",
        data: {
          totalChunks: llmLog.batches.length,
          completedChunks: completed,
        },
      };
    }
  }
  // Allowed cache types and we its done in a single chunk
  if (!allowedCacheTypes.includes(promptName) && !llmLog.batches.length)
    return null;

  // If there is not a response, let's see if we can find by type and request variables for review-insight
  if (
    !llmLog?.llm_response &&
    allowedCacheTypes.includes(promptName) &&
    "reviewId" in request
  ) {
    llmLog = await llmLogger.getLastLogByPromptVariable(
      "reviewId",
      request.reviewId
    );
    if (!llmLog?.llm_response) {
      return null;
    }
  }

  let LLMResponse = {};
  if (llmLog.llm_response && typeof llmLog.llm_response === "string") {
    LLMResponse = JSON.parse(llmLog.llm_response);
  } else {
    LLMResponse = llmLog.llm_response;
  }

  return {
    promptHash,
    isCached: true,
    status: "completed",
    data: LLMResponse,
  };
};
