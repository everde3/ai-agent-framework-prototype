/**
 * Return the corresponding database environment based on the environment stage.
 */
export const lookupDatabaseEnvironment = (environmentStage: string) => {
	if (environmentStage === "sandbox" || environmentStage === "demo") {
		return "sandbox";
	}
	if (environmentStage === "production") {
		return "production";
	}
	if (environmentStage === "preview") {
		return "preview";
	}
	return "staging";
};
