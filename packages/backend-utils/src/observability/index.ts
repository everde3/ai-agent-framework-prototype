import { Db, MongoClient, ObjectId } from "mongodb";
import { hostname } from "os";

import { PartiallyOptional } from "@repo/utils-isomorphic";

const logLevels = {
  trace: 10,
  debug: 20,
  info: 30,
  warn: 40,
  error: 50,
  fatal: 60,
};

type LogLevel = keyof typeof logLevels;
type ErrorLevel = Extract<LogLevel, "error">;

type LogData = {
  userId: null | string | ObjectId;
  companyId: null | string | ObjectId;
  requestId: null | string;
  error?: unknown;
  meta?: Record<string, unknown>;
};

export type StructuredLog = (
  level: LogLevel,
  message: string,
  data: LogData
) => void;
export type StructuredLogger = {
  <L extends LogLevel>(
    level: L,
    message: string,
    extraData?: Partial<LogData>
  ): void;
  <L extends ErrorLevel>(
    level: L,
    message: string,
    extraData: Partial<LogData> & { error: unknown }
  ): void;
};

/**
 * Error objects are not enumerable, so they won't be printed when stringified.
 * This will make the error enumerable so it will be printed. If the error is
 * not an instance of Error, it will be returned as is.
 **/
export const makeErrorEnumerable = (error: unknown) => {
  if (!(error instanceof Error)) {
    return error;
  }

  const errorProps = Object.getOwnPropertyNames(error);
  const enumerableError: { [key: string]: any } = {};

  errorProps.forEach((prop) => {
    // "any" is necessary here because casting to Error wouldn't include the
    // custom properties on custom error classes
    enumerableError[prop] = (error as any)[prop];
  });

  return enumerableError;
};

/**
 * This will print the logs in a human readable format when running locally.
 */
export const isPrettyPrintEnabled = () => {
  return (
    process.env.NODE_ENV !== "production" &&
    process.env.NODE_ENV !== "development"
  );
};

export const isSilent = () => {
  return process.env.NODE_ENV === "test";
};

/**
 * Safely stringify an object, limiting the depth to prevent circular references.
 * This is useful for logging objects that may contain circular references.
 * It will also prevent the log from being too large.
 */
export function safeStringify(
  obj: any,
  limit: number,
  spacer: number = 2
): string {
  let currentDepth = 0;
  const seen = new WeakSet();

  const replacer = (key: string, value: any) => {
    // if we have an instance of Mongo's Db or MongoClient, we don't need
    // to log this object. Return the constructor name instead.
    if (value instanceof Db || value instanceof MongoClient) {
      return `MONGO INSTANCE: ${value.constructor.name}`;
    }

    if (typeof value === "object" && value !== null) {
      if (seen.has(value)) {
        return "--circular reference--";
      }
      seen.add(value);

      if (currentDepth > limit) {
        return "--depth limit reached--";
      }

      currentDepth++;
    }
    return value;
  };

  return JSON.stringify(obj, replacer, spacer);
}

/**
 * Log a message to stdout in a structured format that can be parsed by log
 * aggregators.
 *
 * How to choose a log level:
 * - TRACE: very detailed logs, designed specifically for tracing the path of
 * 	code execution within a program.
 * - DEBUG: Used for logging messages that aid developers in identifying issues
 * 	during a debugging session.
 * - INFO: Captures events in the system that are significant to the
 * 	application's business purpose.
 * - WARN: Potentially harmful situations which still allow the application to
 * 	continue running.
 * - ERROR: Indicates error conditions within an application that hinder the execution of a specific operation.
 * - FATAL: Severe error events that will presumably lead the application to abort.
 */
export const structuredLog: StructuredLog = (
  level: LogLevel,
  message: string,
  data: LogData
) => {
  const { meta, userId, companyId, requestId } = data;

  if (isSilent()) {
    return;
  }

  try {
    const error = makeErrorEnumerable(data?.error);

    const json = {
      level: logLevels[level],
      time: Date.now(),
      hostname: hostname(),
      message,
      userId: userId?.toString(),
      companyId: companyId?.toString(),
      requestId,
      meta,
      error,
    };

    if (isPrettyPrintEnabled()) {
      // format timestamp as '17:35:28.992'
      const timestamp = new Date(json.time);
      const formattedTimestamp = `${timestamp.getHours()}:${timestamp.getMinutes()}:${timestamp.getSeconds()}.${timestamp.getMilliseconds()}`;

      // print message type as color
      const color = {
        trace: "\x1b[35m",
        debug: "\x1b[34m",
        info: "\x1b[32m",
        warn: "\x1b[33m",
        error: "\x1b[31m",
        fatal: "\x1b[31m",
      }[level];

      const messageParts = [json.message];

      if (json.meta) {
        messageParts.push(safeStringify(json.meta, Infinity, 2));
      }

      if (json.error) {
        messageParts.push(safeStringify(json.error, Infinity, 2));
      }

      const message = messageParts.join("\n");

      console.log(
        `[${formattedTimestamp}] ${color}${level
          .toUpperCase()
          .padEnd(5)}\x1b[0m: ${message}`
      );
      return;
    }

    console.log(safeStringify(json, Infinity, 0));
  } catch (error) {
    console.error("Error while logging", error);
  }
};

// StructuredLoggerArgs is a conditional type that depends on the log level L.
// If L is an error level, StructuredLoggerArgs requires three arguments: level, message, and extraData, where extraData must include an error property.
// If L is not an error level, StructuredLoggerArgs requires two arguments: level and message, and has an optional third argument: extraData.
// This is to help guide the developer to pass error data to the correct place when logging error level logs.
type StructuredLoggerArgs<L extends LogLevel> = L extends ErrorLevel
  ? [
      level: L,
      message: string,
      extraData: Partial<LogData> & { error: unknown }
    ]
  : [level: L, message: string, extraData?: Partial<LogData>];

/**
 * Creates a structured logger with any of the StructuredLogData fields pre-filled.
 * This allows a dev to create a logger without having to pass in the same
 * data every time.
 *
 * This is useful for logging in a specific context, like a request or a
 * function.
 *
 * All metadata will be merged together, with the passed in metadata taking
 * precedence.
 */
export const structuredLogger = (
  data: PartiallyOptional<LogData, "error" | "meta">
) => {
  function logger<L extends LogLevel>(...args: StructuredLoggerArgs<L>) {
    const [level, message, extraData = {}] = args;
    let meta: Record<string, unknown> | undefined = {
      ...data.meta,
      ...(extraData.meta ?? {}),
    };

    // remove empty meta
    if (Object.keys(meta).length === 0) {
      meta = undefined;
    }

    structuredLog(level, message, { ...data, ...extraData, meta });
  }

  return logger;
};
