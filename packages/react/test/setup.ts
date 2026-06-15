/**
 * jsdom shims — the core relies on requestAnimationFrame and matchMedia, neither
 * of which jsdom implements. Mirrors packages/core/test/setup.ts. setViewport()
 * lets a test flip between desktop and mobile mode.
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

afterEach(() => {
    document.body.innerHTML = "";
    document.body.className = "";
    currentMatches = false;
    mqls.length = 0;
});
