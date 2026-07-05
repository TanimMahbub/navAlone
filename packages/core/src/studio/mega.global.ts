/**
 * Studio chunk: self-registers the "mega" feature against the global kernel
 * (window.Navalone). Concatenate after the kernel chunk.
 */
import { mega } from "../features/mega";
import type { Navalone } from "../kernel/navalone";

const w = typeof window !== "undefined" ? (window as unknown as { Navalone?: typeof Navalone }) : null;
if (w) {
    if (!w.Navalone || typeof w.Navalone.use !== "function") {
        throw new Error('Navalone: the "mega" chunk needs the kernel chunk loaded first.');
    }
    w.Navalone.use(mega);
}

export {};
