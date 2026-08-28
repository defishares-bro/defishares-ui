export const GOLD_ASSET_ID = "1.3.100";
export const GOLD_RESERVE_VAULT_ID = "2.19.0";
export const GRAPHENE_100_PERCENT = 10000;

function getValue(object, key) {
    return object && object.get ? object.get(key) : object && object[key];
}

function toAmount(value) {
    const amount = Number(value);
    return Number.isFinite(amount) ? amount : 0;
}

export function getWorkerPayment(worker) {
    const goldDailyPay = getValue(worker, "gold_daily_pay");
    const refundBudgetRatio = getValue(worker, "gold_refund_budget_ratio");

    if (refundBudgetRatio !== undefined && refundBudgetRatio !== null) {
        return {
            amount: 0,
            assetId: GOLD_ASSET_ID,
            kind: "gold_refund",
            refundBudgetRatio: toAmount(refundBudgetRatio)
        };
    }

    if (goldDailyPay !== undefined && goldDailyPay !== null) {
        return {
            amount: toAmount(goldDailyPay),
            assetId: GOLD_ASSET_ID,
            kind: "gold"
        };
    }

    return {
        amount: toAmount(getValue(worker, "daily_pay")),
        assetId: "1.3.0",
        kind: "dfs"
    };
}

export function getGoldWorkerBudget(vault, chainTime = Date.now()) {
    if (!vault || !getValue(vault, "enabled")) return null;

    const poolBalance = toAmount(getValue(vault, "gold_pool_balance"));
    const divisor = toAmount(getValue(vault, "daily_spending_divisor")) || 2608;
    const timestamp =
        chainTime instanceof Date
            ? chainTime.getTime()
            : typeof chainTime === "string"
            ? new Date(
                  /Z$/.test(chainTime) ? chainTime : chainTime + "Z"
              ).getTime()
            : chainTime;
    const currentBudgetDay = Math.floor(timestamp / 1000 / 86400);
    const isNewBudgetDay =
        toAmount(getValue(vault, "last_budget_day")) !== currentBudgetDay;
    const dailyBudget = isNewBudgetDay
        ? Math.floor(poolBalance / divisor)
        : toAmount(getValue(vault, "gold_daily_spending_limit"));
    const spentToday = isNewBudgetDay
        ? 0
        : toAmount(getValue(vault, "gold_spent_today"));

    return {
        assetId: getValue(vault, "debt_asset") || GOLD_ASSET_ID,
        totalBudget: poolBalance,
        dailyBudget,
        availableBudget: Math.max(
            0,
            Math.min(poolBalance, dailyBudget - spentToday)
        )
    };
}
