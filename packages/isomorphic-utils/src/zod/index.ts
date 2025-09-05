// Dependencies
import { ObjectId } from "bson";
import { z } from "zod";

export * from "./api-helpers";

/**
 * Helper function to validate that a string is a valid ObjectId.
 *
 * example:
 * z.object({
 *   id: z.string().refine(objectIdRefinement),
 * })
 */
export const objectIdRefinement = (value: string) => {
	try {
		return new ObjectId(value).toHexString() === value;
	} catch {
		return false;
	}
};

/**
 * Helper function to transform a string into an ObjectId.
 *
 * example:
 * z.object({
 *  id: objectIdTransform,
 * })
 */
export const transformObjectId = z
	.string()
	.transform((id, ctx) => {
		try {
			const objectId = new ObjectId(id);

			if (objectId.toHexString() !== id) {
				throw new Error("Invalid ObjectId");
			}

			return objectId;
		} catch {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: "Invalid ObjectId",
			});
		}

		return z.NEVER;
	})
	.or(z.instanceof(ObjectId));

/**
 * Helper function to transform a string into a Date.
 */
export const transformDate = z
	.string()
	.transform((date, ctx) => {
		try {
			const dateObject = new Date(date);

			if (!z.date().safeParse(dateObject).success) {
				throw new Error("Invalid Date");
			}

			return dateObject;
		} catch {
			ctx.addIssue({
				code: z.ZodIssueCode.invalid_date,
			});
		}

		return z.NEVER;
	})
	.or(z.date());

/**
 * Helper function to transform a nullable or optional (nullish) string into a Date.
 */
export const transformNullishDate = z
	.string()
	.nullish()
	.transform((date, ctx) => {
		if (!date) {
			return null;
		}

		try {
			const dateObject = new Date(date);

			if (!z.date().safeParse(dateObject).success) {
				throw new Error("Invalid Date");
			}

			return dateObject;
		} catch {
			ctx.addIssue({
				code: z.ZodIssueCode.invalid_date,
			});
		}

		return z.NEVER;
	});

export const transformValidationErrorMessages = (issues: z.ZodError["issues"]) => {
	const errorMessages: {
		index: string | number | undefined;
		path: (string | number)[];
		message: string;
	}[] = [];

	for (const issue of issues) {
		const userIndex = issue.path.shift();
		const remainingPath = issue.path.slice();
		errorMessages.push({
			index: userIndex,
			path: remainingPath,
			message: issue.message,
		});
	}

	return errorMessages;
};

/**
 * Helper function from string to boolean.
 */
export const transformToBoolean = z.string().transform((val) => val.toLowerCase() === "true");

/**
 * Helper function to transform an empty string to null.
 */
export const transformEmptyStringToNull = z.string().transform((val) => {
	if (val === "") {
		return null;
	}
	return val;
});
// Function to convert a Date to a UTC Date
function convertDateToUTC(date: Date) {
	return new Date(
		Date.UTC(
			date.getUTCFullYear(),
			date.getUTCMonth(),
			date.getUTCDate(),
			date.getUTCHours(),
			date.getUTCMinutes(),
			date.getUTCSeconds()
		)
	);
}

// Zod schema to handle the input and convert to a UTC Date object
export const transformDateToUTC = z
	.union([z.string(), z.date()])
	.describe("Accepts a string or Date object and converts it to a UTC Date object.")
	.refine(
		(value) => {
			// Custom validation logic to ensure the input is a valid date
			let date: Date | undefined;
			if (typeof value === "string") {
				// If the input is a string, try to parse it into a Date object
				date = new Date(value);
			} else if (value instanceof Date) {
				// If the input is already a Date object, use it directly
				date = value;
			}
			// Check if the parsed date is valid
			return date && !Number.isNaN(date.getTime());
		},
		{
			message: "Invalid date format. Must be a valid date string or Date object.",
		}
	)
	.transform((value) => {
		// Transform the validated input into a UTC Date object
		let date: Date | undefined;
		if (typeof value === "string") {
			// Parse string input into a Date object

			date = new Date(value);
		} else if (value instanceof Date) {
			// Use the Date object directly
			date = value;
		}
		// Convert the Date object to UTC
		return date && convertDateToUTC(date);
	})
	.describe("Transforms a string or Date object to a UTC Date object.");

export const transformDateToUTCString = z.union([
	z.date().transform((date) => convertDateToUTC(date).toISOString()),
	z.string(),
]);
