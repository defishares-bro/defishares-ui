export function isDuplicateStoreError(error) {
    const message =
        error && error.message ? error.message : String(error || "");
    return (
        (error && error.name === "ConstraintError") ||
        /key already exists|constrainterror|constraint error/i.test(message)
    );
}
