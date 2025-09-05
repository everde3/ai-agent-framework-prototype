import { describe, it, expect } from "vitest";
import { getLambdaFunctionName } from "./index";

describe("getLambdaFunctionName", () => {
	it("should return 'sandbox-functionName' for 'demo' environment", () => {
		expect(getLambdaFunctionName("demo", "testFunction")).toBe("sandbox-testFunction");
	});

	it("should return the correct function name for all other environments", () => {
		expect(getLambdaFunctionName("production", "testFunction")).toBe("production-testFunction");
		expect(getLambdaFunctionName("staging", "testFunction")).toBe("staging-testFunction");
		expect(getLambdaFunctionName("sandbox", "testFunction")).toBe("sandbox-testFunction");
		expect(getLambdaFunctionName("dev", "testFunction")).toBe("dev-testFunction");
	});

	it("should handle undefined inputs by returning undefined", () => {
		expect(getLambdaFunctionName(undefined, "testFunction")).toBe(undefined);
		expect(getLambdaFunctionName("production", undefined)).toBe(undefined);
		expect(getLambdaFunctionName(undefined, undefined)).toBe(undefined);
	});
}); 