import { describe, expect, it } from 'vitest';
import { UserFacingError } from '.';

describe.concurrent('UserFacingError class', () => {
    it('constructs correctly with message and statusCode', () => {
        const errorMessage = 'Something went wrong';
        const errorStatusCode = 500;
        const error = new UserFacingError(errorMessage, errorStatusCode);

        expect(error.message).toBe(errorMessage);
        expect(error.name).toBe('UserFacingError');
        expect(error.statusCode).toBe(errorStatusCode);
    });

    it('returns the correct user-facing error message', () => {
        const errorMessage = 'This is a user-friendly error message';
        const error = new UserFacingError(errorMessage, 400);

        expect(error.getUserFacingError()).toBe(errorMessage);
    });

    it('returns the correct status code', () => {
        const errorStatusCode = 404;
        const error = new UserFacingError('Not Found', errorStatusCode);

        expect(error.getStatusCode()).toBe(errorStatusCode);
    });
});