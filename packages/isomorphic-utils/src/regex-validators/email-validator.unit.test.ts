import { describe, expect, it } from "vitest";

import { emailValidator } from ".";

describe.concurrent("emailValidator()", () => {
	it("validates an email", () => {
		const email = "spondgebob@krustykrab.com";

		const response = emailValidator(email);

		expect(response).toBe(true);
	});

	it("validates an email with dot", () => {
		const email = "spondge.bob@krustykrab.com";

		const response = emailValidator(email);

		expect(response).toBe(true);
	});

	it("validates an email with a subdomain", () => {
		const email = "spongebob@bikini.krustykrab.com";
		const response = emailValidator(email);

		expect(response).toBe(true);
	});

	it("validates an email with a plus sign", () => {
		const email = "spongebob+test@krustykrab.com";
		const response = emailValidator(email);

		expect(response).toBe(true);
	});

	it("validates an email with a comma", () => {
		const email = "sponge+bob,llc@krustykrab.com";
		const response = emailValidator(email);

		expect(response).toBe(true);
	});

	it("should not validate email", () => {
		const email = "spongeBob123";
		const response = emailValidator(email);

		expect(response).toBe(false);
	});
});
