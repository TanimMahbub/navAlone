/**
 * The kernel API object handed to every feature's `install()`. Features never
 * import kernel functions directly — everything flows through this surface —
 * so a feature compiles to a standalone chunk that can register against the
 * global kernel at runtime (`window.Navalone.use(feature)`) as well as being
 * imported as an ESM subpath module.
 */
import { registry, type NavaloneKernelApi } from "./registry";
import { durationMs, escapeId, toCssLength, uid } from "./dom";
import { chevronSvg, fillRow } from "./render";
import {
    buildDesktopPanel,
    buildDesktopRow,
    buildRowList,
    closeDesktop,
    closeDesktopAll,
    openDesktop
} from "./desktop";
import {
    activePanel,
    panelById,
    setActive,
    setHiddenState,
    updateHeight
} from "./drawer";
import { desktopRows, focusFirstDesktop, focusPanel, labelOf, rove } from "./a11y";

export const api: NavaloneKernelApi = {
    registry,
    provided(featureId: string) {
        return registry.provided[featureId] || {};
    },
    uid,
    escapeId,
    toCssLength,
    durationMs,
    chevronSvg,
    fillRow,
    buildDesktopPanel,
    buildRowList,
    buildDesktopRow,
    openDesktop,
    closeDesktop,
    closeDesktopAll,
    desktopRows,
    focusFirstDesktop,
    rove,
    focusPanel,
    labelOf,
    setActive,
    setHiddenState,
    updateHeight,
    activePanel,
    panelById
};
