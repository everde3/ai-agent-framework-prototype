import { describe, expect, it } from "vitest";
import { addDaysInTimezone, convertToZonedUTCTime, differenceInDaysInTimezone, formatDateAsUTCString, setDateToTimeOfDateWithTimezone } from ".";
import { addMinutes, differenceInMinutes, startOfDay } from "date-fns";
import { utcToZonedTime, zonedTimeToUtc } from "date-fns-tz";

const timezones = [
    "America/New_York",
    "America/Chicago",
    "America/Phoenix",
    "Asia/Shanghai",
    "Australia/Eucla",
    "Australia/Canberra",
    "America/Atka"
];

describe.concurrent("convertToZonedUTCTime", () => {
    it("should return a date", () => {
        const result = convertToZonedUTCTime(new Date(), "America/Phoenix");
        expect(result).toBeInstanceOf(Date);
    });

    it.each(timezones)("should return a date with the correct time and offset for %s", (timezone) => {
        // User's local timezone
        const dateTimeHere = startOfDay(new Date("2022-01-01"));
        const dateTimePHX = new Date(dateTimeHere.toLocaleString("en-US", {timeZone: timezone})) // Phoenix
        const offsetMinutes = differenceInMinutes(dateTimeHere, dateTimePHX);  // convert to minutes

        const result = convertToZonedUTCTime(dateTimeHere, timezone);

        expect(result).toEqual(addMinutes(dateTimeHere, offsetMinutes));
    });
});

describe("setDateToTimeOfDateWithTimezone", () => {
    it.each(timezones)("should set the date to the time of 9:15AM in January for %s", (timezone) => {
        const dateYear = 2022;
        const dateMonth = 5;
        const dateDay = 30;
        const dateHour = 23;
        const dateMinute = 59;

        // Generate the date we want in the timezone ( treating UTC as local time )
        const originalDateInTz = new Date(Date.UTC(dateYear, dateMonth, dateDay, dateHour, dateMinute));

        const timeYear = 2016;
        const timeMonth = 0;
        const timeDay = 1;
        const timeHour = 9;
        const timeMinute = 15;

        // Generate the time we want in the timezone ( treating UTC as local time )
        const targetTimeInTz = new Date(Date.UTC(timeYear, timeMonth, timeDay, timeHour, timeMinute));

        // Convert to the timezone ( add the offset so it's actually UTC )
        const originalDateInUtc = zonedTimeToUtc(originalDateInTz, timezone);
        const targetTimeInUtc = zonedTimeToUtc(targetTimeInTz, timezone);

        // Set the date to the time of the time
        const resultInUtc = setDateToTimeOfDateWithTimezone({ date: originalDateInUtc, time: targetTimeInUtc, timezone });

        // Convert back to "local time" to validate hour hasn't changed ( remove the offset )
        const resultInTz = utcToZonedTime(resultInUtc, timezone);

        expect(resultInTz.getFullYear()).toEqual(dateYear);
        expect(resultInTz.getMonth()).toEqual(dateMonth);
        expect(resultInTz.getDate()).toEqual(dateDay);
        expect(resultInTz.getHours()).toEqual(timeHour);
        expect(resultInTz.getMinutes()).toEqual(timeMinute);
    });

    it.each(timezones)("should set the date to the time of 9:15AM in June for %s", (timezone) => {
        const dateYear = 2022;
        const dateMonth = 0;
        const dateDay = 1;
        const dateHour = 23;
        const dateMinute = 59;

        // Generate the date we want in the timezone ( treating UTC as local time )
        const originalDateInTz = new Date(Date.UTC(dateYear, dateMonth, dateDay, dateHour, dateMinute));

        const timeYear = 2016;
        const timeMonth = 5;
        const timeDay = 30;
        const timeHour = 9;
        const timeMinute = 15;

        // Generate the time we want in the timezone ( treating UTC as local time )
        const targetTimeInTz = new Date(Date.UTC(timeYear, timeMonth, timeDay, timeHour, timeMinute));

        // Convert to the timezone ( add the offset so it's actually UTC )
        const originalDateInUtc = zonedTimeToUtc(originalDateInTz, timezone);
        const targetTimeInUtc = zonedTimeToUtc(targetTimeInTz, timezone);

        // Set the date to the time of the time
        const resultInUtc = setDateToTimeOfDateWithTimezone({ date: originalDateInUtc, time: targetTimeInUtc, timezone });

        // Convert back to "local time" to validate hour hasn't changed ( remove the offset )
        const resultInTz = utcToZonedTime(resultInUtc, timezone);

        expect(resultInTz.getFullYear()).toEqual(dateYear);
        expect(resultInTz.getMonth()).toEqual(dateMonth);
        expect(resultInTz.getDate()).toEqual(dateDay);
        expect(resultInTz.getHours()).toEqual(timeHour);
        expect(resultInTz.getMinutes()).toEqual(timeMinute);
    });

    it.each(timezones)("should set the date to the time of 12:00AM in January for %s", (timezone) => {
        const dateYear = 2022;
        const dateMonth = 5;
        const dateDay = 30;
        const dateHour = 13;
        const dateMinute = 59;

        // Generate the date we want in the timezone ( treating UTC as local time )
        const originalDateInTz = new Date(Date.UTC(dateYear, dateMonth, dateDay, dateHour, dateMinute));

        const timeYear = 2016;
        const timeMonth = 0;
        const timeDay = 1;
        const timeHour = 0;
        const timeMinute = 0;

        // Generate the time we want in the timezone ( treating UTC as local time )
        const targetTimeInTz = new Date(Date.UTC(timeYear, timeMonth, timeDay, timeHour, timeMinute));

        // Convert to the timezone ( add the offset so it's actually UTC )
        const originalDateInUtc = zonedTimeToUtc(originalDateInTz, timezone);
        const targetTimeInUtc = zonedTimeToUtc(targetTimeInTz, timezone);

        // Set the date to the time of the time
        const resultInUtc = setDateToTimeOfDateWithTimezone({ date: originalDateInUtc, time: targetTimeInUtc, timezone });

        // Convert back to "local time" to validate hour hasn't changed ( remove the offset )
        const resultInTz = utcToZonedTime(resultInUtc, timezone);

        expect(resultInTz.getFullYear()).toEqual(dateYear);
        expect(resultInTz.getMonth()).toEqual(dateMonth);
        expect(resultInTz.getDate()).toEqual(dateDay);
        expect(resultInTz.getHours()).toEqual(timeHour);
        expect(resultInTz.getMinutes()).toEqual(timeMinute);
    });

    it.each(timezones)("should set the date to the time of 12:00AM in June for %s", (timezone) => {
        const dateYear = 2022;
        const dateMonth = 0;
        const dateDay = 1;
        const dateHour = 13;
        const dateMinute = 59;

        // Generate the date we want in the timezone ( treating UTC as local time )
        const originalDateInTz = new Date(Date.UTC(dateYear, dateMonth, dateDay, dateHour, dateMinute));

        const timeYear = 2016;
        const timeMonth = 5;
        const timeDay = 30;
        const timeHour = 0;
        const timeMinute = 0;

        // Generate the time we want in the timezone ( treating UTC as local time )
        const targetTimeInTz = new Date(Date.UTC(timeYear, timeMonth, timeDay, timeHour, timeMinute));

        // Convert to the timezone ( add the offset so it's actually UTC )
        const originalDateInUtc = zonedTimeToUtc(originalDateInTz, timezone);
        const targetTimeInUtc = zonedTimeToUtc(targetTimeInTz, timezone);

        // Set the date to the time of the time
        const resultInUtc = setDateToTimeOfDateWithTimezone({ date: originalDateInUtc, time: targetTimeInUtc, timezone });

        // Convert back to "local time" to validate hour hasn't changed ( remove the offset )
        const resultInTz = utcToZonedTime(resultInUtc, timezone);

        expect(resultInTz.getFullYear()).toEqual(dateYear);
        expect(resultInTz.getMonth()).toEqual(dateMonth);
        expect(resultInTz.getDate()).toEqual(dateDay);
        expect(resultInTz.getHours()).toEqual(timeHour);
        expect(resultInTz.getMinutes()).toEqual(timeMinute);
    });
});

describe("addDaysInTimezone", () => {
    it.each(timezones)("should add days without changing local time starting June at 9:30AM for %s", (timezone) => {
        const year = 2022;
        const month = 5; // June
        const day = 30;
        const hour = 9;
        const minute = 15;

        // Generate the date we want in the timezone ( treating UTC as local time )
        const originalDateInTz = new Date(Date.UTC(year, month, day, hour, minute));
        // Convert to the timezone ( add the offset so it's actually UTC )
        const originalDateInUtc = zonedTimeToUtc(originalDateInTz, timezone);

        // Add 180 days to the date
        const resultInUtc = addDaysInTimezone({ date: originalDateInUtc, days: 180, timezone });

        // Convert back to "local time" to validate hour hasn't changed ( remove the offset )
        const resultInTz = utcToZonedTime(resultInUtc, timezone);

        const yearAfter = 2022;
        const monthAfter = 11; // December
        const dayAfter = 27;
        expect(resultInTz.getFullYear()).toEqual(yearAfter);
        expect(resultInTz.getMonth()).toEqual(monthAfter);
        expect(resultInTz.getDate()).toEqual(dayAfter);
        expect(resultInTz.getHours()).toEqual(hour);
        expect(resultInTz.getMinutes()).toEqual(minute);
    });

    it.each(timezones)("should add days without changing local time starting January at 9:30AM for %s", (timezone) => {
        const year = 2022;
        const month = 0; // January
        const day = 1;
        const hour = 9;
        const minute = 15;

        // Generate the date we want in the timezone ( treating UTC as local time )
        const originalDateInTz = new Date(Date.UTC(year, month, day, hour, minute));
        // Convert to the timezone ( add the offset so it's actually UTC )
        const originalDateInUtc = zonedTimeToUtc(originalDateInTz, timezone);

        // Add 180 days to the date
        const resultInUtc = addDaysInTimezone({ date: originalDateInUtc, days: 180, timezone });

        // Convert back to "local time" to validate hour hasn't changed ( remove the offset )
        const resultInTz = utcToZonedTime(resultInUtc, timezone);

        const yearAfter = 2022;
        const monthAfter = 5; // June
        const dayAfter = 30;
        expect(resultInTz.getFullYear()).toEqual(yearAfter);
        expect(resultInTz.getMonth()).toEqual(monthAfter);
        expect(resultInTz.getDate()).toEqual(dayAfter);
        expect(resultInTz.getHours()).toEqual(hour);
        expect(resultInTz.getMinutes()).toEqual(minute);
    });

    it.each(timezones)("should add days without changing local time starting June at 12:00 AM for %s", (timezone) => {
        const year = 2022;
        const month = 5; // June
        const day = 30;
        const hour = 0;
        const minute = 0;

        // Generate the date we want in the timezone ( treating UTC as local time )
        const originalDateInTz = new Date(Date.UTC(year, month, day, hour, minute));
        // Convert to the timezone ( add the offset so it's actually UTC )
        const originalDateInUtc = zonedTimeToUtc(originalDateInTz, timezone);

        // Add 180 days to the date
        const resultInUtc = addDaysInTimezone({ date: originalDateInUtc, days: 180, timezone });

        // Convert back to "local time" to validate hour hasn't changed ( remove the offset )
        const resultInTz = utcToZonedTime(resultInUtc, timezone);

        const yearAfter = 2022;
        const monthAfter = 11; // December
        const dayAfter = 27;
        expect(resultInTz.getFullYear()).toEqual(yearAfter);
        expect(resultInTz.getMonth()).toEqual(monthAfter);
        expect(resultInTz.getDate()).toEqual(dayAfter);
        expect(resultInTz.getHours()).toEqual(hour);
        expect(resultInTz.getMinutes()).toEqual(minute);
    });

    it.each(timezones)("should add days without changing local time starting January at 12:00 AM for %s", (timezone) => {
        const year = 2022;
        const month = 0; // January
        const day = 1;
        const hour = 11;
        const minute = 0;

        // Generate the date we want in the timezone ( treating UTC as local time )
        const originalDateInTz = new Date(Date.UTC(year, month, day, hour, minute));
        // Convert to the timezone ( add the offset so it's actually UTC )
        const originalDateInUtc = zonedTimeToUtc(originalDateInTz, timezone);

        // Add 180 days to the date
        const resultInUtc = addDaysInTimezone({ date: originalDateInUtc, days: 180, timezone });

        // Convert back to "local time" to validate hour hasn't changed ( remove the offset )
        const resultInTz = utcToZonedTime(resultInUtc, timezone);

        const yearAfter = 2022;
        const monthAfter = 5; // June
        const dayAfter = 30;
        expect(resultInTz.getFullYear()).toEqual(yearAfter);
        expect(resultInTz.getMonth()).toEqual(monthAfter);
        expect(resultInTz.getDate()).toEqual(dayAfter);
        expect(resultInTz.getHours()).toEqual(hour);
        expect(resultInTz.getMinutes()).toEqual(minute);
    });
});

describe("formatDateAsUTCString", () => {
    it("should format date in UTC", () => {
        const testDate = new Date(Date.UTC(2023, 0, 15, 14, 30));
        const result = formatDateAsUTCString(testDate);
        expect(result).toBe("January 15, 2023");
    });

    it("should handle single-digit dates", () => {
        const testDate = new Date(Date.UTC(2023, 0, 5, 9, 5));
        const result = formatDateAsUTCString(testDate);
        expect(result).toBe("January 5, 2023");
    });

    it("should ignore time component", () => {
        const morningDate = new Date(Date.UTC(2023, 0, 15, 4, 30));
        const noonDate = new Date(Date.UTC(2023, 0, 15, 12, 0));
        const eveningDate = new Date(Date.UTC(2023, 0, 15, 19, 45));

        expect(formatDateAsUTCString(morningDate)).toBe("January 15, 2023");
        expect(formatDateAsUTCString(noonDate)).toBe("January 15, 2023");
        expect(formatDateAsUTCString(eveningDate)).toBe("January 15, 2023");
    });

    it("should format dates consistently across months", () => {
        const january = new Date(Date.UTC(2023, 0, 15));
        const june = new Date(Date.UTC(2023, 5, 15));
        const december = new Date(Date.UTC(2023, 11, 15));

        expect(formatDateAsUTCString(january)).toBe("January 15, 2023");
        expect(formatDateAsUTCString(june)).toBe("June 15, 2023");
        expect(formatDateAsUTCString(december)).toBe("December 15, 2023");
    });
});

describe("differenceInDaysInTimezone", () => {
    it("should return the correct number of days between two dates in Australia/Canberra timezone", () => {
        const timezone = "Australia/Canberra";

        // Dst change in Canberra is Apr 6 2025
        const date1 = new Date("2025-04-06T14:00:00Z"); // 04/06/2025 11:00 PM AEST
        const date2 = new Date("2025-04-05T14:00:00Z"); // 04/06/2025 12:00 AM AEDT

        const result = differenceInDaysInTimezone({ firstDate: date1, secondDate: date2, timezone });
        expect(result).toBe(0);
    });

    it("should return the correct number of days between two dates in America/New_York timezone", () => {
        const timezone = "America/New_York";

        // Dst change in new york is Nov 2 2025
        const date1 = new Date("2025-11-03T04:00:00Z"); // 11/02/2025 11:00 PM EST
        const date2 = new Date("2025-11-02T04:00:00Z"); // 11/02/2025 12:00 AM EDT

        const result = differenceInDaysInTimezone({ firstDate: date1, secondDate: date2, timezone });
        expect(result).toBe(0);
    });
});
