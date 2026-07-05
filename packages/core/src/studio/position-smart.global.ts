/**
 * Studio chunk: self-registers the "position-smart" feature against the global kernel
 * (window.Navalone). Concatenate after the kernel chunk.
 */
import { positionSmart } from "../features/position-smart";
import type { Navalone } from "../kernel/navalone";

const w = typeof window !== "undefined" ? (window as unknown as { Navalone?: typeof Navalone }) : null;
if (w) {
    if (!w.Navalone || typeof w.Navalone.use !== "function") {
        throw new Error('Navalone: the "position-smart" chunk needs the kernel chunk loaded first.');
    }
    w.Navalone.use(positionSmart);
}

export {};
