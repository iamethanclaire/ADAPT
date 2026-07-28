// Reversibly applies a selected font through one extension-owned CSS rule.
let selectedFontValue = "page-default";

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

    selectedFontValue = selectedFont.value;
    root.style.setProperty(
        "--adapt-page-font-family",
        selectedFont.family
    );
    root.classList.add("adapt-font-override");
}
