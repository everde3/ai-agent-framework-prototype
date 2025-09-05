/**
 * Constants used throughout the project.
 *
 * Note: Most constants should remain localized to their relevant areas.
 * Only add constants here if they are truly cross-cutting and broadly applicable.
 */

export const DEFAULT_TIMEZONE = "America/New_York";

/**
 * Delimiter used to separate serialized JSON objects in a stream.
 *
 * Importantly, we use a single escape character preceded by some other character.
 * This will never be found within a JSON serialized string because JSON will escape the escape character.
 */
export const JSON_STREAM_DELIMITER = "DELIM\n";
export const JSON_AI_STREAM_DELIMITER = "\n";

/**
 * Roles that are considered admins. Can be used client-side to check if a user is an admin.
 */
export const ADMIN_ROLES = ["billing-admin", "admin", "basic-admin"];
