/**
 * Post-tsup dist assembly:
 *   1. dist/navalone.css        — the FULL stylesheet, concatenated from the
 *                                 per-feature chunks in src/styles/ in cascade
 *                                 order (kernel first). Class names and tokens
 *                                 stay byte-for-byte identical to the chunks.
 *   2. dist/studio/navalone.<id>.css — each chunk copied verbatim so the
 *                                 Studio page can compose custom stylesheets.
 *   3. dist/studio/manifest.json — feature metadata (id, label, description,
 *                                 deps, file names, sizes) read from the BUILT
 *                                 feature modules, so a feature added to core
 *                                 automatically surfaces in Studio.
 */
import { mkdirSync, readFileSync, statSync, writeFileSync, copyFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const stylesDir = resolve(root, "src/styles");
const dist = resolve(root, "dist");
const studio = resolve(dist, "studio");

/** Feature ids in canonical load/cascade order (deps before dependents). */
const FEATURES = [
    "dropdown",
    "dropdown-lg",
    "mega",
    "mega-tabs",
    "flyout",
    "drawer-drilldown",
    "drawer-accordion",
    "responsive-dynamic",
    "responsive-static",
    "position-smart"
];

/** Chunk ids that ship CSS (kernel + all features that have a stylesheet). */
const cssOf = (id) => {
    const file = resolve(stylesDir, id + ".css");
    return existsSync(file) ? file : null;
};

mkdirSync(studio, { recursive: true });

/* 1. Full stylesheet ------------------------------------------------------ */
const cssOrder = ["kernel", ...FEATURES];
const full = cssOrder
    .map((id) => {
        const file = cssOf(id);
        return file ? readFileSync(file, "utf8") : "";
    })
    .filter(Boolean)
    .join("\n");
writeFileSync(resolve(dist, "navalone.css"), full);

/* 2. Per-chunk stylesheets ------------------------------------------------ */
for (const id of cssOrder) {
    const file = cssOf(id);
    if (file) {
        copyFileSync(file, resolve(studio, "navalone." + id + ".css"));
    }
}

/* 3. Manifest -------------------------------------------------------------- */
const size = (path) => (existsSync(path) ? statSync(path).size : 0);

const camel = (id) => id.replace(/-([a-z])/g, (_, c) => c.toUpperCase());

const features = [];
for (const id of FEATURES) {
    const mod = await import(pathToFileURL(resolve(dist, "features/" + id + ".mjs")).href);
    const feature = mod[camel(id)];
    if (!feature || feature.id !== id) {
        throw new Error("build-dist: dist/features/" + id + ".mjs did not export " + camel(id));
    }
    const js = "navalone." + id + ".js";
    const css = cssOf(id) ? "navalone." + id + ".css" : null;
    features.push({
        id,
        label: feature.label || id,
        description: feature.description || "",
        group: feature.group || "other",
        deps: feature.deps || [],
        js,
        css,
        bytes: {
            js: size(resolve(studio, js)),
            css: css ? size(resolve(studio, css)) : 0
        }
    });
}

const manifest = {
    generated: new Date().toISOString(),
    kernel: {
        js: "navalone.kernel.js",
        css: "navalone.kernel.css",
        bytes: {
            js: size(resolve(studio, "navalone.kernel.js")),
            css: size(resolve(studio, "navalone.kernel.css"))
        }
    },
    full: {
        js: "navalone.global.js",
        css: "navalone.css",
        bytes: {
            js: size(resolve(dist, "navalone.global.js")),
            css: size(resolve(dist, "navalone.css"))
        }
    },
    features
};

writeFileSync(resolve(studio, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
console.log(
    "build-dist: navalone.css (" +
        full.length +
        " bytes), " +
        features.length +
        " feature chunks, manifest.json"
);
