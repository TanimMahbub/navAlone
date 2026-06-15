import { defineConfig } from "vite";
import angular from "@analogjs/vite-plugin-angular";

// `pnpm --filter @navalone/angular example` runs this (root = the example dir).
// @analogjs/vite-plugin-angular compiles Angular standalone components in Vite,
// matching the React/Vue example setups (no full Angular CLI needed).
export default defineConfig({
    root: import.meta.dirname,
    plugins: [angular()],
    server: { port: 5183 }
});
