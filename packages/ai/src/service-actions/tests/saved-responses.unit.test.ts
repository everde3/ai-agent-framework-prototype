import { describe, it, expect, vi, beforeEach } from "vitest";
import { ObjectId } from "mongodb";

import { getSavedResponse, AiResponseEnvelope } from "../saved-responses";
import { LlmLoggingService } from "../llm-logger";
import type { AiQueryRequest } from "@repo/service-contracts";

const mockGetLastLogByPromptHash = vi.fn();
const mockGetLastLogByPromptVariable = vi.fn();
// Mock the LlmLoggingService
vi.mock("../llm-logger", () => {
  return {
    LlmLoggingService: vi.fn().mockImplementation(() => ({
      getLastLogByPromptHash: mockGetLastLogByPromptHash,
      getLastLogByPromptVariable: mockGetLastLogByPromptVariable,
    })),
  };
});

vi.mock("@repo/dto", () => {
  return {
    getLatestLlmLog: vi.fn(),
  };
});

describe("getSavedResponse", () => {
  const mockDb = {} as any;
  const companyId = new ObjectId();
  const userId = new ObjectId();
  const reviewId = new ObjectId();
  const promptHash = "fakehash123";
  const promptName = "review-insight" as const;
  const request: AiQueryRequest = {
    type: "review-insight",
    findAdditionalContext: false,
    reviewId: reviewId,
  };

  let mockLogger: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockLogger = new LlmLoggingService({ db: mockDb, companyId, userId });
  });

  it("should return null if no log is found", async () => {
    mockLogger.getLastLogByPromptHash.mockResolvedValueOnce(null);

    const result = await getSavedResponse(
      promptName,
      request,
      promptHash,
      mockDb,
      companyId,
      userId
    );
    expect(result).toBeNull();
  });

  it("should return in_progress if there are in-progress batches", async () => {
    mockLogger.getLastLogByPromptHash.mockResolvedValueOnce({
      batches: [
        { status: "completed" },
        { status: "in_progress" },
        { status: "completed" },
      ],
      llm_response: null,
    });

    const result = (await getSavedResponse(
      promptName,
      request,
      promptHash,
      mockDb,
      companyId,
      userId
    )) as AiResponseEnvelope;

    expect(result).toEqual({
      promptHash,
      isCached: true,
      status: "in_progress",
      data: { totalChunks: 3, completedChunks: 2 },
    });
  });

  it("should return completed if there are only completed batches", async () => {
    mockLogger.getLastLogByPromptHash.mockResolvedValue({
      batches: [{ status: "completed" }, { status: "completed" }],
      llm_response: { result: "ok" },
    });

    const result = (await getSavedResponse(
      promptName,
      request,
      promptHash,
      mockDb,
      companyId,
      userId
    )) as AiResponseEnvelope;

    expect(result).toEqual({
      promptHash,
      isCached: true,
      status: "completed",
      data: { result: "ok" },
    });
  });

  it("should return null if promptName not allowed and no batches exist", async () => {
    mockLogger.getLastLogByPromptHash.mockResolvedValue({
      batches: [],
      llm_response: null,
    });

    const result = await getSavedResponse(
      "custom-prompt" as any,
      request,
      promptHash,
      mockDb,
      companyId,
      userId
    );
    expect(result).toBeNull();
  });

  it("should fallback to getLastLogByPromptVariable for review-insight if llm_response missing", async () => {
    const fallbackResponse = { result: "found by variable" };
    mockLogger.getLastLogByPromptHash.mockResolvedValue({
      batches: [],
      llm_response: null,
    });
    mockLogger.getLastLogByPromptVariable.mockResolvedValue({
      batches: [],
      llm_response: JSON.stringify(fallbackResponse),
    });

    const result = (await getSavedResponse(
      promptName,
      request,
      promptHash,
      mockDb,
      companyId,
      userId
    )) as AiResponseEnvelope;

    expect(mockLogger.getLastLogByPromptVariable).toHaveBeenCalledWith(
      "reviewId",
      reviewId
    );
    expect(result).toEqual({
      promptHash,
      isCached: true,
      status: "completed",
      data: fallbackResponse,
    });
  });

  it("should parse llm_response if it's a string", async () => {
    const llmResponse = { answer: 42 };
    mockLogger.getLastLogByPromptHash.mockResolvedValue({
      batches: [],
      llm_response: JSON.stringify(llmResponse),
    });

    const result = (await getSavedResponse(
      promptName,
      request,
      promptHash,
      mockDb,
      companyId,
      userId
    )) as AiResponseEnvelope;

    expect(result.data).toEqual(llmResponse);
  });

  it("should return llm_response as-is if it's an object", async () => {
    const llmResponse = { answer: 99 };
    mockLogger.getLastLogByPromptHash.mockResolvedValue({
      batches: [],
      llm_response: llmResponse,
    });

    const result = (await getSavedResponse(
      promptName,
      request,
      promptHash,
      mockDb,
      companyId,
      userId
    )) as AiResponseEnvelope;

    expect(result.data).toEqual(llmResponse);
  });
});
