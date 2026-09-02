// Persistent state shared by every A.D.A.P.T. content script.
(function initializeADAPTStorage() {
    "use strict";

    const GLOBAL_KEY = "adaptGlobalSettingsV1";
    const PAGE_KEY_PREFIX = "adaptPageStateV1:";
    const PAGE_WRITE_DELAY = 250;
    const PAGE_CONTEXT_CHECK_DELAY = 750;

    const TRACKING_PARAMETERS = new Set([
        "fbclid",
        "gclid",
        "dclid",
        "msclkid",
        "mc_cid",
        "mc_eid",
        "smid",
        "smtyp"
    ]);

    const defaultGlobalState = Object.freeze({
        isActive: true,
        toolbarHidden: false,
        premiumUnlocked: false,
        font: "page-default",
        size: 100,
        sizeStep: 5,
        maxSize: 150,
        minSize: 80,
        leading: 100,
        leadingStep: 10,
        maxLeading: 200,
        minLeading: 80,
        spacing: 100,
        spacingStep: 25,
        maxSpacing: 200,
        minSpacing: 50,
        boldSizeIncrease: 10,
        removeBold: false,
        removeItalics: false,
        justifyEnabled: false,
        underlineEnabled: false,
        underlineColor:
            globalThis.ADAPT.colors.focusBlue,
        underlineThickness: 2,
        highlightEnabled: false,
        highlighterColor:
            globalThis.ADAPT.colors.yellowDefault,
        lineGuideEnabled: false,
        lineGuideYRatio: 0.5,
        lineGuideBlurEnabled: true,
        lineGuideThickness: 2,
        lineGuideColor:
            globalThis.ADAPT.lineColor,
        noteEnabled: false,
        noteColor: "yellow",
        speechVoiceURI: "default",
        toolbarColor: "system",
        stickerEnabled: false,
        stickerSize: 50,
        selectedStickerPack: "text-annotation",
        selectedStickerId: "question"
    });

    const defaultPageState = Object.freeze({
        highlights: [],
        underlines: [],
        notes: [],
        stickers: []
    });

    let globalState = { ...defaultGlobalState };
    let pageState = clonePageState(defaultPageState);
    let pageStorageKey = createPageStorageKey();
    let pageWriteTimer = null;
    let pageStateLoaded = false;
    let pageWriteChain = Promise.resolve();
    let pageContextChain = Promise.resolve();

    const globalListeners = new Set();
    const pageListeners = new Set();

    function clampNumber(value, minimum, maximum, fallback) {
        const number = Number(value);

        if (!Number.isFinite(number)) {
            return fallback;
        }

        return Math.min(Math.max(number, minimum), maximum);
    }

    function normalizeGlobalState(candidate = {}) {
        const adaptTheme = globalThis.ADAPT;
        const premiumUnlocked =
            Boolean(candidate.premiumUnlocked);

        const sizeStep = clampNumber(
            candidate.sizeStep,
            1,
            50,
            defaultGlobalState.sizeStep
        );
        const maxSize = clampNumber(
            candidate.maxSize,
            100,
            200,
            defaultGlobalState.maxSize
        );
        const minSize = clampNumber(
            candidate.minSize,
            50,
            100,
            defaultGlobalState.minSize
        );

        const leadingStep = clampNumber(
            candidate.leadingStep,
            1,
            50,
            defaultGlobalState.leadingStep
        );
        const maxLeading = clampNumber(
            candidate.maxLeading,
            100,
            300,
            defaultGlobalState.maxLeading
        );
        const minLeading = clampNumber(
            candidate.minLeading,
            50,
            100,
            defaultGlobalState.minLeading
        );

        const spacingStep = clampNumber(
            candidate.spacingStep,
            1,
            50,
            defaultGlobalState.spacingStep
        );
        const maxSpacing = clampNumber(
            candidate.maxSpacing,
            100,
            300,
            defaultGlobalState.maxSpacing
        );
        const minSpacing = clampNumber(
            candidate.minSpacing,
            25,
            100,
            defaultGlobalState.minSpacing
        );
        const boldSizeIncrease = clampNumber(
            candidate.boldSizeIncrease,
            1,
            50,
            defaultGlobalState.boldSizeIncrease
        );

        const requestedFont =
            typeof adaptTheme?.getFont === "function"
                ? adaptTheme.getFont(candidate.font)
                : null;
        const safeFont =
            requestedFont &&
            (!requestedFont.premium || premiumUnlocked)
                ? requestedFont.value
                : defaultGlobalState.font;

        const requestedHighlighterColor =
            typeof adaptTheme?.getHighlighterColor ===
            "function"
                ? adaptTheme.getHighlighterColor(
                      candidate.highlighterColor
                  )
                : null;
        const safeHighlighterColor =
            requestedHighlighterColor &&
            (!requestedHighlighterColor.premium ||
                premiumUnlocked)
                ? requestedHighlighterColor.value
                : defaultGlobalState.highlighterColor;

        const underlineColors = [
            {
                value: adaptTheme?.colors?.focusBlue,
                premium: false
            },
            {
                value: adaptTheme?.colors?.yellowDefault,
                premium: true
            },
            ...(adaptTheme?.highlighterColors?.slice(1) || [])
        ];
        const requestedUnderlineColor =
            underlineColors.find(
                (color) =>
                    color.value?.toLowerCase() ===
                    String(
                        candidate.underlineColor || ""
                    ).toLowerCase()
            ) || null;
        const safeUnderlineColor =
            requestedUnderlineColor &&
            (!requestedUnderlineColor.premium ||
                premiumUnlocked)
                ? requestedUnderlineColor.value
                : defaultGlobalState.underlineColor;

        const requestedNoteColor =
            typeof adaptTheme?.getNoteColor === "function"
                ? adaptTheme.getNoteColor(candidate.noteColor)
                : null;
        const safeNoteColor =
            requestedNoteColor &&
            (!requestedNoteColor.premium ||
                premiumUnlocked)
                ? requestedNoteColor.id
                : defaultGlobalState.noteColor;

        const toolbarThemes =
            adaptTheme?.toolbarThemes || {};
        const safeToolbarColor =
            premiumUnlocked &&
            Object.prototype.hasOwnProperty.call(
                toolbarThemes,
                candidate.toolbarColor
            )
                ? candidate.toolbarColor
                : defaultGlobalState.toolbarColor;

        const requestedStickerPack =
            typeof adaptTheme?.getStickerPack === "function"
                ? adaptTheme.getStickerPack(
                      candidate.selectedStickerPack
                  )
                : null;
        const safeStickerPack =
            requestedStickerPack?.id ||
            defaultGlobalState.selectedStickerPack;
        const requestedSticker =
            typeof adaptTheme?.getSticker === "function"
                ? adaptTheme.getSticker(
                      safeStickerPack,
                      candidate.selectedStickerId
                  )
                : null;
        const safeStickerId =
            requestedSticker?.id ||
            defaultGlobalState.selectedStickerId;

        const requestedLineGuideColor =
            typeof candidate.lineGuideColor === "string" &&
            /^#[0-9a-f]{6}$/i.test(candidate.lineGuideColor)
                ? candidate.lineGuideColor
                : defaultGlobalState.lineGuideColor;

        const normalized = {
            isActive:
                typeof candidate.isActive === "boolean"
                    ? candidate.isActive
                    : defaultGlobalState.isActive,
            toolbarHidden:
                typeof candidate.toolbarHidden === "boolean"
                    ? candidate.toolbarHidden
                    : defaultGlobalState.toolbarHidden,
            premiumUnlocked,
            font: safeFont,
            size: clampNumber(
                candidate.size,
                minSize,
                maxSize,
                defaultGlobalState.size
            ),
            sizeStep,
            maxSize,
            minSize,
            leading: clampNumber(
                candidate.leading,
                minLeading,
                maxLeading,
                defaultGlobalState.leading
            ),
            leadingStep,
            maxLeading,
            minLeading,
            spacing: clampNumber(
                candidate.spacing,
                minSpacing,
                maxSpacing,
                defaultGlobalState.spacing
            ),
            spacingStep,
            maxSpacing,
            minSpacing,
            boldSizeIncrease,
            removeBold: Boolean(candidate.removeBold),
            removeItalics: Boolean(candidate.removeItalics),
            justifyEnabled: Boolean(
                candidate.justifyEnabled
            ),
            underlineEnabled: Boolean(
                candidate.underlineEnabled
            ),
            underlineColor: safeUnderlineColor,
            underlineThickness: clampNumber(
                candidate.underlineThickness,
                1,
                10,
                defaultGlobalState.underlineThickness
            ),
            highlightEnabled: Boolean(candidate.highlightEnabled),
            highlighterColor: safeHighlighterColor,
            lineGuideEnabled: Boolean(candidate.lineGuideEnabled),
            lineGuideYRatio: clampNumber(
                candidate.lineGuideYRatio,
                0,
                1,
                0.5
            ),
            lineGuideBlurEnabled:
                typeof candidate.lineGuideBlurEnabled ===
                "boolean"
                    ? candidate.lineGuideBlurEnabled
                    : defaultGlobalState.lineGuideBlurEnabled,
            lineGuideThickness: clampNumber(
                candidate.lineGuideThickness,
                1,
                5,
                defaultGlobalState.lineGuideThickness
            ),
            lineGuideColor: premiumUnlocked
                ? requestedLineGuideColor
                : defaultGlobalState.lineGuideColor,
            noteEnabled: Boolean(candidate.noteEnabled),
            noteColor: safeNoteColor,
            speechVoiceURI:
                premiumUnlocked &&
                typeof candidate.speechVoiceURI === "string"
                    ? candidate.speechVoiceURI
                    : defaultGlobalState.speechVoiceURI,
            toolbarColor: safeToolbarColor,
            stickerEnabled:
                premiumUnlocked &&
                Boolean(candidate.stickerEnabled),
            stickerSize: clampNumber(
                candidate.stickerSize,
                10,
                100,
                defaultGlobalState.stickerSize
            ),
            selectedStickerPack: safeStickerPack,
            selectedStickerId: safeStickerId
        };

        if (normalized.highlightEnabled && normalized.noteEnabled) {
            normalized.noteEnabled = false;
        }

        if (
            normalized.highlightEnabled &&
            normalized.underlineEnabled
        ) {
            normalized.underlineEnabled = false;
        }

        if (normalized.underlineEnabled) {
            normalized.noteEnabled = false;
            normalized.stickerEnabled = false;
        }

        if (
            normalized.stickerEnabled &&
            (normalized.highlightEnabled ||
                normalized.noteEnabled)
        ) {
            normalized.stickerEnabled = false;
        }

        return normalized;
    }

    function clonePageState(candidate = {}) {
        return {
            highlights: Array.isArray(candidate.highlights)
                ? candidate.highlights
                      .filter(
                          (item) =>
                              item &&
                              typeof item === "object" &&
                              !Array.isArray(item)
                      )
                      .map((item) => ({ ...item }))
                : [],
            underlines: Array.isArray(candidate.underlines)
                ? candidate.underlines
                      .filter(
                          (item) =>
                              item &&
                              typeof item === "object" &&
                              !Array.isArray(item)
                      )
                      .map((item) => ({ ...item }))
                : [],
            notes: Array.isArray(candidate.notes)
                ? candidate.notes
                      .filter(
                          (item) =>
                              item &&
                              typeof item === "object" &&
                              !Array.isArray(item)
                      )
                      .map((item) => ({ ...item }))
                : [],
            stickers: Array.isArray(candidate.stickers)
                ? candidate.stickers
                      .filter(
                          (item) =>
                              item &&
                              typeof item === "object" &&
                              !Array.isArray(item)
                      )
                      .map((item) => ({ ...item }))
                : []
        };
    }

    function shouldRemoveQueryParameter(name) {
        const lowerName = String(name).toLowerCase();
        return (
            lowerName.startsWith("utm_") ||
            TRACKING_PARAMETERS.has(lowerName)
        );
    }

    function normalizePageUrl(href) {
        const url = new URL(href, window.location.href);

        url.hash = "";
        url.username = "";
        url.password = "";

        Array.from(url.searchParams.keys()).forEach((name) => {
            if (shouldRemoveQueryParameter(name)) {
                url.searchParams.delete(name);
            }
        });

        url.searchParams.sort();
        return url.href;
    }

    function getCanonicalPageUrl() {
        const canonicalLink = document.querySelector(
            'link[rel~="canonical"][href]'
        );
        const locationUrl = normalizePageUrl(
            window.location.href
        );

        if (!canonicalLink?.href) {
            return locationUrl;
        }

        const canonicalUrl = normalizePageUrl(
            canonicalLink.href
        );
        const current = new URL(locationUrl);
        const canonical = new URL(canonicalUrl);

        // A stale canonical link is common for a moment during SPA
        // navigation. Do not let a new article inherit the old key.
        if (
            current.origin !== canonical.origin ||
            current.pathname !== canonical.pathname
        ) {
            return locationUrl;
        }

        return canonicalUrl;
    }

    function createPageStorageKey() {
        return `${PAGE_KEY_PREFIX}${getCanonicalPageUrl()}`;
    }

    function createLegacyPageStorageKey() {
        const url = new URL(window.location.href);
        url.hash = "";
        return `${PAGE_KEY_PREFIX}${url.href}`;
    }

    function createNormalizedLocationStorageKey() {
        return `${PAGE_KEY_PREFIX}${normalizePageUrl(
            window.location.href
        )}`;
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

    function notifyPageListeners() {
        const snapshot = clonePageState(pageState);
        const context = {
            key: pageStorageKey,
            url: pageStorageKey.slice(PAGE_KEY_PREFIX.length)
        };

        pageListeners.forEach((listener) => {
            try {
                listener(clonePageState(snapshot), { ...context });
            } catch (error) {
                console.error(
                    "[ADAPT] Page-state listener failed:",
                    error
                );
            }
        });
    }

    async function readCurrentPageState(primaryKey) {
        const normalizedLocationKey =
            createNormalizedLocationStorageKey();
        const legacyKey = createLegacyPageStorageKey();
        const candidateKeys = Array.from(
            new Set([
                primaryKey,
                normalizedLocationKey,
                legacyKey
            ])
        );

        const result = await chrome.storage.local.get(candidateKeys);

        if (result[primaryKey]) {
            return {
                state: clonePageState(result[primaryKey]),
                migrated: false
            };
        }

        const fallbackKey = candidateKeys.find(
            (key) => key !== primaryKey && result[key]
        );

        if (!fallbackKey) {
            return {
                state: clonePageState(defaultPageState),
                migrated: false
            };
        }

        return {
            state: clonePageState(result[fallbackKey]),
            migrated: true
        };
    }

    async function loadPage(options = {}) {
        const nextKey = createPageStorageKey();
        const loaded = await readCurrentPageState(nextKey);

        pageStorageKey = nextKey;
        pageState = loaded.state;
        pageStateLoaded = true;

        if (loaded.migrated) {
            await persistPageSnapshot(
                pageStorageKey,
                clonePageState(pageState)
            );
        }

        if (options.notify) {
            notifyPageListeners();
        }

        return clonePageState(pageState);
    }

    function persistPageSnapshot(storageKey, stateSnapshot) {
        pageWriteChain = pageWriteChain
            .catch(() => {
                // A later write should still run after an earlier failure.
            })
            .then(() =>
                chrome.storage.local.set({
                    [storageKey]: stateSnapshot
                })
            );

        return pageWriteChain;
    }

    async function writePageState() {
        if (pageWriteTimer !== null) {
            window.clearTimeout(pageWriteTimer);
            pageWriteTimer = null;
        }

        if (!pageStateLoaded) {
            return clonePageState(pageState);
        }

        const storageKeySnapshot = pageStorageKey;
        const stateSnapshot = clonePageState(pageState);

        await persistPageSnapshot(
            storageKeySnapshot,
            stateSnapshot
        );

        return clonePageState(pageState);
    }

    async function updatePage(patch, options = {}) {
        if (!pageStateLoaded) {
            await loadPage();
        }

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

    async function performPageContextChange(force = false) {
        const nextKey = createPageStorageKey();

        if (
            !force &&
            pageStateLoaded &&
            nextKey === pageStorageKey
        ) {
            return clonePageState(pageState);
        }

        if (pageStateLoaded) {
            await writePageState();
        }

        return loadPage({ notify: true });
    }

    function changePageContext(options = {}) {
        const force = Boolean(options.force);

        pageContextChain = pageContextChain
            .catch(() => {
                // A later navigation should still be processed.
            })
            .then(() => performPageContextChange(force));

        return pageContextChain;
    }

    function subscribeGlobal(listener) {
        globalListeners.add(listener);
        return () => globalListeners.delete(listener);
    }

    function subscribePage(listener) {
        pageListeners.add(listener);
        return () => pageListeners.delete(listener);
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

    function checkForPageContextChange() {
        let nextKey;

        try {
            nextKey = createPageStorageKey();
        } catch {
            return;
        }

        if (nextKey === pageStorageKey) {
            return;
        }

        changePageContext().catch((error) => {
            console.error(
                "[ADAPT] Could not change page context:",
                error
            );
        });
    }

    window.setInterval(
        checkForPageContextChange,
        PAGE_CONTEXT_CHECK_DELAY
    );
    window.addEventListener("popstate", checkForPageContextChange);
    window.addEventListener("pageshow", checkForPageContextChange);

    window.addEventListener("pagehide", () => {
        writePageState().catch(() => {
            // The page may already be unloading.
        });
    });

    document.addEventListener("visibilitychange", () => {
        if (document.visibilityState !== "hidden") {
            return;
        }

        writePageState().catch(() => {
            // Saving will be retried by a later update or pagehide.
        });
    });

    globalThis.ADAPTStorage = Object.freeze({
        loadGlobal,
        updateGlobal,
        getGlobal,
        loadPage,
        updatePage,
        getPage,
        getPageKey: () => pageStorageKey,
        changePageContext,
        subscribeGlobal,
        subscribePage,
        flushPage: writePageState
    });
})();