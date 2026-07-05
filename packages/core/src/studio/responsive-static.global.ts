/**
 * Studio chunk: self-registers the "responsive-static" feature against the global kernel
 * (window.Navalone). Concatenate after the kernel chunk.
 */
import { responsiveStatic } from "../features/responsive-static";
import type { Navalone } from "../kernel/navalone";

const w = typeof window !== "undefined" ? (window as unknown as { Navalone?: typeof Navalone }) : null;
if (w) {
    if (!w.Navalone || typeof w.Navalone.use !== "function") {
        throw new Error('Navalone: the "responsive-static" chunk needs the kernel chunk loaded first.');
    }
    w.Navalone.use(responsiveStatic);
}

export {};
