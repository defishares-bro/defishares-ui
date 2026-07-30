import assert from "assert";
import {
    mergeImportedAccountNames,
    uniqueAccountNames
} from "../lib/restore/ImportedKeyAccounts.js";
import {isDuplicateStoreError} from "../lib/restore/IndexedDbErrors.js";

describe("imported key account metadata", () => {
    it("deduplicates account names returned by key lookup", () => {
        const accounts = [{get: () => "alice"}, {get: () => "alice"}, "bob"];

        assert.deepEqual(uniqueAccountNames(accounts), ["alice", "bob"]);
    });

    it("persists discovered accounts on the imported key record", () => {
        const record = {account_names: ["alice"]};

        assert.deepEqual(mergeImportedAccountNames(record, ["bob", "alice"]), [
            "alice",
            "bob"
        ]);
        assert.deepEqual(record.account_names, ["alice", "bob"]);
    });

    it("treats IndexedDB duplicate keys as an idempotent link", () => {
        assert.equal(
            isDuplicateStoreError({
                name: "ConstraintError",
                message: "Key already exists in the object store"
            }),
            true
        );
        assert.equal(
            isDuplicateStoreError(new Error("network failure")),
            false
        );
    });
});
