import { selectCompanyAISettings } from "@repo/dto";
import { RephraseReviewAnswer } from "@repo/service-contracts";

import { ReviewAuthoringPromptVariables } from "../schemas";

import { PromptVariableContext } from "../prompt-registry";

export const reviewAuthoringHandler = async ({
  requestBody,
  db,
  companyId,
}: PromptVariableContext): Promise<ReviewAuthoringPromptVariables> => {
  const parseBody = RephraseReviewAnswer.parse(requestBody);
  const aiSettings = await selectCompanyAISettings({
    db: db,
    companyId: companyId,
  });

  return {
    answer: parseBody.answer,
    author: parseBody.author,
    question: parseBody.question,
    subject: parseBody.subject,
    subText: parseBody.subText,
    questionType: parseBody.questionType,
    goalName: parseBody.goalName,
    disallowedWords: aiSettings.authoringAssistantSettings.disallowedWords,
    writingStyle: aiSettings.authoringAssistantSettings.preferredWritingStyle,
  };
};
