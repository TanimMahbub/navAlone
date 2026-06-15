import { defineConfig } from "tsup";

// ESM (.mjs) + CJS (.cjs) + .d.ts. vue and navalone are peerDependencies and
// tree-shakeable externals — never bundled into the wrapper.
export default defineConfig({
    entry: { index: "src/index.ts" },
    format: ["esm", "cjs"],
    dts: true,
    sourcemap: true,
    clean: true,
    treeshake: true,
    external: ["vue", "navalone"],
    outExtension({ format }) {
        return { js: format === "esm" ? ".mjs" : ".cjs" };
    }
});
