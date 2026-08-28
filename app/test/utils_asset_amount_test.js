import assert from "assert";
import utils from "../lib/common/utils";

describe("asset amount formatting", () => {
    it("does not throw while an asset is still loading", () => {
        assert.equal(utils.get_asset_amount(100000, undefined), null);
        assert.equal(utils.get_asset_amount(100000, {precision: 5}), 1);
    });
});
