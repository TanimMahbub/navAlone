/** Small, pure DOM/value utilities shared across the modules. */

let counter = 0;

/** Monotonic unique id with a prefix, e.g. `nv-d-12`. */
export function uid(prefix: string): string {
    counter += 1;
    return prefix + "-" + counter;
}

/** Numbers become `px`; strings pass through unchanged. */
export function toCssLength(value: string | number): string {
    return typeof value === "number" ? value + "px" : value;
}

/** Resolve `animationDuration` (ms number or CSS string) to a millisecond count. */
export function durationMs(value: string | number | null): number {
    if (typeof value === "number") {
        return value;
    }
    return (value != null ? parseInt(value, 10) : NaN) || 300;
}

/** CSS.escape an id where available, otherwise pass through. */
export function escapeId(id: string): string {
    return window.CSS && window.CSS.escape ? window.CSS.escape(id) : id;
}
