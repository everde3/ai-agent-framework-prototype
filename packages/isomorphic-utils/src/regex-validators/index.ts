/**
 * Email validator
 *
 */

export const emailValidator = (email: string): boolean => {
	const emailRegex = /^[A-Za-z0-9._%+-/,]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,255}$/;
	return emailRegex.test(email);
};

/* 
 Used in csv downloads, regex to check if a string has metacharacters to prevent formula injection.
 */
export const METACHARACTERS = /^[[\]{}()*+?.\\^$|=\-@]/;
