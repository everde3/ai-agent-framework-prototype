import { beforeAll, describe, expect, it } from "vitest";

import { type DBConnection, connectToDatabase } from "@repo/dto";

import { DryRunError, createDbReadOnlyProxy } from "./index";

describe("createDbReadOnlyProxy", () => {
  let connection: DBConnection;

  beforeAll(async () => {
    connection = await connectToDatabase("dev/talent/database");
  });

  it("should create a read-only proxy for a MongoDB database", () => {
    const readOnlyDb = createDbReadOnlyProxy(connection.db);
    expect(readOnlyDb).toBeDefined();
  });

  it("should throw an error when a write operation is attempted", () => {
    const readOnlyDb = createDbReadOnlyProxy(connection.db);
    expect(() =>
      readOnlyDb.collection("user").insertOne({ name: "test" })
    ).toThrow(DryRunError);
  });

  it("should allow read operations", () => {
    const readOnlyDb = createDbReadOnlyProxy(connection.db);
    expect(
      readOnlyDb.collection("user").find({}).toArray()
    ).resolves.toBeDefined();
  });

  it("should preserve database-level properties", () => {
    const readOnlyDb = createDbReadOnlyProxy(connection.db);
    expect(readOnlyDb.databaseName).toBe(connection.db.databaseName);
  });

  it("should preserve collection-level properties", () => {
    const readOnlyDb = createDbReadOnlyProxy(connection.db);
    const collection = readOnlyDb.collection("user");
    expect(collection.collectionName).toBe(
      connection.db.collection("user").collectionName
    );
  });

  it("should preserve collection-level methods that aren't read/write operations", () => {
    const readOnlyDb = createDbReadOnlyProxy(connection.db);
    const collection = readOnlyDb.collection("user");
    // namespace is a property that returns the full namespace string (database.collection)
    expect(collection.namespace).toBe(
      connection.db.collection("user").namespace
    );
  });
});
