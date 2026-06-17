/**
 * jsdom environment shims. jsdom has no requestAnimationFrame and no
 * matchMedia, both of which Navalone relies on. The matchMedia mock is
 * controllable via `setViewport()` so mode-switching can be unit-tested.
 */
import { afterEach } from "vitest";

if (typeof globalThis.requestAnimationFrame !== "function") {
    globalThis.requestAnimationFrame = ((cb: FrameRequestCallback) =>
        setTimeout(() => cb(Date.now()), 0) as unknown as number) as typeof requestAnimationFrame;
    globalThis.cancelAnimationFrame = ((id: number) =>
        clearTimeout(id)) as typeof cancelAnimationFrame;
}

type Listener = (e: { matches: boolean }) => void;
interface MockMql {
    media: string;
    maxWidth: number;
    matches: boolean;
    listeners: Set<Listener>;
    addEventListener: (type: string, cb: Listener) => void;
    removeEventListener: (type: string, cb: Listener) => void;
}

const mqls: MockMql[] = [];
// The simulated viewport width that `(max-width: Npx)` queries compare against.
let currentWidth = 100000;

(window as unknown as { matchMedia: (m: string) => unknown }).matchMedia = (media: string) => {
    const m = /max-width:\s*(\d+)px/.exec(media);
    const maxWidth = m ? Number(m[1]) : Infinity;
    const mql: MockMql = {
        media,
        maxWidth,
        get matches() {
            return currentWidth <= this.maxWidth;
        },
        listeners: new Set<Listener>(),
        addEventListener(_type: string, cb: Listener) {
            this.listeners.add(cb);
        },
        removeEventListener(_type: string, cb: Listener) {
            this.listeners.delete(cb);
        }
    };
    mqls.push(mql);
    return mql;
};

/** Set the simulated viewport width. `dispatch: false` sets it silently. */
export function setWidth(width: number, dispatch = true): void {
    currentWidth = width;
    if (dispatch) {
        mqls.forEach((mql) => mql.listeners.forEach((cb) => cb({ matches: mql.matches })));
    }
}

/** Flip the simulated viewport between a wide (desktop) and zero (mobile) width. */
export function setViewport(isMobile: boolean, dispatch = true): void {
    setWidth(isMobile ? 0 : 100000, dispatch);
}

// jsdom has no ResizeObserver; the dynamic responsive mode wires one up. A
// no-op stub keeps construction working (layout is 0 in jsdom, so the dynamic
// path simply stays on the desktop bar unless dimensions are mocked).
if (typeof globalThis.ResizeObserver !== "function") {
    globalThis.ResizeObserver = class {
        observe(): void {}
        unobserve(): void {}
        disconnect(): void {}
    } as unknown as typeof ResizeObserver;
}

/** Yield to queued macrotasks (our rAF polyfill resolves on setTimeout). */
export function tick(): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, 0));
}

afterEach(() => {
    document.body.innerHTML = "";
    document.body.className = "";
    currentWidth = 100000;
    mqls.length = 0;
});
