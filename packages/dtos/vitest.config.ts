/// <reference types="vitest" />
import { coverageConfigDefaults, defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		exclude: ["**/*.local.test.ts", "src/db", "src/collections", "src/testing-services"],
		coverage: {
			exclude: [
				"**/*.local.test.ts",
				"src/db",
				"src/testing-services",
				"src/collections",
				...coverageConfigDefaults.exclude,
			],
			reporter: ["text", "json-summary"],
		},
	},
});
