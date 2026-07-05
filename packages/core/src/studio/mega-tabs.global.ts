/**
 * Studio chunk: self-registers the "mega-tabs" feature against the global kernel
 * (window.Navalone). Concatenate after the kernel chunk.
 */
import { megaTabs } from "../features/mega-tabs";
import type { Navalone } from "../kernel/navalone";

const w = typeof window !== "undefined" ? (window as unknown as { Navalone?: typeof Navalone }) : null;
if (w) {
    if (!w.Navalone || typeof w.Navalone.use !== "function") {
        throw new Error('Navalone: the "mega-tabs" chunk needs the kernel chunk loaded first.');
    }
    w.Navalone.use(megaTabs);
}

export {};
