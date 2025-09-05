import { describe, it, expect, vi, beforeEach } from "vitest";
import { ObjectId } from "mongodb";

import { reviewInsightHandler } from "../review-insight";
import * as dto from "@repo/dto";
import { ReviewsService } from "../../../service-actions/reviews";
import { NotFoundError, ObjectParseError } from "@repo/errors";

vi.mock("@repo/dto");
vi.mock("../../../service-actions/reviews");

describe("reviewInsightHandler", () => {
  let db: any;
  const companyId = new ObjectId();
  const userId = new ObjectId();

  beforeEach(() => {
    db = {};
    vi.resetAllMocks();
  });

  it("should return review insight variables when input is valid", async () => {
    const reviewId = new ObjectId();
    const requestBody = { reviewId: reviewId.toHexString() };

    const mockAISettings = {
      reviewSummarizationSettings: { tone: "neutral", style: "concise" },
    };
    (dto.selectCompanyAISettings as any).mockResolvedValue(mockAISettings);

    // Mock ReviewsService
    const mockReviewData = {
      reviewId: reviewId.toHexString(),
      subject: "Alice",
      participants: [],
    };
    (ReviewsService as any).mockImplementation(() => ({
      getCompleteReviewDataById: vi.fn().mockResolvedValue(mockReviewData),
    }));

    const result = await reviewInsightHandler({
      requestBody,
      db,
      companyId,
      userId,
    });

    expect(result).toEqual({
      ...mockReviewData,
      reviewSummarizationSettings: mockAISettings.reviewSummarizationSettings,
    });
  });
  it("should throw NotFoundError if userId is missing", async () => {
    const requestBody = { reviewId: new ObjectId().toHexString() };
    await expect(
      reviewInsightHandler({ requestBody, db, companyId, userId: null as any })
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("should throw NotFoundError if ReviewsService returns null", async () => {
    const reviewId = new ObjectId();
    const requestBody = { reviewId: reviewId.toHexString() };

    (dto.selectCompanyAISettings as any).mockResolvedValue({
      reviewSummarizationSettings: {},
    });

    (ReviewsService as any).mockImplementation(() => ({
      getCompleteReviewDataById: vi.fn().mockResolvedValue(null),
    }));

    await expect(
      reviewInsightHandler({ requestBody, db, companyId, userId })
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});
