import { defineConfig } from "vite";

// Static SPA. `base: "./"` keeps asset URLs relative so the built site can be
// dropped onto any static host (GitHub Pages, Netlify, a subfolder, …).
export default defineConfig({
    base: "./",
    server: { port: 5180 },
    build: { outDir: "dist" }
});
