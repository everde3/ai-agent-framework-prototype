import { describe, expect, it, vi } from "vitest";


import { SimpleCache } from ".";

describe.concurrent("SimpleCache", () => {
    it("should cache async function calls and await all promises", async () => {
        // Timeout to simulate an async function
        const mockFunction = vi.fn((key: string) => new Promise<string>((resolve) => setTimeout(() => resolve(key), 200)));

        const cache = new SimpleCache<string>(
            mockFunction,
        );

        // Random assortment of keys with duplicates
        const key1 = "key1";
        const key2 = "key2";
        const key3 = "key3";
        const keyValues = [key1, key2, key3, key1, key2, key3, key1, key2, key3];

        // Store all values
        const resolvedValues: string[] = [];

        // Access the cache with each key, use callback to push the resolved value to the array
        keyValues.forEach((key) => {
            cache.get(key).then((value) => resolvedValues.push(value));
        });

        // Await all value
        await cache.awaitAll();

        // Cache should only call the function once per unique value
        expect(mockFunction).toHaveBeenCalledTimes(new Set(keyValues).size);

        // Check single value
        expect(cache.get(key1)).resolves.toBe(key1);

        // Check values array, should be the same as input keys, but random order
        expect(resolvedValues.length).toBe(keyValues.length);
        expect(resolvedValues.filter((value) => value === key1).length).toBe(3);
        expect(resolvedValues.filter((value) => value === key2).length).toBe(3);
        expect(resolvedValues.filter((value) => value === key3).length).toBe(3);
    });
});
