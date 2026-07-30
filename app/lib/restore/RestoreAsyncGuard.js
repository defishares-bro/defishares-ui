export default class RestoreAsyncGuard {
    constructor() {
        this.mounted = false;
        this.version = 0;
        this.reader = null;
        this.timeout = null;
    }

    mount() {
        this.mounted = true;
    }

    unmount() {
        this.mounted = false;
        this.version += 1;
        this.cancelReader();
        this.clearTimeout();
    }

    invalidate() {
        this.version += 1;
        this.cancelReader();
        return this.version;
    }

    isActive(version) {
        return this.mounted && version === this.version;
    }

    setReader(reader) {
        this.reader = reader;
    }

    clearReader(reader) {
        if (this.reader === reader) this.reader = null;
    }

    setTimeout(timeout) {
        this.timeout = timeout;
    }

    clearTimeout() {
        if (this.timeout) {
            clearTimeout(this.timeout);
            this.timeout = null;
        }
    }

    cancelReader() {
        if (
            this.reader &&
            this.reader.readyState === 1 &&
            typeof this.reader.abort === "function"
        ) {
            this.reader.abort();
        }
        this.reader = null;
    }
}
