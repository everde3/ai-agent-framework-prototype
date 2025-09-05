import { structuredLogger } from ".";

const main = async () => {
	const logger = structuredLogger({
		userId: null,
		companyId: null,
		requestId: null,
	});

	logger("trace", "Hello world!");
	logger("debug", "Hello world!", {
		meta: {
			foo: "bar",
		},
	});
	logger("info", "Hello world!");
	logger("warn", "Hello world!");
	logger("error", "Hello world!", {
		error: new Error("Hello world!"),
	});
	logger("fatal", "Hello world!");
};

main();
