import { defineConfig } from "vite";
import angular from "@analogjs/vite-plugin-angular";

// `pnpm --filter @navalone/angular example` runs this (root = the example dir).
// @analogjs/vite-plugin-angular compiles Angular standalone components in Vite,
// matching the React/Vue example setups (no full Angular CLI needed).
export default defineConfig({
    base: "./",
    root: import.meta.dirname,
    plugins: [angular({ tsconfig: "tsconfig.app.json" })],
    server: { port: 5183, host: "127.0.0.1" }
});
