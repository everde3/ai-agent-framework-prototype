import { addDays, addMonths, addYears, differenceInDays } from "date-fns";
import { formatInTimeZone, utcToZonedTime, zonedTimeToUtc } from "date-fns-tz";

const DEFAULT_TIMEZONE = "America/New_York";

export const convertToZonedUTCTime = (dateToConvert: Date, timezone: string): Date => {
	return zonedTimeToUtc(dateToConvert, timezone);
};

/**
 * Set the time of "date" to the time of the Date object "time", but in the provided timezone
 *
 * Ex. Set the date June 30 to the time of Jan 1 9AM in New York
 * Because of DST 9AM June 30 is 13:00 UTC, but 9AM Jan 1 is 14:00 UTC
 *
 */
export const setDateToTimeOfDateWithTimezone = ({
	date,
	time,
	timezone = DEFAULT_TIMEZONE,
}: {
	date: Date;
	time: Date;
	timezone?: string;
}) => {
	const dateInTz = utcToZonedTime(date, timezone);
	const timeInTz = utcToZonedTime(time, timezone);

	dateInTz.setHours(timeInTz.getHours());
	dateInTz.setMinutes(timeInTz.getMinutes());
	dateInTz.setSeconds(timeInTz.getSeconds());
	dateInTz.setMilliseconds(timeInTz.getMilliseconds());

	return zonedTimeToUtc(dateInTz, timezone);
};

/**
 * Set the time of UTC "date" in the given timezone.
 *
 * This should only be needed when modifying a UTC date timestamp.
 * Date only objects do not need to use this function.
 *
 * Defaults to midnight 00:00:00.000 in the TZ time
 *
 */
export const setTimeOfDateInTimezone = ({
	date,
	hours = 0,
	minutes = 0,
	seconds = 0,
	milliseconds = 0,
	timezone = DEFAULT_TIMEZONE,
}: {
	date: Date;
	hours?: number;
	minutes?: number;
	seconds?: number;
	milliseconds?: number;
	timezone?: string;
}) => {
	const dateInTz = utcToZonedTime(date, timezone);

	dateInTz.setHours(hours);
	dateInTz.setMinutes(minutes);
	dateInTz.setSeconds(seconds);
	dateInTz.setMilliseconds(milliseconds);

	return zonedTimeToUtc(dateInTz, timezone);
};

/**
 * Add days to a date with respect to a specific timezone, as in without changing the local time.
 *
 * Ex. June 30 at 9AM in New York + 180 days = December 27 at 9AM in New York
 * Because of DST the UTC time of 9AM in New York in June is 13:00, but in December it's 14:00
 *
 */
export const addDaysInTimezone = ({
	date,
	days,
	timezone = DEFAULT_TIMEZONE,
}: {
	date: Date;
	days: number;
	timezone?: string;
}): Date => {
	// Convert the provided UTC date to the timezone
	// Returns a UTC date but with the timezone offset
	const zonedDate = utcToZonedTime(date, timezone);

	// Add days
	const newZonedDate = addDays(zonedDate, days);

	// Convert back to real UTC, accounting for timezone offset
	return zonedTimeToUtc(newZonedDate, timezone);
};

/**
 * Add months to a date with respect to a specific timezone, as in without changing the local time.
 *
 * Ex. June 30 at 9AM in New York + 6 months = December 30 at 9AM in New York
 * Because of DST the UTC time of 9AM in New York in June is 13:00, but in December it's 14:00
 *
 */
export const addMonthsInTimezone = ({
	date,
	months,
	timezone = DEFAULT_TIMEZONE,
}: {
	date: Date;
	months: number;
	timezone?: string;
}): Date => {
	// Convert the provided UTC date to the timezone
	// Returns a UTC date but with the timezone offset
	const zonedDate = utcToZonedTime(date, timezone);

	// Add months
	const newZonedDate = addMonths(zonedDate, months);

	// Convert back to real UTC, accounting for timezone offset
	return zonedTimeToUtc(newZonedDate, timezone);
};

/**
 * Add years to a date with respect to a specific timezone, as in without changing the local time.
 *
 * Ex. March 8 2026 at 9AM in New York + 1 year = March 8 2027 at 9AM in New York
 * Because of DST the UTC time of 9AM in New York on March 8 2026 is 13:00, but March 8 2027 it's 14:00
 *
 */
export const addYearsInTimezone = ({
	date,
	years,
	timezone = DEFAULT_TIMEZONE,
}: {
	date: Date;
	years: number;
	timezone?: string;
}): Date => {
	// Convert the provided UTC date to the timezone
	// Returns a UTC date but with the timezone offset
	const zonedDate = utcToZonedTime(date, timezone);

	// Add years
	const newZonedDate = addYears(zonedDate, years);

	// Convert back to real UTC, accounting for timezone offset
	return zonedTimeToUtc(newZonedDate, timezone);
};

/**
 * Pass in a date object and return a formatted date string without modifying the date from timezone.
 * Currently only needed in the email package to format dates passed in for email receipts.
 *
 * @param date
 * @returns {string} A formatted date string
 */
export const formatDateAsUTCString = (date: Date) => {
	return formatInTimeZone(date, "UTC", "MMMM d, yyyy");
};

/**
 * Calculate the difference in days between two dates relative to a specific timezone.
 *
 * This is important because depending on the timezone a Date object might be
 * represent a different date.
 *
 * @param firstDate - The first date to compare
 * @param secondDate - The second date to compare
 * @param timezone - The timezone to use for the calculation
 */
export const differenceInDaysInTimezone = ({
	firstDate,
	secondDate,
	timezone = DEFAULT_TIMEZONE,
}: {
	firstDate: Date;
	secondDate: Date;
	timezone?: string;
}): number => {
	// Convert the provided UTC date to the timezone
	// Returns a UTC date but with the timezone offset
	const zonedFirstDate = utcToZonedTime(firstDate, timezone);
	const zonedSecondDate = utcToZonedTime(secondDate, timezone);

	return differenceInDays(zonedFirstDate, zonedSecondDate);
};
