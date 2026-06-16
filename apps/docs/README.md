# @navalone/docs

The Navalone documentation site — a static Vite SPA that imports the local
`navalone` core. Getting started, API reference (options / methods / events /
data contract), **live editable examples** of every submenu type, the mobile
drawer, and a **theming playground** that mutates `--nv-*` tokens on a live
instance.

```bash
pnpm --filter @navalone/docs dev      # local dev server (http://localhost:5180)
pnpm --filter @navalone/docs build    # static build → apps/docs/dist
pnpm --filter @navalone/docs preview   # preview the build
```

Output is a fully static bundle (`base: "./"`), so `dist/` deploys to any static
host (GitHub Pages, Netlify, Cloudflare Pages, a subfolder). It is independent of
the other apps/packages — it only depends on the published shape of `navalone`.
