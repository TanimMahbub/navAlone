import { defineConfig } from "tsup";

// Feature ids in canonical load order (dependencies before dependents; also
// the order the full stylesheet is concatenated in — see scripts/build-dist.mjs).
const FEATURES = [
    "dropdown",
    "dropdown-lg",
    "mega",
    "mega-tabs",
    "flyout",
    "drawer-drilldown",
    "drawer-accordion",
    "responsive-dynamic",
    "responsive-static",
    "position-smart"
];

const featureEntries: Record<string, string> = {};
const studioEntries: Record<string, string> = {
    "navalone.kernel": "src/studio/kernel.global.ts"
};
for (const id of FEATURES) {
    featureEntries["features/" + id] = "src/features/" + id + ".ts";
    studioEntries["navalone." + id] = "src/studio/" + id + ".global.ts";
}

// Four outputs from one TypeScript source:
//   1. ESM (.mjs) + CJS (.cjs) + .d.ts for the batteries-included entry
//      (`navalone`), the bare kernel (`navalone/kernel`) and each feature
//      (`navalone/features/*`) — for bundler / Node consumers. ESM splitting
//      keeps a single shared kernel chunk so `navalone` and `navalone/kernel`
//      resolve to the same class (one registry).
//   2. A minified IIFE (navalone.global.js) that assigns `window.Navalone`
//      with EVERY feature preregistered — for build-free <script> / CDN
//      (unpkg, jsDelivr) consumers. Behaviour identical to the original
//      monolith.
//   3. Per-feature minified IIFE chunks under dist/studio/ — the kernel chunk
//      assigns `window.Navalone`, each feature chunk self-registers against
//      it. Concatenating kernel + selected features yields a standalone
//      navalone.custom.js (what the Studio page composes).
//   4. The stylesheet: scripts/build-dist.mjs concatenates src/styles/*.css
//      into dist/navalone.css (full build) and copies each chunk to
//      dist/studio/, plus generates dist/studio/manifest.json.
export default defineConfig([
    {
        entry: {
            index: "src/index.ts",
            kernel: "src/kernel.ts",
            ...featureEntries
        },
        format: ["esm", "cjs"],
        dts: true,
        sourcemap: true,
        clean: true,
        treeshake: true,
        splitting: true,
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
    },
    {
        entry: studioEntries,
        outDir: "dist/studio",
        format: ["iife"],
        minify: true,
        sourcemap: false,
        clean: false,
        outExtension() {
            return { js: ".js" };
        }
    }
]);
