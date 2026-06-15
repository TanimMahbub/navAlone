---
name: verify-in-browser-headless-chrome
description: How to verify DOM/JS behavior in this repo with no test framework or npm deps — drive headless Chrome
metadata:
  type: reference
---

**Update (Phase 3, 2026-06-16):** the repo now HAS a test runner — Vitest (jsdom) in
`packages/core/test` covers most behavior, and the headless-Chrome recipe below is codified
in `packages/core/test/e2e/run-browser.mjs` (run via `pnpm --filter navalone test:e2e`) for
the layout-dependent checks jsdom can't do (edge-aware clamp, the visibility-gotcha focus,
real `matchMedia`) and for screenshots. The manual recipe below is still handy for one-off
checks. Note: Chrome's default headless window is ~800px wide — **below** the 960px
breakpoint — so pass `--window-size=1280,720` when you need desktop mode.

This recipe predates the test runner: when there was no jsdom, the only way to verify DOM +
plugin behavior was to drive the installed Chrome headless.

Chrome is at: `/c/Program Files/Google/Chrome/Application/chrome.exe` (Git Bash path).

**Recipe (used to verify the Phase 1 `Navalone` refactor):**
1. Write a throwaway `__test.html` that loads `app.css`/`app.js`, exercises the API
   (instantiate, `navigateTo`, `back`, dispatch a `KeyboardEvent` for Escape, `close/open`,
   `destroy`), runs synchronous assertions, and writes results into a `<pre id="out">`.
   Assertions run synchronously, so they capture state before any queued rAF fires.
2. Dump rendered DOM:
   `"/c/Program Files/Google/Chrome/Application/chrome.exe" --headless=new --disable-gpu \
    --no-sandbox --virtual-time-budget=4000 --dump-dom "file:///f:/.../__test.html" > __dump.html`
3. Extract the `<pre>` with a tiny node script (un-escape `&lt;`/`&gt;`/`&amp;`/`&quot;`).
4. For visual checks use `--screenshot="f:/abs/path.png"` (relative paths fail; use absolute);
   then Read the PNG.
5. Delete `__test.html`/`__dump.html`/`__shot.png` afterwards — they are not part of the repo.

**Gotcha found:** in this Chrome, after any `element.style.setProperty(...)`, calling
`removeAttribute("style")` leaves `getAttribute("style") === ""` (empty), not `null`. So a
`destroy()` that reverts inline styles should treat `""`/`null` the same; don't assert `null`.
Related: [[navalone-project]].
