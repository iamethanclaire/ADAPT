// Persistent state shared by every A.D.A.P.T. content script.
(function initializeADAPTStorage() {
    "use strict";

    const GLOBAL_KEY = "adaptGlobalSettingsV1";
    const PAGE_KEY_PREFIX = "adaptPageStateV1:";
    const PAGE_WRITE_DELAY = 250;

    const defaultGlobalState = Object.freeze({
        isActive: true,
        toolbarHidden: false,
        font: "page-default",
        size: 100,
        leading: 100,
        spacing: 100,
        removeBold: false,
        removeItalics: false,
        removeUnderline: false,
        highlightEnabled: false,
        lineGuideEnabled: false,
        lineGuideYRatio: 0.5,
        noteEnabled: false
    });

    const defaultPageState = Object.freeze({
        highlights: [],
        notes: []
    });

    let globalState = { ...defaultGlobalState };
    let pageState = clonePageState(defaultPageState);
    let pageStorageKey = createPageStorageKey();
    let pageWriteTimer = null;
    let pageStateLoaded = false;
    const globalListeners = new Set();

    function clampNumber(value, minimum, maximum, fallback) {
        const number = Number(value);

        if (!Number.isFinite(number)) {
            return fallback;
        }

        return Math.min(Math.max(number, minimum), maximum);
    }

    function normalizeGlobalState(candidate = {}) {
        const availableFonts = Array.isArray(globalThis.ADAPT?.fonts)
            ? globalThis.ADAPT.fonts.map((font) => font.value)
            : ["page-default"];

        const normalized = {
            isActive:
                typeof candidate.isActive === "boolean"
                    ? candidate.isActive
                    : defaultGlobalState.isActive,
            toolbarHidden:
                typeof candidate.toolbarHidden === "boolean"
                    ? candidate.toolbarHidden
                    : defaultGlobalState.toolbarHidden,
            font: availableFonts.includes(candidate.font)
                ? candidate.font
                : defaultGlobalState.font,
            size: clampNumber(candidate.size, 80, 150, 100),
            leading: clampNumber(candidate.leading, 80, 200, 100),
            spacing: clampNumber(candidate.spacing, 50, 200, 100),
            removeBold: Boolean(candidate.removeBold),
            removeItalics: Boolean(candidate.removeItalics),
            removeUnderline: Boolean(candidate.removeUnderline),
            highlightEnabled: Boolean(candidate.highlightEnabled),
            lineGuideEnabled: Boolean(candidate.lineGuideEnabled),
            lineGuideYRatio: clampNumber(
                candidate.lineGuideYRatio,
                0,
                1,
                0.5
            ),
            noteEnabled: Boolean(candidate.noteEnabled)
        };

        // Highlight selection and note placement cannot both capture page input.
        if (normalized.highlightEnabled && normalized.noteEnabled) {
            normalized.noteEnabled = false;
        }

        return normalized;
    }

    function clonePageState(candidate = {}) {
        return {
            highlights: Array.isArray(candidate.highlights)
                ? candidate.highlights.map((item) => ({ ...item }))
                : [],
            notes: Array.isArray(candidate.notes)
                ? candidate.notes.map((item) => ({ ...item }))
                : []
        };
    }

    function createPageStorageKey() {
        const url = new URL(window.location.href);
        url.hash = "";
        return `${PAGE_KEY_PREFIX}${url.href}`;
    }

    async function loadGlobal() {
        const result = await chrome.storage.sync.get(GLOBAL_KEY);
        globalState = normalizeGlobalState(result[GLOBAL_KEY]);
        return { ...globalState };
    }

    async function updateGlobal(patch) {
        globalState = normalizeGlobalState({
            ...globalState,
            ...patch
        });

        await chrome.storage.sync.set({
            [GLOBAL_KEY]: globalState
        });

        return { ...globalState };
    }

    function getGlobal() {
        return { ...globalState };
    }

    async function loadPage() {
        pageStorageKey = createPageStorageKey();
        const result = await chrome.storage.local.get(pageStorageKey);
        pageState = clonePageState(result[pageStorageKey]);
        pageStateLoaded = true;
        return clonePageState(pageState);
    }

    async function writePageState() {
        if (pageWriteTimer !== null) {
            window.clearTimeout(pageWriteTimer);
            pageWriteTimer = null;
        }

        await chrome.storage.local.set({
            [pageStorageKey]: pageState
        });
    }

    async function updatePage(patch, options = {}) {
        pageState = clonePageState({
            ...pageState,
            ...patch
        });

        if (options.debounce) {
            if (pageWriteTimer !== null) {
                window.clearTimeout(pageWriteTimer);
            }

            pageWriteTimer = window.setTimeout(() => {
                writePageState().catch((error) => {
                    console.error(
                        "[ADAPT] Could not save page state:",
                        error
                    );
                });
            }, PAGE_WRITE_DELAY);

            return clonePageState(pageState);
        }

        await writePageState();
        return clonePageState(pageState);
    }

    function getPage() {
        return clonePageState(pageState);
    }

    async function changePageContext() {
        await writePageState();
        return loadPage();
    }

    function subscribeGlobal(listener) {
        globalListeners.add(listener);
        return () => globalListeners.delete(listener);
    }

    chrome.storage.onChanged.addListener((changes, areaName) => {
        if (areaName !== "sync" || !changes[GLOBAL_KEY]) {
            return;
        }

        globalState = normalizeGlobalState(
            changes[GLOBAL_KEY].newValue
        );

        globalListeners.forEach((listener) => {
            listener({ ...globalState });
        });
    });

    window.addEventListener("pagehide", () => {
        if (!pageStateLoaded) {
            return;
        }

        writePageState().catch(() => {
            // The page may already be unloading.
        });
    });

    globalThis.ADAPTStorage = Object.freeze({
        loadGlobal,
        updateGlobal,
        getGlobal,
        loadPage,
        updatePage,
        getPage,
        changePageContext,
        subscribeGlobal,
        flushPage: writePageState
    });
})();
