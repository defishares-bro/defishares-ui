function getBalanceAmount(balance) {
    if (!balance || !balance.balance) {
        throw new Error("Invalid balance object");
    }

    const vestedBalance = balance.vested_balance;
    const amount = vestedBalance
        ? vestedBalance.amount
        : balance.balance.amount;
    const assetId = vestedBalance
        ? vestedBalance.asset_id
        : balance.balance.asset_id;

    if (amount === undefined || assetId === undefined) {
        throw new Error("Balance object has no claimable amount");
    }

    return {
        amount: String(amount),
        asset_id: assetId
    };
}

export function createBalanceClaimOperation(accountId, balance) {
    if (!accountId) {
        throw new Error("An account is required to claim a balance");
    }
    if (!balance || !balance.id || !balance.public_key_string) {
        throw new Error("Balance is missing its owner key or object id");
    }

    return {
        fee: {amount: "0", asset_id: "1.3.0"},
        deposit_to_account: accountId,
        balance_to_claim: balance.id,
        balance_owner_key: balance.public_key_string,
        total_claimed: getBalanceAmount(balance)
    };
}

export function getBalanceClaimAmount(balance) {
    return getBalanceAmount(balance);
}

export function getBalanceClaimKeyStatus(
    privateKeyRecord,
    hasInMemoryKey,
    hasWalletCipherKey
) {
    if (hasInMemoryKey) return null;
    if (!privateKeyRecord) return "missing";
    if (!hasWalletCipherKey) return "locked";
    if (!privateKeyRecord.encrypted_key) return "invalid";
    return null;
}

export function createBalanceClaimSignerError(keyErrors) {
    const error = new Error("Balance claim signing keys are unavailable");
    error.code = "BALANCE_CLAIM_SIGNER_UNAVAILABLE";
    error.keys = keyErrors;
    return error;
}

export function getBalanceClaimSignerErrors(error) {
    if (!error) return null;
    if (error.code === "BALANCE_CLAIM_SIGNER_UNAVAILABLE") return error.keys;
    if (error.code === "BALANCE_CLAIM_KEY_ERROR")
        return [
            {
                public_key: error.public_key,
                reason: error.reason || "invalid"
            }
        ];
    return null;
}

export function getMissingActiveAuthority(error) {
    const errorData = error && error.data;
    const stack =
        errorData && Array.isArray(errorData.stack) ? errorData.stack : [];
    const authorityError = stack.find(
        entry =>
            entry.context &&
            entry.context.data &&
            entry.context.data.auth &&
            entry.context.data.id
    );

    if (!authorityError || errorData.name !== "tx_missing_active_auth")
        return null;

    const auth = authorityError.context.data.auth;
    const publicKeys = (auth.key_auths || []).map(authEntry => authEntry[0]);
    if (!publicKeys.length) return null;

    return {
        account_id: authorityError.context.data.id,
        public_keys: publicKeys
    };
}
