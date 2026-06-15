// Ship the stylesheet verbatim alongside the built JS so vanilla consumers can
// link `dist/navalone.css` (or import "navalone/css") with no bundler. Copying
// keeps the `--nv-*` token contract and class names byte-for-byte identical.
import { copyFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const src = resolve(here, "../src/navalone.css");
const dest = resolve(here, "../dist/navalone.css");

mkdirSync(dirname(dest), { recursive: true });
copyFileSync(src, dest);
console.log("copy-css: src/navalone.css -> dist/navalone.css");
