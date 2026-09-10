// Reversibly applies built-in and permanently saved uploaded fonts.
let selectedFontValue = "page-default";

const ADAPT_UPLOADED_FONTS_KEY =
    "adaptUploadedFontsV2";
const ADAPT_LEGACY_UPLOADED_FONT_KEY =
    "adaptUploadedFontV1";

const uploadedFontFaces = new Map();
let uploadedFontRecords = [];

function notifyUploadedFontsChanged(
    action,
    fontObject
) {
    window.dispatchEvent(
        new CustomEvent("adapt-fonts-changed", {
            detail: {
                action,
                font: fontObject || null
            }
        })
    );
}

(function initializeFontControl() {
    "use strict";

    const existingStyle = document.getElementById(
        "adapt-page-font-style"
    );

    if (existingStyle) {
        existingStyle.remove();
    }

    const style = document.createElement("style");
    style.id = "adapt-page-font-style";
    style.textContent = `
        html.adapt-extension-active.adapt-font-override
            body > :not(#adapt-host):not([data-adapt-owned]),
        html.adapt-extension-active.adapt-font-override
            body > :not(#adapt-host):not([data-adapt-owned]) * {
            font-family: var(--adapt-page-font-family) !important;
        }
    `;
    document.head.appendChild(style);
})();

function normalizeFontName(value) {
    return String(value || "Uploaded Font")
        .replace(/[\u0000-\u001f\u007f]/g, "")
        .trim()
        .slice(0, 100) || "Uploaded Font";
}

function createFontId(fontName) {
    const slug = normalizeFontName(fontName)
        .toLowerCase()
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 40) || "font";

    const uniquePart =
        globalThis.crypto?.randomUUID?.() ||
        `${Date.now().toString(36)}-${Math.random()
            .toString(36)
            .slice(2)}`;

    return `${slug}-${uniquePart}`
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "");
}

function isValidFontDataUrl(value) {
    return typeof value === "string" &&
        /^data:[^;,]+;base64,/i.test(value);
}

function normalizeFontRecord(
    candidate,
    options = {}
) {
    if (
        !candidate ||
        !isValidFontDataUrl(candidate.dataUrl)
    ) {
        return null;
    }

    const name = normalizeFontName(candidate.name);

    const requestedId = String(
        candidate.id || ""
    )
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "")
        .slice(0, 100);

    const id =
        requestedId ||
        (options.legacy
            ? "legacy"
            : createFontId(name));

    const requestedValue = String(
        candidate.value || ""
    );

    const value =
        requestedValue === "uploadFont" ||
        /^uploaded-font:[a-z0-9-]+$/i.test(
            requestedValue
        )
            ? requestedValue
            : options.legacy
              ? "uploadFont"
              : `uploaded-font:${id}`;

    return {
        id,
        value,
        name,
        dataUrl: candidate.dataUrl,
        updatedAt:
            Number(candidate.updatedAt) || Date.now()
    };
}

function getFontFamilyName(fontRecord) {
    return `ADAPT Uploaded Font ${fontRecord.id}`;
}

function createFontObject(fontRecord) {
    const familyName = getFontFamilyName(fontRecord);

    return {
        label: fontRecord.name,
        value: fontRecord.value,
        family: `"${familyName}", sans-serif`,
        premium: true,
        uploaded: true,
        recordId: fontRecord.id
    };
}

function sortFontRecords(records) {
    return [...records].sort((left, right) =>
        left.name.localeCompare(
            right.name,
            undefined,
            {
                sensitivity: "base",
                numeric: true
            }
        )
    );
}

async function prepareUploadedFont(fontRecord) {
    const fontObject = createFontObject(fontRecord);

    const fontFace = new FontFace(
        getFontFamilyName(fontRecord),
        `url("${fontRecord.dataUrl}") format("truetype")`
    );

    const loadedFontFace = await fontFace.load();

    return {
        fontRecord,
        fontObject,
        fontFace: loadedFontFace
    };
}

function commitUploadedFont(preparedFont) {
    const {
        fontRecord,
        fontObject,
        fontFace
    } = preparedFont;

    const previousFontFace = uploadedFontFaces.get(
        fontRecord.value
    );

    if (previousFontFace) {
        document.fonts.delete?.(previousFontFace);
    }

    document.fonts.add(fontFace);

    uploadedFontFaces.set(
        fontRecord.value,
        fontFace
    );

    if (
        typeof ADAPT.registerUploadedFont ===
        "function"
    ) {
        ADAPT.registerUploadedFont(fontObject);
    } else {
        const existingIndex = ADAPT.fonts.findIndex(
            (font) =>
                font.uploaded &&
                font.value === fontObject.value
        );

        if (existingIndex >= 0) {
            ADAPT.fonts.splice(
                existingIndex,
                1,
                fontObject
            );
        } else {
            ADAPT.fonts.push(fontObject);
        }
    }

    if (selectedFontValue === fontRecord.value) {
        changeFont(fontRecord.value, fontObject);
    }

    return fontObject;
}

function changeFont(fontValue, fontObject) {
    const root = document.documentElement;

    const selectedFont = ADAPT.fonts.find(
        (font) =>
            !font.upload &&
            font.value === fontValue
    );

    globalThis.ADAPTTypography?.invalidate();

    if (
        fontValue === "page-default" ||
        !fontObject ||
        !selectedFont
    ) {
        selectedFontValue = "page-default";

        root.classList.remove(
            "adapt-font-override"
        );

        root.style.removeProperty(
            "--adapt-page-font-family"
        );

        return;
    }

    selectedFontValue = selectedFont.value;

    if (
        selectedFont.uploaded &&
        !uploadedFontFaces.has(selectedFont.value)
    ) {
        root.classList.remove(
            "adapt-font-override"
        );

        root.style.removeProperty(
            "--adapt-page-font-family"
        );

        return;
    }

    root.style.setProperty(
        "--adapt-page-font-family",
        selectedFont.family
    );

    root.classList.add("adapt-font-override");
}

async function loadUploadedFont(fontRecord) {
    const normalizedRecord = normalizeFontRecord(
        fontRecord,
        {
            legacy:
                !fontRecord?.id &&
                !fontRecord?.value
        }
    );

    if (!normalizedRecord) {
        return false;
    }

    const preparedFont = await prepareUploadedFont(
        normalizedRecord
    );

    commitUploadedFont(preparedFont);

    const existingIndex =
        uploadedFontRecords.findIndex(
            (record) =>
                record.value === normalizedRecord.value
        );

    if (existingIndex >= 0) {
        uploadedFontRecords.splice(
            existingIndex,
            1,
            normalizedRecord
        );
    } else {
        uploadedFontRecords.push(normalizedRecord);
    }

    uploadedFontRecords = sortFontRecords(
        uploadedFontRecords
    );

    notifyUploadedFontsChanged(
        "added",
        createFontObject(normalizedRecord)
    );

    return true;
}

async function restoreUploadedFonts() {
    const result = await chrome.storage.local.get([
        ADAPT_UPLOADED_FONTS_KEY,
        ADAPT_LEGACY_UPLOADED_FONT_KEY
    ]);

    const hasSavedCollection = Array.isArray(
        result[ADAPT_UPLOADED_FONTS_KEY]
    );

    const rawRecords = hasSavedCollection
        ? result[ADAPT_UPLOADED_FONTS_KEY]
        : result[ADAPT_LEGACY_UPLOADED_FONT_KEY]
          ? [
                result[
                    ADAPT_LEGACY_UPLOADED_FONT_KEY
                ]
            ]
          : [];

    const seenValues = new Set();

    const normalizedRecords = rawRecords
        .map((record) =>
            normalizeFontRecord(record, {
                legacy: !hasSavedCollection
            })
        )
        .filter((record) => {
            if (
                !record ||
                seenValues.has(record.value)
            ) {
                return false;
            }

            seenValues.add(record.value);
            return true;
        });

    const restoredRecords = [];

    for (const fontRecord of normalizedRecords) {
        try {
            const preparedFont =
                await prepareUploadedFont(fontRecord);

            commitUploadedFont(preparedFont);
            restoredRecords.push(fontRecord);
        } catch (error) {
            console.warn(
                `[ADAPT] Could not restore uploaded font "${fontRecord.name}":`,
                error
            );
        }
    }

    uploadedFontRecords = sortFontRecords(
        restoredRecords
    );

    if (
        rawRecords.length > 0 &&
        (
            !hasSavedCollection ||
            restoredRecords.length !==
                rawRecords.length
        )
    ) {
        await chrome.storage.local.set({
            [ADAPT_UPLOADED_FONTS_KEY]:
                uploadedFontRecords
        });
    }

    if (
        !hasSavedCollection &&
        result[ADAPT_LEGACY_UPLOADED_FONT_KEY]
    ) {
        await chrome.storage.local.remove(
            ADAPT_LEGACY_UPLOADED_FONT_KEY
        );
    }

    return uploadedFontRecords.map(
        createFontObject
    );
}

const uploadedFontsReady = restoreUploadedFonts()
    .catch((error) => {
        console.warn(
            "[ADAPT] Could not restore uploaded fonts:",
            error
        );

        uploadedFontRecords = [];
        return [];
    });

async function addUploadedFont(fontRecord) {
    await uploadedFontsReady;

    if (!isValidFontDataUrl(fontRecord?.dataUrl)) {
        return null;
    }

    const name = normalizeFontName(fontRecord.name);

    const existingRecord = uploadedFontRecords.find(
        (record) =>
            record.name.localeCompare(
                name,
                undefined,
                {
                    sensitivity: "base"
                }
            ) === 0
    );

    const normalizedRecord = normalizeFontRecord({
        ...fontRecord,
        id: existingRecord?.id,
        value: existingRecord?.value,
        name
    });

    if (!normalizedRecord) {
        return null;
    }

    const preparedFont = await prepareUploadedFont(
        normalizedRecord
    );

    const nextRecords = existingRecord
        ? uploadedFontRecords.map((record) =>
              record.value === existingRecord.value
                  ? normalizedRecord
                  : record
          )
        : [
              ...uploadedFontRecords,
              normalizedRecord
          ];

    const sortedRecords =
        sortFontRecords(nextRecords);

    await chrome.storage.local.set({
        [ADAPT_UPLOADED_FONTS_KEY]: sortedRecords
    });

    const fontObject = commitUploadedFont(
        preparedFont
    );

    uploadedFontRecords = sortedRecords;

    notifyUploadedFontsChanged(
        existingRecord ? "updated" : "added",
        fontObject
    );

    return fontObject;
}

async function deleteUploadedFont(fontValue) {
    await uploadedFontsReady;

    const existingRecord = uploadedFontRecords.find(
        (record) => record.value === fontValue
    );

    if (!existingRecord) {
        return false;
    }

    const nextRecords = uploadedFontRecords.filter(
        (record) => record.value !== fontValue
    );

    await chrome.storage.local.set({
        [ADAPT_UPLOADED_FONTS_KEY]: nextRecords
    });

    const fontFace = uploadedFontFaces.get(fontValue);

    if (fontFace) {
        document.fonts.delete?.(fontFace);
        uploadedFontFaces.delete(fontValue);
    }

    if (
        typeof ADAPT.unregisterUploadedFont ===
        "function"
    ) {
        ADAPT.unregisterUploadedFont(fontValue);
    } else {
        const existingIndex = ADAPT.fonts.findIndex(
            (font) =>
                font.uploaded &&
                font.value === fontValue
        );

        if (existingIndex >= 0) {
            ADAPT.fonts.splice(existingIndex, 1);
        }
    }

    uploadedFontRecords = nextRecords;

    if (selectedFontValue === fontValue) {
        changeFont(
            "page-default",
            ADAPT.getFont("page-default")
        );
    }

    notifyUploadedFontsChanged(
        "deleted",
        createFontObject(existingRecord)
    );

    return true;
}

globalThis.ADAPTFont = Object.freeze({
    ready: uploadedFontsReady,
    addUploadedFont,
    deleteUploadedFont,
    loadUploadedFont,

    hasUploadedFont(fontValue) {
        if (fontValue) {
            return uploadedFontFaces.has(fontValue);
        }

        return uploadedFontFaces.size > 0;
    },

    getUploadedFontName(
        fontValue = selectedFontValue
    ) {
        return ADAPT.fonts.find(
            (font) =>
                font.uploaded &&
                font.value === fontValue
        )?.label || "";
    },

    getUploadedFonts() {
        return uploadedFontRecords.map(
            createFontObject
        );
    },

    getUploadedFontFamily(fontValue) {
        return ADAPT.fonts.find(
            (font) =>
                font.uploaded &&
                font.value === fontValue
        )?.family || "";
    }
});