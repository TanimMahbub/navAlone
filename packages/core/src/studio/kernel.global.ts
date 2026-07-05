/**
 * Studio chunk: the bare kernel as a standalone IIFE assigning
 * `window.Navalone`. Feature chunks concatenated AFTER this one self-register
 * against it (`window.Navalone.use(...)`), so
 *   kernel chunk + selected feature chunks = a working navalone.custom.js.
 */
import { Navalone } from "../kernel/navalone";

if (typeof window !== "undefined") {
    (window as unknown as { Navalone: typeof Navalone }).Navalone = Navalone;
}

export {};
