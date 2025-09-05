import { describe, it, expect, vi, beforeEach } from "vitest";
import { ObjectId } from "mongodb";

import {
  engagementInsightHandler,
  engagementInsightSummaryOfSummaryHandler,
} from "../engagement-insight";
import * as dto from "@repo/dto";
import * as engagement from "@repo/engagement";
import { NotFoundError } from "@repo/errors";

vi.mock("@repo/dto");
vi.mock("@repo/engagement");

describe("engagementInsightHandler", () => {
  let db: any;
  const companyId = new ObjectId();

  beforeEach(() => {
    db = {};
    vi.resetAllMocks();
  });

  it("should return answers and question for a standard questionId", async () => {
    const questionId = "standardQuestionId";
    const mockAnswers = [{ _id: new ObjectId(), answer: "Yes" }];
    const mockJsonQuestion = { question: "What is your mood?" };

    (dto.getAllQuestionAnswersByID as any).mockResolvedValue(mockAnswers);
    (engagement.getQuestionById as any).mockReturnValue(mockJsonQuestion);

    const result = await engagementInsightHandler({
      requestBody: { questionId },
      db,
      companyId,
    });

    expect(result).toEqual({
      cohortName: "All Employees",
      answers: mockAnswers,
      question: mockJsonQuestion.question,
      total: mockAnswers.length,
      additionalFeedback: false,
    });
  });

  it("should handle eNPSAdditionalFeedback questionId", async () => {
    const questionId = "eNPSAdditionalFeedback";
    const mockAnswers = [
      { _id: new ObjectId(), feedback: "Great place to work!" },
    ];

    (dto.getAllEnpsAdditionalFeedback as any).mockResolvedValue(mockAnswers);

    const result = await engagementInsightHandler({
      requestBody: { questionId },
      db,
      companyId,
    });

    expect(result).toEqual({
      cohortName: "All Employees",
      answers: mockAnswers,
      question: "",
      total: mockAnswers.length,
      additionalFeedback: true,
    });
  });

  it("should throw NotFoundError if no answers found", async () => {
    const questionId = "standardQuestionId";

    (dto.getAllQuestionAnswersByID as any).mockResolvedValue([]);

    await expect(
      engagementInsightHandler({ requestBody: { questionId }, db, companyId })
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("should fetch custom question if questionId is an ObjectId", async () => {
    const questionId = new ObjectId().toString();
    const mockCustomQuestion = { question: "Custom Question?" };
    const mockAnswers = [{ _id: new ObjectId(), answer: "Yes" }];

    (dto.findCustomQuestionByID as any).mockResolvedValue(mockCustomQuestion);
    (dto.getAllQuestionAnswersByID as any).mockResolvedValue(mockAnswers);

    const result = await engagementInsightHandler({
      requestBody: { questionId },
      db,
      companyId,
    });

    expect(result.question).toBe(mockCustomQuestion.question);
    expect(result.answers).toEqual(mockAnswers);
  });
});
