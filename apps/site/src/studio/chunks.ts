/**
 * Chunk store + bundle composer for the Studio.
 *
 * The core build emits per-feature IIFE/CSS chunks and a manifest under
 * packages/core/dist/studio/. They are inlined here at BUILD time via a raw
 * glob import — one source of truth: rebuild core and the Studio serves the
 * new bytes; add a feature to core and it appears in the manifest (and thus
 * in the Studio UI) automatically.
 *
 * Composing is plain concatenation: kernel chunk first, then the selected
 * feature chunks in manifest order with dependencies auto-included. The
 * result is a standalone navalone.custom.js / navalone.custom.css — the exact
 * bytes the preview runs and the ZIP ships.
 */

export interface ManifestFeature {
    id: string;
    label: string;
    description: string;
    group: "submenu" | "drawer" | "responsive" | "position" | "other";
    deps: string[];
    js: string;
    css: string | null;
    bytes: { js: number; css: number };
}

export interface StudioManifest {
    kernel: { js: string; css: string; bytes: { js: number; css: number } };
    full: { js: string; css: string; bytes: { js: number; css: number } };
    features: ManifestFeature[];
}

// Everything in the core's studio dist, inlined as raw text at build time.
const files = import.meta.glob("../../../../packages/core/dist/studio/*", {
    query: "?raw",
    import: "default",
    eager: true
}) as Record<string, string>;

function file(name: string): string {
    for (const path in files) {
        if (path.endsWith("/" + name)) {
            return files[path];
        }
    }
    throw new Error("Studio: chunk file missing from build: " + name);
}

export const manifest: StudioManifest = JSON.parse(file("manifest.json"));

const byId = new Map(manifest.features.map((f) => [f.id, f]));

export function featureById(id: string): ManifestFeature {
    const f = byId.get(id);
    if (!f) {
        throw new Error("Studio: unknown feature id " + id);
    }
    return f;
}

/**
 * Expand a selection to include dependencies, ordered canonically (manifest
 * order — dependencies come before dependents there).
 */
export function resolveSelection(selected: Iterable<string>): ManifestFeature[] {
    const wanted = new Set<string>();
    const add = (id: string) => {
        if (wanted.has(id)) {
            return;
        }
        featureById(id).deps.forEach(add);
        wanted.add(id);
    };
    for (const id of selected) {
        add(id);
    }
    return manifest.features.filter((f) => wanted.has(f.id));
}

export interface ComposedBundle {
    js: string;
    css: string;
    features: ManifestFeature[];
    bytes: { js: number; css: number };
}

/** Concatenate kernel + selected chunks into a standalone custom bundle. */
export function compose(selected: Iterable<string>): ComposedBundle {
    const features = resolveSelection(selected);
    const js = [file(manifest.kernel.js)]
        .concat(features.map((f) => file(f.js)))
        .join("\n;\n");
    const css = [file(manifest.kernel.css)]
        .concat(features.filter((f) => f.css).map((f) => file(f.css as string)))
        .join("\n");
    const bytes = features.reduce(
        (acc, f) => ({ js: acc.js + f.bytes.js, css: acc.css + f.bytes.css }),
        { js: manifest.kernel.bytes.js, css: manifest.kernel.bytes.css }
    );
    return { js, css, features, bytes };
}

export function formatKb(bytes: number): string {
    return (bytes / 1024).toFixed(1) + " KB";
}
