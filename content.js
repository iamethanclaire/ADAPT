// Creates the A.D.A.P.T. toolbar and owns reversible numeric typography styles.
"use strict";

const {
    bgColor,
    textColor,
    borderColor,
    inputColor,
    hoverColor,
    hoverSelectedToolColor,
    hoverSelectedAlterationColor,
    selectedToolColor,
    selectedAlterationColor,
    selectedInputBorderColor,
    lineColor
} = ADAPT;

const logoSrc = chrome.runtime.getURL("images/icon-48.png");
const logoInactiveSrc = chrome.runtime.getURL(
    "images/icon-48-inactive.png"
);

const adaptHost = document.createElement("div");
adaptHost.id = "adapt-host";
adaptHost.dataset.adaptOwned = "true";
document.body.appendChild(adaptHost);

const adaptShadow = adaptHost.attachShadow({ mode: "open" });

const adaptShadowStyles = document.createElement("style");
adaptShadowStyles.textContent = `
    :host {
        all: initial;
    }

    *,
    *::before,
    *::after {
        box-sizing: border-box;
    }

    button,
    input {
        font-family: Arial, Helvetica, sans-serif;
    }

    button {
        border: 0;
    }

    #adapt-toolbar {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 48px;
        z-index: 2147483600;
        display: flex;
        align-items: center;
        flex-wrap: nowrap;
        gap: 8px;
        padding: 0;
        overflow: visible;
        color: ${textColor};
        background: ${bgColor};
        border-bottom: 1px solid ${borderColor};
        font: 14px/1 Arial, Helvetica, sans-serif;
    }

    #adapt-tab {
        position: fixed;
        top: 0;
        right: 12px;
        z-index: 2147483600;
        display: none;
        padding: 2px 12px;
        color: ${textColor};
        background: ${bgColor};
        border: 1px solid ${borderColor};
        border-top: 0;
        border-radius: 0 0 8px 8px;
        cursor: pointer;
        font: 12px/1 Arial, Helvetica, sans-serif;
    }

    #adapt-tab img {
        pointer-events: none;
    }

    .adapt-divider {
        width: 1px;
        min-width: 1px;
        height: 24px;
        flex: 0 0 1px;
        background: ${borderColor};
    }

    #adapt-toolbar.adapt-compact .adapt-value-input {
        display: none !important;
    }

    #adapt-toolbar.adapt-compact {
        gap: 5px;
    }

    #adapt-toolbar.adapt-compact #adapt-logo {
        margin-right: 6px !important;
    }

    #adapt-toolbar button,
    #adapt-toolbar input,
    #adapt-toolbar img,
    #adapt-dropdown {
        flex: 0 0 auto;
    }

    .adapt-dropdown-item {
        font-size: 14px;
        font-style: normal;
        font-weight: 400;
        text-decoration: none;
    }
`;
adaptShadow.appendChild(adaptShadowStyles);

const toolbar = document.createElement("div");
toolbar.id = "adapt-toolbar";
toolbar.dataset.adaptToolbar = "true";
toolbar.innerHTML = getToolbarHTML(logoSrc);

const tab = document.createElement("div");
tab.id = "adapt-tab";
tab.dataset.adaptToolbar = "true";
tab.setAttribute("role", "button");
tab.setAttribute("tabindex", "0");
tab.setAttribute("aria-label", "Show A.D.A.P.T. toolbar");
tab.innerHTML = getTabHTML(logoSrc);

adaptShadow.append(tab, toolbar);

const adaptFontStyles = document.createElement("style");
adaptFontStyles.textContent = ADAPT.getFontStyles();
adaptShadow.appendChild(adaptFontStyles);

ADAPT.fonts
    .filter((font) => font.url)
    .forEach((font) => {
        const fontFace = new FontFace(
            font.label,
            `url(${font.url})`
        );

        fontFace
            .load()
            .then((loadedFont) => {
                document.fonts.add(loadedFont);
            })
            .catch((error) => {
                console.warn(
                    `[ADAPT] Could not preload ${font.label}:`,
                    error
                );
            });
    });

const originalBodyMarginTop = {
    value: document.body.style.getPropertyValue("margin-top"),
    priority:
        document.body.style.getPropertyPriority("margin-top"),
    computed: getComputedStyle(document.body).marginTop
};

function updateCompactToolbar() {
    const availableScreenWidth =
        window.screen?.availWidth || window.innerWidth;

    toolbar.classList.toggle(
        "adapt-compact",
        window.innerWidth <= availableScreenWidth / 2
    );
}

function setToolbarHidden(shouldHide) {
    const hidden = Boolean(shouldHide);

    toolbar.style.display = hidden ? "none" : "flex";
    tab.style.display = hidden ? "block" : "none";
    tab.setAttribute("aria-hidden", String(!hidden));

    if (hidden) {
        if (originalBodyMarginTop.value) {
            document.body.style.setProperty(
                "margin-top",
                originalBodyMarginTop.value,
                originalBodyMarginTop.priority
            );
        } else {
            document.body.style.removeProperty("margin-top");
        }
    } else {
        document.body.style.setProperty(
            "margin-top",
            `calc(${originalBodyMarginTop.computed} + 48px)`,
            "important"
        );
    }

    window.requestAnimationFrame(() => {
        globalThis.ADAPTNote?.reposition();
    });
}

window.addEventListener("resize", updateCompactToolbar);
updateCompactToolbar();
setToolbarHidden(false);

globalThis.ADAPTLayout = Object.freeze({
    setToolbarHidden,
    updateCompactToolbar
});

// Numeric text controls require measured original values. This manager stores
// the original inline declarations and restores those declarations exactly.
globalThis.ADAPTTypography = (function createTypographyManager() {
    const pageContentSelector = [
        "body > :not(#adapt-host):not([data-adapt-owned])",
        "body > :not(#adapt-host):not([data-adapt-owned]) *"
    ].join(",");

    const records = new Map();
    let currentSettings = null;
    let observer = null;
    let isRefreshing = false;

    function getPageElements() {
        return Array.from(
            document.querySelectorAll(pageContentSelector)
        ).filter((element) => element instanceof HTMLElement);
    }

    function readInlineProperty(element, property) {
        return {
            value: element.style.getPropertyValue(property),
            priority: element.style.getPropertyPriority(property)
        };
    }

    function restoreInlineProperty(element, property, original) {
        if (original.value) {
            element.style.setProperty(
                property,
                original.value,
                original.priority
            );
        } else {
            element.style.removeProperty(property);
        }
    }

    function captureElement(element) {
        if (records.has(element)) {
            return;
        }

        const computed = getComputedStyle(element);
        const fontSize = Number.parseFloat(computed.fontSize) || 16;
        const parsedLineHeight = Number.parseFloat(
            computed.lineHeight
        );
        const lineHeight = Number.isFinite(parsedLineHeight)
            ? parsedLineHeight
            : fontSize * 1.2;
        const parsedLetterSpacing = Number.parseFloat(
            computed.letterSpacing
        );

        records.set(element, {
            inline: {
                fontSize: readInlineProperty(element, "font-size"),
                lineHeight: readInlineProperty(element, "line-height"),
                letterSpacing: readInlineProperty(
                    element,
                    "letter-spacing"
                )
            },
            computed: {
                fontSize,
                lineHeight,
                letterSpacing: Number.isFinite(parsedLetterSpacing)
                    ? parsedLetterSpacing
                    : 0
            }
        });
    }

    function restoreAll(options = {}) {
        records.forEach((record, element) => {
            if (!element.isConnected) {
                records.delete(element);
                return;
            }

            restoreInlineProperty(
                element,
                "font-size",
                record.inline.fontSize
            );
            restoreInlineProperty(
                element,
                "line-height",
                record.inline.lineHeight
            );
            restoreInlineProperty(
                element,
                "letter-spacing",
                record.inline.letterSpacing
            );
        });

        if (options.clear) {
            records.clear();
        }
    }

    function applyToCapturedElements() {
        if (!currentSettings) {
            return;
        }

        const sizeMultiplier = currentSettings.size / 100;
        const leadingMultiplier = currentSettings.leading / 100;
        const spacingChangeEm =
            ((currentSettings.spacing - 100) / 100) * 0.12;

        records.forEach((record, element) => {
            if (!element.isConnected) {
                records.delete(element);
                return;
            }

            if (currentSettings.size !== 100) {
                element.style.setProperty(
                    "font-size",
                    `${
                        record.computed.fontSize *
                        sizeMultiplier
                    }px`,
                    "important"
                );
            }

            if (currentSettings.leading !== 100) {
                element.style.setProperty(
                    "line-height",
                    `${
                        record.computed.lineHeight *
                        sizeMultiplier *
                        leadingMultiplier
                    }px`,
                    "important"
                );
            }

            if (currentSettings.spacing !== 100) {
                element.style.setProperty(
                    "letter-spacing",
                    `calc(${record.computed.letterSpacing}px + ${spacingChangeEm}em)`,
                    "important"
                );
            }
        });
    }

    function refreshForNewContent() {
        if (isRefreshing || !currentSettings) {
            return;
        }

        isRefreshing = true;

        // Measure new elements while ancestor typography is restored so values
        // are never multiplied twice on dynamically rendered pages.
        restoreAll();
        getPageElements().forEach(captureElement);
        applyToCapturedElements();

        isRefreshing = false;
    }

    function startObserver() {
        if (observer) {
            return;
        }

        observer = new MutationObserver((mutations) => {
            const hasAddedPageContent = mutations.some((mutation) =>
                Array.from(mutation.addedNodes).some(
                    (node) =>
                        node.nodeType === Node.ELEMENT_NODE &&
                        !node.closest?.("[data-adapt-owned]")
                )
            );

            if (hasAddedPageContent) {
                refreshForNewContent();
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    function stopObserver() {
        observer?.disconnect();
        observer = null;
    }

    function apply(settings) {
        restoreAll();

        const needsOverrides =
            settings.enabled &&
            (settings.size !== 100 ||
                settings.leading !== 100 ||
                settings.spacing !== 100);

        if (!needsOverrides) {
            currentSettings = null;
            stopObserver();
            restoreAll({ clear: true });
            return;
        }

        currentSettings = {
            size: settings.size,
            leading: settings.leading,
            spacing: settings.spacing
        };

        getPageElements().forEach(captureElement);
        applyToCapturedElements();
        startObserver();
    }

    function invalidate() {
        stopObserver();
        restoreAll({ clear: true });
        currentSettings = null;
    }

    return Object.freeze({
        apply,
        invalidate,
        restore: () => {
            invalidate();
        }
    });
})();
