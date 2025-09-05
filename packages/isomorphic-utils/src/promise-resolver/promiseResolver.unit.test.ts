import { describe, expect, it } from "vitest";
import { promiseResolver } from ".";

describe.concurrent("promiseResolver function", () => {
    it("resolves with data and null error on successful promise", async () => {
        const promise = Promise.resolve("some data");
        const [data, error] = await promiseResolver(promise);

        expect(data).toBe("some data");
        expect(error).toBeNull();
    });

    it("resolves with null data and Error object on rejected promise", async () => {
        const promise = Promise.reject(new Error("Some error occurred"));
        const [data, error] = await promiseResolver(promise);

        expect(data).toBeNull();
        expect(error).toBeInstanceOf(Error);
        expect(error?.message).toBe("Some error occurred");
    });

    it("re-throws non-Error throwable", async () => {
        const nonErrorThrowable = "This is not an Error object";
        const promise = Promise.reject(nonErrorThrowable);

        await expect(promiseResolver(promise)).rejects.toBe(nonErrorThrowable);
    });
});