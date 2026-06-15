/**
 * Vitest + Angular TestBed bootstrap (via @analogjs/vitest-angular) plus the
 * jsdom shims the core relies on (requestAnimationFrame + matchMedia).
 */
import "@analogjs/vitest-angular/setup-zone";

import { getTestBed } from "@angular/core/testing";
import {
    BrowserDynamicTestingModule,
    platformBrowserDynamicTesting
} from "@angular/platform-browser-dynamic/testing";

getTestBed().initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting());

if (typeof globalThis.requestAnimationFrame !== "function") {
    globalThis.requestAnimationFrame = ((cb: FrameRequestCallback) =>
        setTimeout(() => cb(Date.now()), 0) as unknown as number) as typeof requestAnimationFrame;
    globalThis.cancelAnimationFrame = ((id: number) =>
        clearTimeout(id)) as typeof cancelAnimationFrame;
}

if (typeof window.matchMedia !== "function") {
    (window as unknown as { matchMedia: (m: string) => unknown }).matchMedia = (media: string) => ({
        media,
        matches: false,
        addEventListener() {},
        removeEventListener() {},
        addListener() {},
        removeListener() {},
        dispatchEvent() {
            return false;
        }
    });
}
