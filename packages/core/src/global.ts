/**
 * IIFE entry for build-free <script> / CDN usage. Assigns the class to
 * `window.Navalone` so the no-build workflow keeps working against the built
 * file (mirrors the original plain-JS global). Imports the batteries-included
 * entry, so every feature is preregistered — exactly the original behaviour.
 */
import { Navalone } from "./index";

if (typeof window !== "undefined") {
    (window as unknown as { Navalone: typeof Navalone }).Navalone = Navalone;
}

export {};
