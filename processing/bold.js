// Reversibly enlarges existing bold text without changing its weight.
(function initializeBoldControl() {
    "use strict";

    const DEFAULT_BOLD_SIZE_INCREASE = 10;
    const MINIMUM_BOLD_SIZE_INCREASE = 1;
    const MAXIMUM_BOLD_SIZE_INCREASE = 50;
    const BOLD_WEIGHT_THRESHOLD = 600;
    const BOLD_SIZE_ATTRIBUTE = "data-adapt-bold-sized";

    let boldSizeIncrease = DEFAULT_BOLD_SIZE_INCREASE;
    let boldSizeEnabled = false;
    let refreshFrame = null;
    let observer = null;

    document
        .getElementById("adapt-remove-bold-style")
        ?.remove();
    document
        .getElementById("adapt-bold-size-style")
        ?.remove();

    const style = document.createElement("style");
    style.id = "adapt-bold-size-style";
    style.textContent = `
        html.adapt-extension-active.adapt-bold-size-active
            body > [${BOLD_SIZE_ATTRIBUTE}]:not(#adapt-host):not([data-adapt-owned]),
        html.adapt-extension-active.adapt-bold-size-active
            body > :not(#adapt-host):not([data-adapt-owned]) [${BOLD_SIZE_ATTRIBUTE}] {
            font-size: var(--adapt-bold-font-size) !important;
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

    function isBold(element) {
        const fontWeight = window
            .getComputedStyle(element)
            .fontWeight;
        const numericWeight = Number.parseInt(
            fontWeight,
            10
        );

        return fontWeight === "bold" ||
            (
                Number.isFinite(numericWeight) &&
                numericWeight >= BOLD_WEIGHT_THRESHOLD
            );
    }

    function clearBoldSizeMarkers() {
        document
            .querySelectorAll(`[${BOLD_SIZE_ATTRIBUTE}]`)
            .forEach((element) => {
                element.removeAttribute(
                    BOLD_SIZE_ATTRIBUTE
                );
                element.style.removeProperty(
                    "--adapt-bold-font-size"
                );
                element.style.removeProperty(
                    "--adapt-bold-base-font-size"
                );
            });
    }

    function observeDocument() {
        if (!observer || !document.documentElement) {
            return;
        }

        observer.observe(document.documentElement, {
            subtree: true,
            childList: true,
            attributes: true,
            attributeFilter: ["class", "style"]
        });
    }

    function refreshBoldTextSizes() {
        if (refreshFrame !== null) {
            window.cancelAnimationFrame(refreshFrame);
            refreshFrame = null;
        }

        observer?.disconnect();

        document.documentElement.classList.remove(
            "adapt-remove-bold"
        );
        document.documentElement.classList.remove(
            "adapt-bold-size-active"
        );

        clearBoldSizeMarkers();

        if (boldSizeEnabled && document.body) {
            document.body
                .querySelectorAll("*")
                .forEach((element) => {
                    if (
                        isADAPTOwned(element) ||
                        element.hasAttribute(
                            "data-adapt-italic-bold-sized"
                        ) ||
                        !isBold(element)
                    ) {
                        return;
                    }

                    const baseFontSize = Number.parseFloat(
                        window
                            .getComputedStyle(element)
                            .fontSize
                    );

                    if (!Number.isFinite(baseFontSize)) {
                        return;
                    }

                    element.style.setProperty(
                        "--adapt-bold-base-font-size",
                        `${baseFontSize}px`
                    );
                    element.style.setProperty(
                        "--adapt-bold-font-size",
                        `${
                            baseFontSize *
                            (1 + boldSizeIncrease / 100)
                        }px`
                    );
                    element.setAttribute(
                        BOLD_SIZE_ATTRIBUTE,
                        ""
                    );
                });

            document.documentElement.classList.add(
                "adapt-bold-size-active"
            );
        }

        observeDocument();
    }

    function scheduleRefresh() {
        if (refreshFrame !== null) {
            return;
        }

        refreshFrame = window.requestAnimationFrame(() => {
            refreshFrame = null;
            refreshBoldTextSizes();
        });
    }

    function prepareForTypographyChange() {
        observer?.disconnect();

        document.documentElement.classList.remove(
            "adapt-bold-size-active"
        );
    }

    function configureBoldControl(options = {}) {
        boldSizeIncrease = normalizeBoldSizeIncrease(
            options.sizeIncrease ??
                globalThis.ADAPTStorage
                    ?.getGlobal?.()
                    .boldSizeIncrease
        );

        scheduleRefresh();
        return boldSizeIncrease;
    }

    function toggleBold(enabled) {
        boldSizeEnabled = Boolean(enabled);

        document.documentElement.classList.remove(
            "adapt-remove-bold"
        );

        configureBoldControl();
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
                configureBoldControl({
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
                configureBoldControl();
                observeDocument();
            },
            { once: true }
        );
    } else {
        configureBoldControl();
        observeDocument();
    }

    globalThis.ADAPTBold = Object.freeze({
        configure: configureBoldControl,
        prepareForTypographyChange,
        refresh: refreshBoldTextSizes,
        getSizeIncrease: () => boldSizeIncrease
    });

    globalThis.configureBoldControl =
        configureBoldControl;
    globalThis.toggleBold = toggleBold;
})();