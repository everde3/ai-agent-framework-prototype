import { tool } from "ai";
import { z } from "zod";

export const getCurrentTime = tool({
	description: "Returns the current time for a given location or timezone",
	parameters: z.object({
		location: z.string().describe("City or timezone (e.g. 'America/New_York')"),
	}),
	async execute({ location }) {
		const date = new Date().toLocaleString("en-US", { timeZone: location });
		return { location, time: date };
	},
});
