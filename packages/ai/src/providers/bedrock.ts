import { createAmazonBedrock } from "@ai-sdk/amazon-bedrock";
import { fromNodeProviderChain } from "@aws-sdk/credential-providers";

import { BedrockModel, BedrockModels, ModelConfig, ProviderType } from "./model-registry";

export const getBedrockModel = ({ modelId }: ModelConfig<{ provider: ProviderType.BEDROCK; model: BedrockModel }>) => {
	const bedrock = createAmazonBedrock({
		region: "us-east-1",
		credentialProvider: fromNodeProviderChain(),
	});
	const model = BedrockModels[modelId];
	return bedrock(model);
};
