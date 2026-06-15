import { defineConfig } from "tsup";

// Two outputs from one TypeScript source:
//   1. ESM (.mjs) + CJS (.cjs) + .d.ts  — for bundler / Node consumers.
//   2. A minified IIFE (navalone.global.js) that assigns `window.Navalone`
//      — for build-free <script> / CDN (unpkg, jsDelivr) consumers.
// The CSS is shipped verbatim (copied to dist/ by scripts/copy-css.mjs); it is
// never forced through the bundler so vanilla users can link it directly.
export default defineConfig([
    {
        entry: { index: "src/index.ts" },
        format: ["esm", "cjs"],
        dts: true,
        sourcemap: true,
        clean: true,
        treeshake: true,
        outExtension({ format }) {
            return { js: format === "esm" ? ".mjs" : ".cjs" };
        }
    },
    {
        entry: { "navalone.global": "src/global.ts" },
        format: ["iife"],
        minify: true,
        sourcemap: true,
        clean: false,
        outExtension() {
            return { js: ".js" };
        }
    }
]);
