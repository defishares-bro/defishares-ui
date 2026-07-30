export function uniqueAccountNames(accounts) {
    return (accounts || [])
        .filter(account => !!account)
        .map(account =>
            typeof account === "string" ? account : account.get("name")
        )
        .filter(name => !!name)
        .filter((name, index, names) => names.indexOf(name) === index);
}

export function mergeImportedAccountNames(record, accountNames) {
    if (!record) return [];

    const names = uniqueAccountNames(
        (record.account_names || []).concat(accountNames || [])
    );
    record.account_names = names;
    return names;
}
