import { describe, expect, it } from "vitest";
import { lookupDatabaseEnvironment } from ".";

describe.concurrent("lookupDatabaseEnvironment function", () => {
    it("returns 'sandbox' for 'sandbox' and 'demo' environment stages", () => {
        expect(lookupDatabaseEnvironment("sandbox")).toBe("sandbox");
        expect(lookupDatabaseEnvironment("demo")).toBe("sandbox");
    });

    it("returns 'production' for 'production' environment stage", () => {
        expect(lookupDatabaseEnvironment("production")).toBe("production");
    });

    it("returns 'preview' for 'preview' environment stage", () => {
        expect(lookupDatabaseEnvironment("preview")).toBe("preview");
    });

    it("returns 'staging' for other environment stages", () => {
        expect(lookupDatabaseEnvironment("development")).toBe("staging");
        expect(lookupDatabaseEnvironment("test")).toBe("staging");
        expect(lookupDatabaseEnvironment("staging")).toBe("staging");
    });
});