import { defineConfig } from "tsup";

// ESM (.mjs) + CJS (.cjs) + .d.ts. react / react-dom / navalone are
// peerDependencies and tree-shakeable externals — never bundled into the
// wrapper — so consumers dedupe a single copy of each.
export default defineConfig({
    entry: { index: "src/index.tsx" },
    format: ["esm", "cjs"],
    dts: true,
    sourcemap: true,
    clean: true,
    treeshake: true,
    external: ["react", "react-dom", "navalone"],
    outExtension({ format }) {
        return { js: format === "esm" ? ".mjs" : ".cjs" };
    }
});
