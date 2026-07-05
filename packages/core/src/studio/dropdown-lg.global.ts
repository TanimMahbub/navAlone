/**
 * Studio chunk: self-registers the "dropdown-lg" feature against the global kernel
 * (window.Navalone). Concatenate after the kernel chunk.
 */
import { dropdownLg } from "../features/dropdown-lg";
import type { Navalone } from "../kernel/navalone";

const w = typeof window !== "undefined" ? (window as unknown as { Navalone?: typeof Navalone }) : null;
if (w) {
    if (!w.Navalone || typeof w.Navalone.use !== "function") {
        throw new Error('Navalone: the "dropdown-lg" chunk needs the kernel chunk loaded first.');
    }
    w.Navalone.use(dropdownLg);
}

export {};
