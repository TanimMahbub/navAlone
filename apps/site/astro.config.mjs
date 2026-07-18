import { defineConfig } from "astro/config";

// Static marketing site (Astro ships zero JS by default; the hero menu and the
// GSAP intro are the only client scripts, bundled by Astro/Vite). `base: "./"`
// is avoided so Astro can manage absolute asset paths; deploy `dist/` to any
// static host (Netlify, Vercel static, Cloudflare Pages, GitHub Pages).
export default defineConfig({
    site: "https://navalone.tanimmahbub.com",
    output: "static"
});
