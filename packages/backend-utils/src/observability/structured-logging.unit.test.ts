// Dependencies
import { Db, MongoClient, ObjectId } from "mongodb";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { isPrettyPrintEnabled, isSilent, makeErrorEnumerable, safeStringify, structuredLog, structuredLogger } from ".";

vi.mock("os", () => {
	return {
		hostname: vi.fn().mockReturnValue("hostname"),
	};
});

describe.concurrent("structuredLogger", () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.stubEnv("NODE_ENV", "production");
	});

	afterEach(() => {
		vi.useRealTimers();
		vi.unstubAllEnvs();
	});

	it("should log a message", async () => {
		const log = vi.spyOn(console, "log");

		const data = {
			userId: new ObjectId(),
			companyId: new ObjectId(),
			requestId: "requestId",
		};

		const message = "message";

		const logger = structuredLogger(data);
		logger("info", message);

		const parsedLog = JSON.parse(log.mock.calls[0][0]);

		expect(parsedLog).toMatchObject({
			level: 30,
			time: Date.now(),
			message,
			hostname: "hostname",
			userId: data.userId.toHexString(),
			companyId: data.companyId.toHexString(),
			requestId: data.requestId,
		});
	});

	it("overwrites data", async () => {
		const log = vi.spyOn(console, "log");

		const data = {
			userId: new ObjectId(),
			companyId: new ObjectId(),
			requestId: "requestId1",
		};

		const message = "message";

		const logger = structuredLogger(data);
		logger("trace", message, {
			requestId: "requestId2",
		});

		const parsedLog = JSON.parse(log.mock.calls[0][0]);

		expect(parsedLog).toMatchObject({
			level: 10,
			time: Date.now(),
			message,
			hostname: "hostname",
			userId: data.userId.toHexString(),
			companyId: data.companyId.toHexString(),
			requestId: "requestId2",
		});
	});

	it("should merge metadata", async () => {
		const log = vi.spyOn(console, "log");

		const data = {
			userId: new ObjectId(),
			companyId: new ObjectId(),
			requestId: "requestId2",
			meta: {
				foo: "bar",
			},
		};

		const message = "message";

		const logger = structuredLogger(data);
		logger("trace", message, {
			meta: {
				bar: "baz",
			},
		});

		const parsedLog = JSON.parse(log.mock.calls[0][0]);

		expect(parsedLog).toMatchObject({
			level: 10,
			time: Date.now(),
			message,
			hostname: "hostname",
			userId: data.userId.toHexString(),
			companyId: data.companyId.toHexString(),
			requestId: "requestId2",
			meta: {
				foo: "bar",
				bar: "baz",
			},
		});
	});

	it("the child logger metadata should take precedence", async () => {
		const log = vi.spyOn(console, "log");

		const data = {
			userId: new ObjectId(),
			companyId: new ObjectId(),
			requestId: "requestId2",
			meta: {
				foo: "bar",
			},
		};

		const message = "message";

		const logger = structuredLogger(data);
		logger("trace", message, {
			meta: {
				foo: "baz",
			},
		});

		const parsedLog = JSON.parse(log.mock.calls[0][0]);

		expect(parsedLog).toMatchObject({
			level: 10,
			time: Date.now(),
			message,
			hostname: "hostname",
			userId: data.userId.toHexString(),
			companyId: data.companyId.toHexString(),
			requestId: "requestId2",
			meta: {
				foo: "baz",
			},
		});
	});

	it("does not include the 'meta' key if it is empty", async () => {
		const log = vi.spyOn(console, "log");

		const data = {
			userId: new ObjectId(),
			companyId: new ObjectId(),
			requestId: "requestId",
		};

		const message = "message";

		const logger = structuredLogger(data);
		logger("info", message);

		const parsedLog = JSON.parse(log.mock.calls[0][0]);

		expect(parsedLog).toMatchObject({
			level: 30,
			time: Date.now(),
			message,
			hostname: "hostname",
			userId: data.userId.toHexString(),
			companyId: data.companyId.toHexString(),
			requestId: data.requestId,
		});

		expect(parsedLog).not.toHaveProperty("meta");
	});
});

describe.concurrent("structuredLog", () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.stubEnv("NODE_ENV", "production");
	});

	afterEach(() => {
		vi.useRealTimers();
		vi.unstubAllEnvs();
	});

	it("should log a message", async () => {
		const log = vi.spyOn(console, "log");

		const data = {
			userId: new ObjectId(),
			companyId: new ObjectId(),
			requestId: "requestId",
		};

		const message = "message";

		structuredLog("info", message, data);

		const parsedLog = JSON.parse(log.mock.calls[0][0]);

		expect(parsedLog).toMatchObject({
			level: 30,
			time: Date.now(),
			message,
			hostname: "hostname",
			userId: data.userId.toHexString(),
			companyId: data.companyId.toHexString(),
			requestId: data.requestId,
		});
	});

	it("should log an error with a stack trace and other properties", async () => {
		// ARRANGE
		const log = vi.spyOn(console, "log");

		const data = {
			userId: new ObjectId(),
			companyId: new ObjectId(),
			requestId: "requestId",
			error: new Error("error"),
		};

		const message = "message";

		// ACT
		structuredLog("error", message, data);

		// ASSERT
		const parsedLog = JSON.parse(log.mock.calls[0][0]);

		// Check that the error is structured correctly
		expect(parsedLog).toHaveProperty("error");
		expect(parsedLog.error).toHaveProperty("message", "error");
		expect(parsedLog.error).toHaveProperty("stack");

		// Continue to check that the rest of the properties are set
		expect(parsedLog).toHaveProperty("level", 50);
		expect(parsedLog).toHaveProperty("time");
		expect(parsedLog).toHaveProperty("message", message);
		expect(parsedLog).toHaveProperty("hostname", "hostname");
		expect(parsedLog).toHaveProperty("userId", data.userId.toHexString());
		expect(parsedLog).toHaveProperty("companyId", data.companyId.toHexString());
		expect(parsedLog).toHaveProperty("requestId", data.requestId);
	});

	it("can handle circular references", () => {
		const log = vi.spyOn(console, "log");

		const data: any = {
			userId: new ObjectId(),
			companyId: new ObjectId(),
			requestId: "requestId",
			meta: {
				circular: {
					foo: "bar",
				},
			},
		};

		data.meta.circular.circular = data.meta.circular;

		const message = "message";

		structuredLog("info", message, data);

		const parsedLog = JSON.parse(log.mock.calls[0][0]);

		expect(parsedLog).toMatchObject({
			level: 30,
			time: Date.now(),
			message,
			hostname: "hostname",
			userId: data.userId.toHexString(),
			companyId: data.companyId.toHexString(),
			requestId: data.requestId,
		});
	});

	it("should return when isSilent() is true", () => {
		vi.stubEnv("NODE_ENV", "test");
		const data = {
			userId: new ObjectId(),
			companyId: new ObjectId(),
			requestId: "requestId",
		};

		const message = "message";

		expect(structuredLog("info", message, data)).toBe(undefined)
	})

	it("should pretty print logs when enabled", () => {
		vi.stubEnv("NODE_ENV", "local");
	
		const consoleLogSpy = vi.spyOn(console, "log");
	
		const data = {
			userId: new ObjectId(),
			companyId: new ObjectId(),
			requestId: "someRequestId",
			meta: { someKey: "someValue" },
		};
	
		const message = "This is a test message";
		structuredLog("info", message, data);
	
		expect(consoleLogSpy).toHaveBeenCalled();
	});

	it("should pretty print errors in the log message when present", () => {
		vi.stubEnv("NODE_ENV", "local");

        const consoleLogSpy = vi.spyOn(console, "log");

        const data = {
            userId: new ObjectId(),
            companyId: new ObjectId(),
            requestId: "someRequestId",
            error: new Error("This is a test error"),
        };

        const message = "This is a test message with an error";
        structuredLog("error", message, data);

        expect(consoleLogSpy).toHaveBeenCalled();

        const loggedMessage = consoleLogSpy.mock.calls[0][0];

        expect(loggedMessage).toContain(
			"This is a test message with an error"
		);
    });
});

describe.concurrent("makeErrorEnumerable", () => {
	it("should make an error and all of its properties enumerable", () => {
		// ARRANGE
		const CustomError = class extends Error {
			pizza: string;

			constructor(message?: string) {
				super(message);
				this.name = "CustomError";
				this.pizza = "Cheese";
				Error.captureStackTrace(this, CustomError);
			}
		};

		const error = new CustomError("error");

		// ACT
		const enumerableError = makeErrorEnumerable(error);

		// ASSERT
		// We stringify here for additional certainty that the error is enumerable.
		const errorString = JSON.stringify(enumerableError);

		expect(errorString).toContain('"name":"CustomError"');
		expect(errorString).toContain('"message":"error"');
		expect(errorString).toContain('"stack":');
		expect(errorString).toContain('"pizza":"Cheese"');
	});

	it("should return the error if it is not an instance of Error", () => {
		// ARRANGE
		const stringError = "error";
		const numberError = 1;
		const booleanError = true;
		const nullError = null;
		const undefinedError = undefined;
		const objectError = { foo: "bar" };
		const arrayError = ["foo", "bar"];

		// ACT
		const stringResult = makeErrorEnumerable(stringError);
		const numberResult = makeErrorEnumerable(numberError);
		const booleanResult = makeErrorEnumerable(booleanError);
		const nullResult = makeErrorEnumerable(nullError);
		const undefinedResult = makeErrorEnumerable(undefinedError);
		const objectResult = makeErrorEnumerable(objectError);
		const arrayResult = makeErrorEnumerable(arrayError);

		// ASSERT
		expect(stringResult).toBe(stringError);
		expect(numberResult).toBe(numberError);
		expect(booleanResult).toBe(booleanError);
		expect(nullResult).toBe(nullError);
		expect(undefinedResult).toBe(undefinedError);
		expect(objectResult).toBe(objectError);
		expect(arrayResult).toBe(arrayError);
	});
});

describe.concurrent("isPrettyPrintEnabled", () => {
    afterEach(() => {
		vi.unstubAllEnvs();
    });

    it("returns true when NODE_ENV is neither 'production' nor 'development'", () => {
		vi.stubEnv("NODE_ENV", "test");
        expect(isPrettyPrintEnabled()).toBe(true);

		vi.stubEnv("NODE_ENV", "local");
        expect(isPrettyPrintEnabled()).toBe(true);
    });

    it("returns false when NODE_ENV is 'production' or 'development'", () => {
		vi.stubEnv("NODE_ENV", "production");
        expect(isPrettyPrintEnabled()).toBe(false);

		vi.stubEnv("NODE_ENV", "production");
        expect(isPrettyPrintEnabled()).toBe(false);
    });
});

describe.concurrent("isSilent", () => {
    afterEach(() => {
		vi.unstubAllEnvs();
    });

    it("returns true when NODE_ENV is 'test'", () => {
		vi.stubEnv("NODE_ENV", "test");
        expect(isSilent()).toBe(true);
    });

    it("returns false when NODE_ENV is not 'test'", () => {
		vi.stubEnv("NODE_ENV", "production");
        expect(isSilent()).toBe(false);

		vi.stubEnv("NODE_ENV", "development");
        expect(isSilent()).toBe(false);

		vi.stubEnv("NODE_ENV", "local");
        expect(isSilent()).toBe(false);
    });
});

describe.concurrent("safeStringify", () => {
	const mongoClient = new MongoClient("mongodb://localhost:27017");
	const db = new Db(mongoClient, "test");

    it("stringifies a simple object", () => {
        const obj = { a: 1, b: "hello" };
        const result = safeStringify(obj, 3);
        expect(result).toBe('{\n  "a": 1,\n  "b": "hello"\n}');
    });

    it("handles circular references", () => {
        const obj: any = { a: 1, b: { c: 2 } };
        obj.b.d = obj;

        const result = safeStringify(obj, 3);

        expect(result).toContain("--circular reference--");
    });

    it("handles depth limit", () => {
        const obj = { a: 1, b: { c: 2, d: { e: 3, f: { g: 4 } } } };

        const result = safeStringify(obj, 2);

        expect(result).toContain("--depth limit reached--");
    });

	it("returns 'MONGO INSTANCE' for Db instance", () => {
        const obj = { database: db };

        const result = safeStringify(obj, 3);

        expect(result).toContain('MONGO INSTANCE: Db');
    });

    it("returns 'MONGO INSTANCE' for MongoClient instance", () => {
        const mongoClient = new MongoClient("mongodb://localhost:27017");
        const obj = { client: mongoClient };

        const result = safeStringify(obj, 3);

        expect(result).toContain('MONGO INSTANCE: MongoClient');
    });
});