import { describe, it, expect } from 'vitest';
import { invariant } from './index';

describe.concurrent('invariant', () => {
  it('should not throw if condition is true', () => {
    expect(() => {
      invariant(true, "This won't throw");
    }).not.toThrow();
  });

  it('should throw with a default error if no message or error is provided', () => {
    expect(() => {
      invariant(false);
    }).toThrowError(new Error("Invariant failed"));
  });

  it('should throw an error with a custom message if a string is provided', () => {
    const message = "This is a custom error message";
    expect(() => {
      invariant(false, message);
    }).toThrowError(new Error(`Invariant failed: ${message}`));
  });

  it('should throw the provided error if an Error instance is given', () => {
    const customError = new Error("This is a custom error instance");
    expect(() => {
      invariant(false, customError);
    }).toThrowError(customError);
  });

  it('should throw a custom error with its type intact', () => {
    class MyCustomError extends Error {
      constructor(message: string) {
        super(message);
        this.name = 'MyCustomError';
      }
    }

    const customError = new MyCustomError("This is a custom error");
    expect(() => {
      invariant(false, customError);
    }).toThrowError(customError);
    expect(() => {
      invariant(false, customError);
    }).toThrowError(MyCustomError);
  });

  it('should prefix the message with "Invariant failed" if a string is provided', () => {
    const message = "This is a specific failure";
    expect(() => {
      invariant(false, message);
    }).toThrowError(new Error(`Invariant failed: ${message}`));
  });

  it('should handle functions returning a string message', () => {
    const dynamicMessage = () => "This is a computed error message";
    expect(() => {
      invariant(false, dynamicMessage());
    }).toThrowError(new Error(`Invariant failed: ${dynamicMessage()}`));
  });
});
