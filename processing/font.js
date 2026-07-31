// Reversibly applies a selected font through one extension-owned CSS rule.
let selectedFontValue = "page-default";
let uploadedFontLoaded = false;
let uploadedFontName = "";
const ADAPT_UPLOADED_FONT_KEY =
    "adaptUploadedFontV1";

(function initializeFontControl() {
    "use strict";

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

function changeFont(fontValue, fontObject) {
    const root = document.documentElement;
    const selectedFont = ADAPT.fonts.find(
        (font) => font.value === fontValue
    );

    globalThis.ADAPTTypography?.invalidate();

    if (
        fontValue === "page-default" ||
        !fontObject ||
        !selectedFont
    ) {
        selectedFontValue = "page-default";
        root.classList.remove("adapt-font-override");
        root.style.removeProperty("--adapt-page-font-family");
        return;
    }

    if (selectedFont.upload) {
        selectedFontValue = selectedFont.value;

        if (!uploadedFontLoaded) {
            root.classList.remove(
                "adapt-font-override"
            );
            root.style.removeProperty(
                "--adapt-page-font-family"
            );
            return;
        }
    }

    selectedFontValue = selectedFont.value;
    root.style.setProperty(
        "--adapt-page-font-family",
        selectedFont.family
    );
    root.classList.add("adapt-font-override");
}

async function loadUploadedFont(fontRecord) {
    if (
        !fontRecord ||
        typeof fontRecord.dataUrl !== "string" ||
        !/^data:[^;,]+;base64,/i.test(
            fontRecord.dataUrl
        )
    ) {
        uploadedFontLoaded = false;
        uploadedFontName = "";
        return false;
    }

    const fontFace = new FontFace(
        "ADAPT Uploaded Font",
        `url("${fontRecord.dataUrl}")`
    );
    const loadedFont = await fontFace.load();

    document.fonts.add(loadedFont);
    uploadedFontLoaded = true;
    uploadedFontName = String(
        fontRecord.name || "Uploaded Font"
    );

    if (selectedFontValue === "uploadFont") {
        changeFont(
            "uploadFont",
            ADAPT.getFont("uploadFont")
        );
    }

    return true;
}

chrome.storage.local
    .get(ADAPT_UPLOADED_FONT_KEY)
    .then((result) =>
        loadUploadedFont(
            result[ADAPT_UPLOADED_FONT_KEY]
        )
    )
    .catch((error) => {
        console.warn(
            "[ADAPT] Could not restore the uploaded font:",
            error
        );
    });

globalThis.ADAPTFont = Object.freeze({
    loadUploadedFont,
    hasUploadedFont() {
        return uploadedFontLoaded;
    },
    getUploadedFontName() {
        return uploadedFontName;
    }
});
