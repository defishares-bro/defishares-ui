import assert from "assert";
import {
    ChainTypes,
    ops,
    PrivateKey,
    Signature,
    TransactionBuilder
} from "bitsharesjs";
import {
    registerDefiSharesProtocol,
    WORKER_CREATE_GOLD_OPERATION_ID
} from "../lib/chain/defisharesProtocol";

describe("DefiShares protocol extensions", () => {
    it("serializes worker_create_gold as operation 78", () => {
        registerDefiSharesProtocol();

        const operation = {
            fee: {amount: 0, asset_id: "1.3.0"},
            owner: "1.2.1",
            work_begin_date: "2026-08-25T00:00:00",
            work_end_date: "2026-09-25T00:00:00",
            gold_daily_pay: {amount: 100000, asset_id: "1.3.100"},
            name: "GOLD worker",
            url: "https://example.com/worker",
            initializer: [1, {pay_vesting_period_days: 7}]
        };
        const transaction = new TransactionBuilder();

        transaction.add_type_operation("worker_create_gold", operation);

        assert.equal(
            ChainTypes.operations.worker_create_gold,
            WORKER_CREATE_GOLD_OPERATION_ID
        );
        assert.equal(
            Object.keys(ChainTypes.operations)[78],
            "worker_create_gold"
        );
        assert.equal(transaction.operations[0][0], 78);
        assert.equal(transaction.operations[0][1].gold_daily_pay.asset_id, 100);
        assert.equal(
            ops.operation.st_operations[78].operation_name,
            "worker_create_gold"
        );

        const serializedTransaction = ops.signed_transaction.fromObject({
            ref_block_num: 0,
            ref_block_prefix: 0,
            expiration: "2026-08-25T00:00:00",
            operations: transaction.operations,
            extensions: [],
            signatures: []
        });
        const bytes = ops.signed_transaction.toBuffer(serializedTransaction);
        const signature = Signature.signBuffer(
            bytes,
            PrivateKey.fromSeed("defishares-worker-create-gold-test")
        );
        const decoded = ops.signed_transaction.toObject(
            ops.signed_transaction.fromBuffer(bytes)
        );

        assert(
            signature.verifyBuffer(
                bytes,
                signature.recoverPublicKeyFromBuffer(bytes)
            )
        );
        assert.equal(decoded.operations[0][0], 78);
        assert.deepEqual(decoded.operations[0][1].gold_daily_pay, {
            amount: "100000",
            asset_id: "1.3.100"
        });
    });

    it("serializes GOLD refund workers as operation 79", () => {
        registerDefiSharesProtocol();
        const transaction = new TransactionBuilder();
        transaction.add_type_operation("worker_create_gold_refund", {
            fee: {amount: 0, asset_id: "1.3.0"},
            owner: "1.2.1",
            work_begin_date: "2026-08-25T00:00:00",
            work_end_date: "2026-09-25T00:00:00",
            refund_budget_ratio: 8000,
            name: "GOLD refund worker",
            url: "https://example.com/refund"
        });

        assert.equal(transaction.operations[0][0], 79);
        assert.equal(transaction.operations[0][1].refund_budget_ratio, 8000);
        const serialized = ops.signed_transaction.fromObject({
            ref_block_num: 0,
            ref_block_prefix: 0,
            expiration: "2026-08-25T00:00:00",
            operations: transaction.operations,
            extensions: [],
            signatures: []
        });
        const bytes = ops.signed_transaction.toBuffer(serialized);
        const decoded = ops.signed_transaction.toObject(
            ops.signed_transaction.fromBuffer(bytes)
        );
        assert.equal(decoded.operations[0][0], 79);
        assert.equal(decoded.operations[0][1].refund_budget_ratio, 8000);
    });
});
