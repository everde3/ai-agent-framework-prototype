import DOMPurify from "dompurify";

/**
 * Sanitize HTML content to prevent XSS attacks while preserving safe formatting.
 *
 * @param content - The HTML content to sanitize
 * @returns Sanitized HTML content
 */
export const sanitizeHtmlContent = (content: string): string => {
	if (!content) {
		return content;
	}

	// Configure DOMPurify to allow basic formatting while removing dangerous elements
	const config = {
		ALLOWED_TAGS: [
			"p",
			"br",
			"strong",
			"b",
			"em",
			"i",
			"u",
			"s",
			"strike",
			"del",
			"ul",
			"ol",
			"li",
			"blockquote",
			"h1",
			"h2",
			"h3",
			"h4",
			"h5",
			"h6",
			"a",
			"code",
			"pre",
			"#text",
		],
		ALLOWED_ATTR: ["href", "title", "target", "rel", "class"],
		ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto):|[^a-z]|[a-z+.-]+(?:[^a-z+.-:]|$))/i,
		KEEP_CONTENT: true,
		RETURN_DOM: false,
		RETURN_DOM_FRAGMENT: false,
		RETURN_DOM_IMPORT: false,
		SANITIZE_DOM: true,
		FORCE_BODY: false,
		NORMALIZE_WHITESPACE: false,
		CUSTOM_ELEMENT_HANDLING: {
			tagNameCheck: null,
			attributeNameCheck: null,
			allowCustomizedBuiltInElements: false,
		},
	};

	// Add hooks to ensure links open in new tabs and have proper rel attributes
	DOMPurify.addHook("afterSanitizeAttributes", (node) => {
		// Set all elements owning target to target=_blank
		if ("target" in node) {
			node.setAttribute("target", "_blank");
			node.setAttribute("rel", "noopener noreferrer");
		}
	});

	const sanitized = DOMPurify.sanitize(content, config);

	// Remove the hook after use to prevent interference with other sanitization calls
	DOMPurify.removeAllHooks();

	return sanitized;
};

/**
 * Sanitize plain text content by escaping HTML entities.
 * Use this for content that should not contain any HTML.
 *
 * @param content - The text content to sanitize
 * @returns Escaped text content
 */
export const sanitizePlainText = (content: string): string => {
	if (!content) {
		return content;
	}

	// Create a temporary element to use the browser's built-in HTML escaping
	const div = document.createElement("div");
	div.textContent = content;
	return div.innerHTML;
};

/**
 * Validate that content doesn't contain potentially dangerous patterns.
 * Returns validation result with details about any issues found.
 *
 * @param content - The content to validate
 * @returns Validation result object
 */
export const validateContentSecurity = (content: string): { isValid: boolean; issues: string[] } => {
	const issues: string[] = [];

	if (!content) {
		return { isValid: true, issues: [] };
	}

	// Check for script tags
	if (/<script[\s\S]*?>[\s\S]*?<\/script>/gi.test(content)) {
		issues.push("Script tags are not allowed");
	}

	// Check for javascript: URLs
	if (/javascript:/gi.test(content)) {
		issues.push("JavaScript URLs are not allowed");
	}

	// Check for on* event handlers
	if (/\son\w+\s*=/gi.test(content)) {
		issues.push("Event handler attributes are not allowed");
	}

	// Check for data: URLs with potentially dangerous content
	if (/data:(?!image\/(?:png|jpg|jpeg|gif|svg\+xml))[^;]*;/gi.test(content)) {
		issues.push("Potentially dangerous data URLs are not allowed");
	}

	// Check for form tags
	if (/<form[\s\S]*?>[\s\S]*?<\/form>/gi.test(content)) {
		issues.push("Form tags are not allowed");
	}

	// Check for iframe tags
	if (/<iframe[\s\S]*?>[\s\S]*?<\/iframe>/gi.test(content)) {
		issues.push("Iframe tags are not allowed");
	}

	// Check for object and embed tags
	if (/<(?:object|embed)[\s\S]*?>/gi.test(content)) {
		issues.push("Object and embed tags are not allowed");
	}

	return {
		isValid: issues.length === 0,
		issues,
	};
};
