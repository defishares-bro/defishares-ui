import assert from "assert";
import RestoreAsyncGuard from "../lib/restore/RestoreAsyncGuard.js";

describe("restore page async lifecycle", () => {
    it("ignores an old file callback after the page is closed and reopened", () => {
        const guard = new RestoreAsyncGuard();
        const firstReader = {
            readyState: 1,
            aborted: false,
            abort() {
                this.aborted = true;
            }
        };

        guard.mount();
        const firstVersion = guard.invalidate();
        guard.setReader(firstReader);
        guard.unmount();

        assert.equal(firstReader.aborted, true);
        assert.equal(guard.isActive(firstVersion), false);

        guard.mount();
        const secondVersion = guard.invalidate();
        assert.notEqual(secondVersion, firstVersion);
        assert.equal(guard.isActive(firstVersion), false);
        assert.equal(guard.isActive(secondVersion), true);
    });

    it("invalidates pending work when a new file is selected", () => {
        const guard = new RestoreAsyncGuard();
        const firstReader = {
            readyState: 1,
            aborted: false,
            abort() {
                this.aborted = true;
            }
        };

        guard.mount();
        const firstVersion = guard.invalidate();
        guard.setReader(firstReader);
        const secondVersion = guard.invalidate();

        assert.equal(firstReader.aborted, true);
        assert.equal(guard.isActive(firstVersion), false);
        assert.equal(guard.isActive(secondVersion), true);
    });
});
