/**
 * @vitest-environment jsdom
 */
import { describe, expect, it } from "vitest";
import { sanitizeHtmlContent, sanitizePlainText, validateContentSecurity } from ".";

describe("sanitizeHtmlContent", () => {
	it("should return an empty string if the content is empty", () => {
		expect(sanitizeHtmlContent("")).toBe("");
	});

	it("should remove script tags", () => {
		const dirty = '<p>Hello</p><script>alert("XSS")</script>';
		const clean = "<p>Hello</p>";
		expect(sanitizeHtmlContent(dirty)).toBe(clean);
	});

	it("should remove on-event attributes", () => {
		const dirty = '<p onclick="alert(\'XSS\')">Hello</p>';
		const clean = "<p>Hello</p>";
		expect(sanitizeHtmlContent(dirty)).toBe(clean);
	});

	it("should disallow javascript: URLs in href", () => {
		const dirty = '<a href="javascript:alert(\'XSS\')">Click me</a>';
		const clean = '<a target="_blank" rel="noopener noreferrer">Click me</a>';
		expect(sanitizeHtmlContent(dirty)).toBe(clean);
	});

	it("should allow safe HTML tags", () => {
		const dirty =
			"<h1>Title</h1><h2>Subtitle</h2><p>This is a <strong>bold</strong> and <em>italic</em> paragraph.</p><ul><li>One</li><li>Two</li></ul>";
		expect(sanitizeHtmlContent(dirty)).toBe(dirty);
	});

	it("should add target='_blank' and rel='noopener noreferrer' to links", () => {
		const dirty = '<a href="https://example.com">Example</a>';
		const clean = '<a href="https://example.com" target="_blank" rel="noopener noreferrer">Example</a>';
		expect(sanitizeHtmlContent(dirty)).toBe(clean);
	});

	it("should handle nested tags correctly", () => {
		const dirty = "<p><strong><em>Hello World</em></strong></p>";
		expect(sanitizeHtmlContent(dirty)).toBe(dirty);
	});

	it("should not alter plain text", () => {
		const plain = "Just some text.";
		expect(sanitizeHtmlContent(plain)).toBe(plain);
	});
});

describe("sanitizePlainText", () => {
	it("should return an empty string if the content is empty", () => {
		expect(sanitizePlainText("")).toBe("");
	});

	it("should escape HTML special characters", () => {
		const dirty = '<script>alert("XSS")</script>';
		const clean = '&lt;script&gt;alert("XSS")&lt;/script&gt;';
		expect(sanitizePlainText(dirty)).toBe(clean);
	});

	it("should not alter text without HTML characters", () => {
		const plain = "This is a plain text.";
		expect(sanitizePlainText(plain)).toBe(plain);
	});
});

describe("validateContentSecurity", () => {
	it("should return valid for safe content", () => {
		const result = validateContentSecurity("<p>This is safe content.</p>");
		expect(result.isValid).toBe(true);
		expect(result.issues).toEqual([]);
	});

	it("should detect script tags", () => {
		const result = validateContentSecurity("<script>alert('XSS');</script>");
		expect(result.isValid).toBe(false);
		expect(result.issues).toContain("Script tags are not allowed");
	});

	it("should detect javascript: URLs", () => {
		const result = validateContentSecurity('<a href="javascript:alert(\'XSS\')">XSS</a>');
		expect(result.isValid).toBe(false);
		expect(result.issues).toContain("JavaScript URLs are not allowed");
	});

	it("should detect on* event handlers", () => {
		const result = validateContentSecurity('<div onclick="alert(\'XSS\')"></div>');
		expect(result.isValid).toBe(false);
		expect(result.issues).toContain("Event handler attributes are not allowed");
	});

	it("should detect dangerous data: URLs", () => {
		const result = validateContentSecurity('<a href="data:text/html;base64,PHNjcmlwdD5hbGVydCgnWFNTJyk8L3NjcmlwdD4=">XSS</a>');
		expect(result.isValid).toBe(false);
		expect(result.issues).toContain("Potentially dangerous data URLs are not allowed");
	});

	it("should allow safe data: URLs for images", () => {
		const result = validateContentSecurity('<img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=">');
		expect(result.isValid).toBe(true);
	});

	it("should detect form tags", () => {
		const result = validateContentSecurity("<form></form>");
		expect(result.isValid).toBe(false);
		expect(result.issues).toContain("Form tags are not allowed");
	});

	it("should detect iframe tags", () => {
		const result = validateContentSecurity("<iframe></iframe>");
		expect(result.isValid).toBe(false);
		expect(result.issues).toContain("Iframe tags are not allowed");
	});

	it("should detect object and embed tags", () => {
		let result = validateContentSecurity("<object></object>");
		expect(result.isValid).toBe(false);
		expect(result.issues).toContain("Object and embed tags are not allowed");

		result = validateContentSecurity("<embed></embed>");
		expect(result.isValid).toBe(false);
		expect(result.issues).toContain("Object and embed tags are not allowed");
	});

	it("should return multiple issues if multiple vulnerabilities are present", () => {
		const result = validateContentSecurity('<script></script><iframe onload=""></iframe>');
		expect(result.isValid).toBe(false);
		expect(result.issues).toEqual([
			"Script tags are not allowed",
			"Event handler attributes are not allowed",
			"Iframe tags are not allowed",
		]);
	});

	it("should return valid for empty content", () => {
		const result = validateContentSecurity("");
		expect(result.isValid).toBe(true);
		expect(result.issues).toEqual([]);
	});
}); 