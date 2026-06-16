import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

// `pnpm --filter @navalone/vue example` runs this (root = the example dir).
export default defineConfig({
    base: "./",
    plugins: [vue()],
    server: { port: 5182 }
});
