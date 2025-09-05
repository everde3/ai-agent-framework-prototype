import { ReviewCycleInsightPromptVariables, reviewCycleInsightPromptVariables } from "../schemas";

import { PromptVariableContext } from "../prompt-registry";

export const reviewCycleInsightHandler = async ({
	requestBody,
	db,
	companyId,
}: PromptVariableContext): Promise<ReviewCycleInsightPromptVariables> => {
	const parseBody = reviewCycleInsightPromptVariables.parse(requestBody);

	return parseBody;
};
