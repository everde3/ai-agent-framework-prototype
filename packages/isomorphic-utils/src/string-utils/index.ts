/**
 * Determines whether the string passed in starts with the.
 * Currently used in billing receipt emails for wording.
 *
 * @param string
 * @returns {boolean}
 */
export const startsWithThe = (string: string) => {
	return string.toLowerCase().startsWith("the ");
};

/**
 * Capitalize the first letter of a word
 *
 * @param word
 * @returns {string}
 */
export const capitalizeWord = (word: string) => {
	return word[0].toUpperCase() + word.substring(1).toLowerCase();
};

/**
 * Normalize an email address by converting it to lowercase and trimming whitespace.
 */
export const normalizeEmail = (email: string) => {
	if (typeof email !== "string") {
		return "";
	}

	return email.toLowerCase().trim();
};
