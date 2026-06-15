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
    matches: boolean;
    listeners: Set<Listener>;
    addEventListener: (type: string, cb: Listener) => void;
    removeEventListener: (type: string, cb: Listener) => void;
}

const mqls: MockMql[] = [];
let currentMatches = false;

(window as unknown as { matchMedia: (m: string) => unknown }).matchMedia = (media: string) => {
    const mql: MockMql = {
        media,
        get matches() {
            return currentMatches;
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

/** Flip the simulated viewport. `dispatch: false` sets it without firing change. */
export function setViewport(isMobile: boolean, dispatch = true): void {
    currentMatches = isMobile;
    if (dispatch) {
        mqls.forEach((mql) => mql.listeners.forEach((cb) => cb({ matches: isMobile })));
    }
}

/** Yield to queued macrotasks (our rAF polyfill resolves on setTimeout). */
export function tick(): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, 0));
}

afterEach(() => {
    document.body.innerHTML = "";
    document.body.className = "";
    currentMatches = false;
    mqls.length = 0;
});
