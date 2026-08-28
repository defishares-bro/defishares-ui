import {ChainTypes, ops, Serializer, types} from "bitsharesjs";

export const WORKER_CREATE_GOLD_OPERATION_ID = 78;
export const WORKER_CREATE_GOLD_REFUND_OPERATION_ID = 79;

const GOLD_WORKER_OPERATION = "worker_create_gold";
const GOLD_REFUND_WORKER_OPERATION = "worker_create_gold_refund";

/**
 * Registers DefiShares operations added after the BitSharesJS 6.0.3 schema.
 * The serializer is intentionally derived from worker_create because the only
 * wire-format difference is that daily_pay is an asset instead of a share_type.
 */
export function registerDefiSharesProtocol() {
    const legacyWorkerTypes = ops.worker_create.types;
    let workerCreateGold = ops[GOLD_WORKER_OPERATION];

    if (!workerCreateGold) {
        workerCreateGold = new Serializer("worker_create_gold", {
            fee: legacyWorkerTypes.fee,
            owner: legacyWorkerTypes.owner,
            work_begin_date: legacyWorkerTypes.work_begin_date,
            work_end_date: legacyWorkerTypes.work_end_date,
            gold_daily_pay: legacyWorkerTypes.fee,
            name: legacyWorkerTypes.name,
            url: legacyWorkerTypes.url,
            initializer: legacyWorkerTypes.initializer
        });
        ops[GOLD_WORKER_OPERATION] = workerCreateGold;
    }

    let workerCreateGoldRefund = ops[GOLD_REFUND_WORKER_OPERATION];
    if (!workerCreateGoldRefund) {
        workerCreateGoldRefund = new Serializer("worker_create_gold_refund", {
            fee: legacyWorkerTypes.fee,
            owner: legacyWorkerTypes.owner,
            work_begin_date: legacyWorkerTypes.work_begin_date,
            work_end_date: legacyWorkerTypes.work_end_date,
            refund_budget_ratio: types.uint16,
            name: legacyWorkerTypes.name,
            url: legacyWorkerTypes.url
        });
        ops[GOLD_REFUND_WORKER_OPERATION] = workerCreateGoldRefund;
    }

    // Keep Object.keys(ChainTypes.operations)[operation_id] valid in the
    // existing operation-history UI while only serializing the new operation.
    ChainTypes.operations.liquidity_pool_update = 75;
    ChainTypes.operations.credit_deal_update = 76;
    ChainTypes.operations.limit_order_update = 77;
    ChainTypes.operations.worker_create_gold = WORKER_CREATE_GOLD_OPERATION_ID;
    ChainTypes.operations.worker_create_gold_refund = WORKER_CREATE_GOLD_REFUND_OPERATION_ID;
    ops.operation.st_operations[
        WORKER_CREATE_GOLD_OPERATION_ID
    ] = workerCreateGold;
    ops.operation.st_operations[
        WORKER_CREATE_GOLD_REFUND_OPERATION_ID
    ] = workerCreateGoldRefund;

    return {workerCreateGold, workerCreateGoldRefund};
}

registerDefiSharesProtocol();
