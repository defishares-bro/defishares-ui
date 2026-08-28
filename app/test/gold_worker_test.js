import assert from "assert";
import {
    GOLD_ASSET_ID,
    getGoldWorkerBudget,
    getWorkerPayment
} from "../lib/chain/goldWorker";

describe("GOLD worker UI data", () => {
    it("keeps legacy DFS workers denominated in DFS", () => {
        assert.deepEqual(getWorkerPayment({daily_pay: 100000}), {
            amount: 100000,
            assetId: "1.3.0",
            kind: "dfs"
        });
    });

    it("reads GOLD worker and refund fields in chain units", () => {
        assert.deepEqual(getWorkerPayment({gold_daily_pay: 11111}), {
            amount: 11111,
            assetId: GOLD_ASSET_ID,
            kind: "gold"
        });
        assert.deepEqual(getWorkerPayment({gold_refund_budget_ratio: 8000}), {
            amount: 0,
            assetId: GOLD_ASSET_ID,
            kind: "gold_refund",
            refundBudgetRatio: 8000
        });
    });

    it("shows pool balance separately from available daily budget", () => {
        const budget = getGoldWorkerBudget(
            {
                enabled: true,
                debt_asset: GOLD_ASSET_ID,
                gold_pool_balance: 30306328,
                gold_daily_spending_limit: 11621,
                gold_spent_today: 1000,
                daily_spending_divisor: 2608,
                last_budget_day: Math.floor(Date.now() / 1000 / 86400)
            },
            Date.now()
        );
        assert.equal(budget.totalBudget, 30306328);
        assert.equal(budget.dailyBudget, 11621);
        assert.equal(budget.availableBudget, 10621);
    });
});
