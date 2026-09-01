// Reversibly converts existing italic text to enlarged bold text.
(function initializeItalicsControl() {
    "use strict";

    const DEFAULT_BOLD_SIZE_INCREASE = 10;
    const MINIMUM_BOLD_SIZE_INCREASE = 1;
    const MAXIMUM_BOLD_SIZE_INCREASE = 50;
    const ITALIC_BOLD_ATTRIBUTE =
        "data-adapt-italic-bold-sized";

    let boldSizeIncrease = DEFAULT_BOLD_SIZE_INCREASE;
    let italicBoldEnabled = false;
    let refreshFrame = null;
    let observer = null;

    document
        .getElementById("adapt-remove-italics-style")
        ?.remove();
    document
        .getElementById("adapt-italic-bold-style")
        ?.remove();

    const style = document.createElement("style");
    style.id = "adapt-italic-bold-style";
    style.textContent = `
        html.adapt-extension-active.adapt-italic-bold-active
            body > [${ITALIC_BOLD_ATTRIBUTE}]:not(#adapt-host):not([data-adapt-owned]),
        html.adapt-extension-active.adapt-italic-bold-active
            body > :not(#adapt-host):not([data-adapt-owned]) [${ITALIC_BOLD_ATTRIBUTE}] {
            font-style: normal !important;
            font-weight: 700 !important;
            font-size: var(--adapt-italic-bold-font-size) !important;
        }
    `;
    document.head.appendChild(style);

    function normalizeBoldSizeIncrease(value) {
        const parsed = Number(value);
        const fallback = Number.isFinite(parsed)
            ? parsed
            : DEFAULT_BOLD_SIZE_INCREASE;

        return Math.min(
            Math.max(
                fallback,
                MINIMUM_BOLD_SIZE_INCREASE
            ),
            MAXIMUM_BOLD_SIZE_INCREASE
        );
    }

    function isADAPTOwned(element) {
        return Boolean(
            element.closest(
                "#adapt-host, [data-adapt-owned]"
            )
        );
    }

    function isItalic(element) {
        const fontStyle = window
            .getComputedStyle(element)
            .fontStyle
            .toLowerCase();

        return fontStyle === "italic" ||
            fontStyle === "oblique" ||
            fontStyle.startsWith("oblique ");
    }

    function getBaseFontSize(element) {
        if (
            element.hasAttribute(
                "data-adapt-bold-sized"
            )
        ) {
            const boldBaseFontSize = Number.parseFloat(
                element.style.getPropertyValue(
                    "--adapt-bold-base-font-size"
                )
            );

            if (Number.isFinite(boldBaseFontSize)) {
                return boldBaseFontSize;
            }
        }

        return Number.parseFloat(
            window.getComputedStyle(element).fontSize
        );
    }

    function clearItalicBoldMarkers() {
        document
            .querySelectorAll(
                `[${ITALIC_BOLD_ATTRIBUTE}]`
            )
            .forEach((element) => {
                element.style.removeProperty(
                    "--adapt-italic-bold-font-size"
                );
                element.style.removeProperty(
                    "--adapt-italic-bold-base-font-size"
                );
                element.removeAttribute(
                    ITALIC_BOLD_ATTRIBUTE
                );
            });
    }

    function observeDocument() {
        if (!observer || !document.body) {
            return;
        }

        observer.observe(document.body, {
            subtree: true,
            childList: true
        });
    }

    function refreshItalicBoldText() {
        if (refreshFrame !== null) {
            window.cancelAnimationFrame(refreshFrame);
            refreshFrame = null;
        }

        observer?.disconnect();

        document.documentElement.classList.remove(
            "adapt-remove-italics"
        );
        document.documentElement.classList.remove(
            "adapt-italic-bold-active"
        );

        clearItalicBoldMarkers();

        if (italicBoldEnabled && document.body) {
            document.body
                .querySelectorAll("*")
                .forEach((element) => {
                    if (
                        isADAPTOwned(element) ||
                        !isItalic(element)
                    ) {
                        return;
                    }

                    const baseFontSize =
                        getBaseFontSize(element);

                    if (!Number.isFinite(baseFontSize)) {
                        return;
                    }

                    element.style.setProperty(
                        "--adapt-italic-bold-base-font-size",
                        `${baseFontSize}px`
                    );
                    element.style.setProperty(
                        "--adapt-italic-bold-font-size",
                        `${
                            baseFontSize *
                            (1 + boldSizeIncrease / 100)
                        }px`
                    );
                    element.setAttribute(
                        ITALIC_BOLD_ATTRIBUTE,
                        ""
                    );
                });

            document.documentElement.classList.add(
                "adapt-italic-bold-active"
            );
        } else {
            globalThis.ADAPTBold?.refresh?.();
        }

        observeDocument();
    }

    function scheduleRefresh() {
        if (refreshFrame !== null) {
            return;
        }

        refreshFrame = window.requestAnimationFrame(() => {
            refreshFrame = null;
            refreshItalicBoldText();
        });
    }

    function prepareForTypographyChange() {
        observer?.disconnect();

        document.documentElement.classList.remove(
            "adapt-italic-bold-active"
        );
    }

    function configureItalicsControl(options = {}) {
        boldSizeIncrease = normalizeBoldSizeIncrease(
            options.sizeIncrease ??
                globalThis.ADAPTStorage
                    ?.getGlobal?.()
                    .boldSizeIncrease
        );

        scheduleRefresh();
        return boldSizeIncrease;
    }

    function toggleItalics(enabled) {
        italicBoldEnabled = Boolean(enabled);

        document.documentElement.classList.remove(
            "adapt-remove-italics"
        );

        configureItalicsControl();
    }

    observer = new MutationObserver(scheduleRefresh);

    window.addEventListener(
        "adapt-settings-changed",
        (event) => {
            if (
                event.detail &&
                Object.prototype.hasOwnProperty.call(
                    event.detail,
                    "boldSizeIncrease"
                )
            ) {
                configureItalicsControl({
                    sizeIncrease:
                        event.detail.boldSizeIncrease
                });
            }
        }
    );

    if (document.readyState === "loading") {
        document.addEventListener(
            "DOMContentLoaded",
            () => {
                configureItalicsControl();
                observeDocument();
            },
            { once: true }
        );
    } else {
        configureItalicsControl();
        observeDocument();
    }

    globalThis.ADAPTItalics = Object.freeze({
        configure: configureItalicsControl,
        prepareForTypographyChange,
        refresh: refreshItalicBoldText,
        getSizeIncrease: () => boldSizeIncrease
    });

    globalThis.configureItalicsControl =
        configureItalicsControl;
    globalThis.toggleItalics = toggleItalics;

    const legacyClassObserver = new MutationObserver(() => {
        if (
            document.documentElement.classList.contains(
                "adapt-remove-italics"
            )
        ) {
            document.documentElement.classList.remove(
                "adapt-remove-italics"
            );
        }
    });

    legacyClassObserver.observe(
        document.documentElement,
        {
            attributes: true,
            attributeFilter: ["class"]
        }
    );
})();