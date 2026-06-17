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

/**
 * Nearest scrollable ancestor of `el`, or `window` when the page itself is the
 * scroller (the common case). Used by the `"smart"` auto-hide bar to know which
 * element's scroll position to watch — so it works on a normal page AND inside a
 * scrolling container (e.g. the docs preview iframe).
 */
export function findScrollParent(el: HTMLElement): HTMLElement | Window {
    let node: HTMLElement | null = el.parentElement;
    while (node && node !== document.body && node !== document.documentElement) {
        const oy = getComputedStyle(node).overflowY;
        if (oy === "auto" || oy === "scroll" || oy === "overlay") {
            return node;
        }
        node = node.parentElement;
    }
    return window;
}

/** Current vertical scroll offset of a `window`-or-element scroll source. */
export function scrollTopOf(target: HTMLElement | Window): number {
    return target === window
        ? window.scrollY || document.documentElement.scrollTop || 0
        : (target as HTMLElement).scrollTop;
}
