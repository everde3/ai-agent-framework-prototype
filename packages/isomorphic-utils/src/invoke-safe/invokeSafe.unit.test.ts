import { describe, expect, it } from 'vitest';
import { invokeSafe } from '.';

describe.concurrent('invokeSafe function', () => {
    it('returns a successful result when the function executes without errors', () => {
        const successfulFn = () => 'Hello, world!';
        const [data, error] = invokeSafe(successfulFn);

        expect(data).toBe('Hello, world!');
        expect(error).toBeNull();
    });

    it('returns an error result when the function throws an error', () => {
        const errorFn = () => {
            throw new Error('Something went wrong');
        };
        const [data, error] = invokeSafe(errorFn);

        expect(data).toBeNull();
        expect(error).toBeInstanceOf(Error);
        expect(error?.message).toBe('Something went wrong');
    });
});