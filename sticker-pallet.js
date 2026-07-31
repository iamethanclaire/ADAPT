// Shared loader for the packaged stickerPallet.json catalog.
(function initializeADAPTStickerPallet() {
    "use strict";

    const CATALOG_FILE = "stickerPallet.json";
    const STICKER_DIRECTORY = "stickers";
    const SAFE_ID = /^[a-z0-9][a-z0-9-]*$/;
    const SAFE_WEBP_FILE =
        /^[a-z0-9][a-z0-9._-]*\.webp$/i;

    let palettes = Object.freeze([]);
    let status = "idle";
    let loadError = null;
    let loadPromise = null;

    function normalizeSticker(
        candidate,
        paletteId,
        stickerIndex
    ) {
        if (
            !candidate ||
            typeof candidate !== "object" ||
            Array.isArray(candidate)
        ) {
            throw new TypeError(
                `Sticker ${stickerIndex + 1} in ${paletteId} must be an object.`
            );
        }

        const id = String(
            candidate.id || ""
        ).trim();
        const name = String(
            candidate.name || ""
        ).trim();
        const fileName = String(
            candidate.fileName || ""
        ).trim();

        if (!SAFE_ID.test(id)) {
            throw new TypeError(
                `Sticker "${id}" has an invalid id.`
            );
        }

        if (!name) {
            throw new TypeError(
                `Sticker "${id}" must have a name.`
            );
        }

        if (!SAFE_WEBP_FILE.test(fileName)) {
            throw new TypeError(
                `Sticker "${id}" must use a .webp file name.`
            );
        }

        return Object.freeze({
            id,
            name,
            label: name,
            fileName
        });
    }

    function normalizePalette(
        candidate,
        paletteIndex
    ) {
        if (
            !candidate ||
            typeof candidate !== "object" ||
            Array.isArray(candidate)
        ) {
            throw new TypeError(
                `Palette ${paletteIndex + 1} must be an object.`
            );
        }

        const id = String(
            candidate.id || ""
        ).trim();
        const name = String(
            candidate.name || ""
        ).trim();

        if (!SAFE_ID.test(id)) {
            throw new TypeError(
                `Palette "${id}" has an invalid id.`
            );
        }

        if (!name) {
            throw new TypeError(
                `Palette "${id}" must have a name.`
            );
        }

        if (
            !Array.isArray(candidate.stickers) ||
            candidate.stickers.length === 0
        ) {
            throw new TypeError(
                `Palette "${id}" must contain stickers.`
            );
        }

        const stickerIds = new Set();
        const fileNames = new Set();
        const stickers = candidate.stickers.map(
            (sticker, stickerIndex) => {
                const normalized = normalizeSticker(
                    sticker,
                    id,
                    stickerIndex
                );

                if (stickerIds.has(normalized.id)) {
                    throw new TypeError(
                        `Palette "${id}" contains duplicate sticker id "${normalized.id}".`
                    );
                }

                if (
                    fileNames.has(
                        normalized.fileName.toLowerCase()
                    )
                ) {
                    throw new TypeError(
                        `Palette "${id}" contains duplicate file "${normalized.fileName}".`
                    );
                }

                stickerIds.add(normalized.id);
                fileNames.add(
                    normalized.fileName.toLowerCase()
                );
                return normalized;
            }
        );

        return Object.freeze({
            id,
            name,
            label: name,
            stickers: Object.freeze(stickers)
        });
    }

    function normalizeCatalog(candidate) {
        if (
            !candidate ||
            !Array.isArray(candidate.palettes) ||
            candidate.palettes.length === 0
        ) {
            throw new TypeError(
                "stickerPallet.json must contain a non-empty palettes array."
            );
        }

        const paletteIds = new Set();
        const normalized = candidate.palettes.map(
            (palette, paletteIndex) => {
                const result = normalizePalette(
                    palette,
                    paletteIndex
                );

                if (paletteIds.has(result.id)) {
                    throw new TypeError(
                        `Duplicate palette id "${result.id}".`
                    );
                }

                paletteIds.add(result.id);
                return result;
            }
        );

        return Object.freeze(normalized);
    }

    function notifyCatalogChanged() {
        window.dispatchEvent(
            new CustomEvent(
                "adapt-sticker-pallet-loaded",
                {
                    detail: {
                        status,
                        paletteCount:
                            palettes.length
                    }
                }
            )
        );
    }

    function load() {
        if (loadPromise) {
            return loadPromise;
        }

        status = "loading";
        loadPromise = (async () => {
            try {
                const response = await fetch(
                    chrome.runtime.getURL(
                        CATALOG_FILE
                    )
                );

                if (!response.ok) {
                    throw new Error(
                        `Sticker catalog request failed with ${response.status}.`
                    );
                }

                palettes = normalizeCatalog(
                    await response.json()
                );
                status = "loaded";
                loadError = null;
            } catch (error) {
                palettes = Object.freeze([]);
                status = "error";
                loadError =
                    error instanceof Error
                        ? error
                        : new Error(
                              "The sticker catalog could not be loaded."
                          );
                console.error(
                    "[ADAPT] Could not load stickerPallet.json:",
                    loadError
                );
            }

            notifyCatalogChanged();
            return palettes;
        })();

        return loadPromise;
    }

    function getPalettes() {
        return palettes;
    }

    function getPalette(paletteId) {
        return (
            palettes.find(
                (palette) =>
                    palette.id === paletteId
            ) ||
            palettes[0] ||
            null
        );
    }

    function getSticker(
        paletteId,
        stickerId
    ) {
        const palette = getPalette(paletteId);

        if (!palette) {
            return null;
        }

        return (
            palette.stickers.find(
                (sticker) =>
                    sticker.id === stickerId
            ) ||
            palette.stickers[0] ||
            null
        );
    }

    function getStickerURL(
        paletteId,
        stickerId
    ) {
        const sticker = getSticker(
            paletteId,
            stickerId
        );

        if (!sticker) {
            return "";
        }

        return chrome.runtime.getURL(
            `${STICKER_DIRECTORY}/${sticker.fileName}`
        );
    }

    const api = Object.freeze({
        load,
        getPalettes,
        getPalette,
        getSticker,
        getStickerURL,
        getStatus: () => status,
        getError: () => loadError,
        isLoaded: () => status === "loaded"
    });

    globalThis.ADAPTStickerPallet = api;
    api.load();
})();
