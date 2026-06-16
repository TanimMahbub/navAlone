# @navalone/site

The Navalone landing page — an awwwards-style marketing site built with **Astro +
GSAP**. It imports the local `navalone` core for a **live, interactive hero menu**
and animates the page with GSAP (intro timeline + scroll reveals, both disabled
under `prefers-reduced-motion`).

Sections: hero with a real Navalone instance, feature highlights with a free vs.
mmenu.js comparison, code snippets (vanilla / React / CDN), and CTAs to the docs,
GitHub and npm.

```bash
pnpm --filter @navalone/site dev      # http://localhost:4321
pnpm --filter @navalone/site build    # static build → apps/site/dist
pnpm --filter @navalone/site preview   # preview the build
```

Astro emits a static site (zero JS except the hero menu + GSAP islands), so
`dist/` deploys independently to any static host (Netlify, Vercel, Cloudflare
Pages, GitHub Pages).
