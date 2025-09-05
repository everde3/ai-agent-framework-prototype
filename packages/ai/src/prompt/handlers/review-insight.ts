import { ObjectId } from "mongodb";

import { selectCompanyAISettings } from "@repo/dto";
import { NotFoundError, ObjectParseError } from "@repo/errors";
import { SummarizeReview } from "@repo/service-contracts";
import { isObjectId } from "@repo/utils-backend";

import { ReviewInsightPromptVariables } from "../schemas";

import { ReviewsService } from "../../service-actions/reviews";
import { PromptVariableContext } from "../prompt-registry";

export const reviewInsightHandler = async ({
  requestBody,
  db,
  companyId,
  userId,
}: PromptVariableContext): Promise<ReviewInsightPromptVariables> => {
  const parseBody = SummarizeReview.parse(requestBody);

  if (!userId) {
    throw new NotFoundError(
      `User ID cannot be found for reviewId: ${parseBody.reviewId}`,
      {
        message: "We couldn't find the user ID you requested.",
      }
    );
  }

  const aiSettings = await selectCompanyAISettings({
    db: db,
    companyId: companyId,
  });

  const reviewService = new ReviewsService({
    db: db,
    companyId: companyId,
    userId: userId,
  });

  const reviewData = await reviewService.getCompleteReviewDataById({
    reviewId: parseBody.reviewId,
  });

  if (!reviewData) {
    throw new NotFoundError(
      `Review data cannot be found for reviewId: ${parseBody.reviewId}`,
      {
        message: "We couldn't find the review data you requested.",
      },
      { reviewId: parseBody.reviewId }
    );
  }

  return {
    reviewId: parseBody.reviewId.toString(),
    reviewSummarizationSettings: aiSettings.reviewSummarizationSettings,
    ...reviewData,
  };
};
