import assert from "assert";
import {PrivateKey, PublicKey, Signature, ops} from "bitsharesjs";
import {
    createBalanceClaimOperation,
    createBalanceClaimSignerError,
    getBalanceClaimAmount,
    getBalanceClaimKeyStatus,
    getBalanceClaimSignerErrors,
    getMissingActiveAuthority
} from "../lib/chain/BalanceClaim.js";

describe("balance claim", () => {
    const privateKey = PrivateKey.fromSeed("defishares-balance-claim-test");
    const publicKey = privateKey.toPublicKey().toPublicKeyString();

    it("constructs the protocol balance_claim fields", () => {
        const balance = {
            id: "1.15.42",
            owner: privateKey.toPublicKey().toAddressString(),
            balance: {amount: "123456", asset_id: "1.3.0"},
            public_key_string: publicKey
        };
        const operation = createBalanceClaimOperation("1.2.345", balance);
        const serialized = ops.balance_claim.fromObject(operation);
        const json = ops.balance_claim.toObject(serialized);

        assert.equal(json.deposit_to_account, "1.2.345");
        assert.equal(json.balance_to_claim, "1.15.42");
        assert.equal(json.balance_owner_key, publicKey);
        assert.deepEqual(getBalanceClaimAmount(balance), {
            amount: "123456",
            asset_id: "1.3.0"
        });
    });

    it("signs with the private key matching the balance owner key", () => {
        const payload = Buffer.from("local balance_claim fixture");
        const signature = Signature.signBuffer(payload, privateKey);
        const recovered = signature.recoverPublicKeyFromBuffer(payload);

        assert(
            signature.verifyBuffer(
                payload,
                PublicKey.fromPublicKeyString(publicKey)
            )
        );
        assert.equal(recovered.toPublicKeyString(), publicKey);
    });

    it("extracts a missing active authority from a node rejection", () => {
        const error = {
            data: {
                name: "tx_missing_active_auth",
                stack: [
                    {
                        context: {
                            data: {
                                id: "1.2.345",
                                auth: {
                                    key_auths: [[publicKey, 1]]
                                }
                            }
                        }
                    }
                ]
            }
        };

        assert.deepEqual(getMissingActiveAuthority(error), {
            account_id: "1.2.345",
            public_keys: [publicKey]
        });
    });

    it("classifies missing, locked, valid, and malformed key records", () => {
        const validRecord = {pubkey: publicKey, encrypted_key: "cipher"};

        assert.equal(getBalanceClaimKeyStatus(null, false, true), "missing");
        assert.equal(
            getBalanceClaimKeyStatus(validRecord, false, false),
            "locked"
        );
        assert.equal(getBalanceClaimKeyStatus(validRecord, false, true), null);
        assert.equal(
            getBalanceClaimKeyStatus(
                {pubkey: publicKey, encrypted_key: ""},
                false,
                true
            ),
            "invalid"
        );
        assert.equal(getBalanceClaimKeyStatus(null, true, false), null);
    });

    it("keeps signer failures readable without exposing private key data", () => {
        const error = createBalanceClaimSignerError([
            {public_key: publicKey, reason: "invalid"}
        ]);

        assert.deepEqual(getBalanceClaimSignerErrors(error), [
            {public_key: publicKey, reason: "invalid"}
        ]);
        assert.equal(
            error.message,
            "Balance claim signing keys are unavailable"
        );
    });
});
