/**
 * Return the full lambda function name based on the environment stage and function name.
 * Replicates the logic from webserver/service_actions/py_utils.py's get_lambda_environment function.
 *
 * @param environmentStage - The current environment stage (e.g., production, sandbox, demo, dev)
 * @param functionName - The name of the lambda function
 * @returns The full lambda function name to use for invocation
 */
export const getLambdaFunctionName = (environmentStage?: string, functionName?: string): string | undefined => {
	if (!environmentStage || !functionName) {
		return undefined;
	}

	let environment = environmentStage;

	switch (environmentStage) {
		case "demo":
			environment = "sandbox";
			break;
		case "localhost":
		case "other":
			environment = "staging";
			break;
		default:
			environment = environmentStage;
			break;
	}

	return `${environment}-${functionName}`;
};
