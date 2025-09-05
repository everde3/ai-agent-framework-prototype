const INVARIANT_PREFIX = "Invariant failed";

/**
 * Throws an error if the condition is not met. Code borrowed from tiny-invariant
 * for type narrowing.
 *
 * https://github.com/alexreardon/tiny-invariant/blob/master/src/tiny-invariant.ts
 *
 * Example usage:
 * invariant(reviewReport !== null, new repoCustomError("Unable to find review report to undelete", 404));
 */
export function invariant(
  condition: unknown,

  /**
   * Can provide a string or an Error instance. If an Error instance is provided,
   * it will be thrown as-is. Note: It is recommended to use an Error instance
   * from @repo/errors for consistency.
   */
  errorOrMessage?: string | Error
): asserts condition {
  if (condition) {
    return;
  }

  let errorInstance: Error;

  if (typeof errorOrMessage === "string") {
    // If it's a string, construct an Error with the prefix
    const finalMessage = `${INVARIANT_PREFIX}: ${errorOrMessage}`;
    errorInstance = new Error(finalMessage);
  } else if (errorOrMessage instanceof Error) {
    // If it's already an Error instance, use it as-is
    errorInstance = errorOrMessage;
  } else {
    errorInstance = new Error(INVARIANT_PREFIX);
  }

  throw errorInstance;
}
