// Reversibly aligns page text with the detected language direction.
(function initializeJustificationControl() {
    "use strict";

    const ROOT_CLASS = "adapt-justify";
    const STYLE_ID = "adapt-justify-style";
    const ALIGNMENT_PROPERTY =
        "--adapt-justify-alignment";
    const RTL_LANGUAGES = new Set([
        "ar",
        "arc",
        "azb",
        "bal",
        "bgn",
        "ckb",
        "dv",
        "fa",
        "glk",
        "he",
        "iw",
        "khw",
        "ks",
        "lrc",
        "mzn",
        "nqo",
        "pnb",
        "ps",
        "sd",
        "syr",
        "ug",
        "ur",
        "yi"
    ]);
    const RTL_SCRIPTS = new Set([
        "adlm",
        "arab",
        "hebr",
        "nkoo",
        "rohg",
        "syrc",
        "thaa"
    ]);

    let enabled = false;
    let currentAlignment = "left";
    let refreshFrame = null;

    function installStyle() {
        const existingStyle =
            document.getElementById(STYLE_ID);

        if (existingStyle) {
            return;
        }

        const style = document.createElement("style");
        style.id = STYLE_ID;
        style.textContent = `
            html.adapt-extension-active.${ROOT_CLASS}
                body > :not(#adapt-host):not([data-adapt-owned]),
            html.adapt-extension-active.${ROOT_CLASS}
                body > :not(#adapt-host):not([data-adapt-owned])
                :not([data-adapt-owned], [data-adapt-owned] *) {
                text-align:
                    var(${ALIGNMENT_PROPERTY}, left)
                    !important;
            }
        `;
        (document.head || document.documentElement)
            .appendChild(style);
    }

    function normalizeLanguageTag(value) {
        return String(value || "")
            .trim()
            .replace(/_/g, "-");
    }

    function getDeclaredLanguage() {
        const htmlLanguage =
            document.documentElement.lang;
        const bodyLanguage = document.body?.lang;

        if (htmlLanguage || bodyLanguage) {
            return normalizeLanguageTag(
                htmlLanguage || bodyLanguage
            );
        }

        const contentLanguageMeta = Array.from(
            document.querySelectorAll("meta[content]")
        ).find(
            (meta) =>
                meta.getAttribute("http-equiv")
                    ?.toLowerCase() ===
                "content-language"
        );

        return normalizeLanguageTag(
            contentLanguageMeta?.content
                ?.split(",")[0]
                ?.split(";")[0]
        );
    }

    function getLocaleDirection(languageTag) {
        if (!languageTag) {
            return null;
        }

        try {
            if (typeof Intl.Locale === "function") {
                const locale = new Intl.Locale(
                    languageTag
                );
                const textInfo =
                    locale.textInfo ||
                    locale.getTextInfo?.();

                if (
                    textInfo?.direction === "rtl" ||
                    textInfo?.direction === "ltr"
                ) {
                    return textInfo.direction;
                }
            }
        } catch (error) {
            // The fallback below handles malformed or unsupported tags.
        }

        const parts = languageTag
            .toLowerCase()
            .split("-")
            .filter(Boolean);
        const language = parts[0];
        const script = parts.find(
            (part) => part.length === 4
        );

        if (
            RTL_LANGUAGES.has(language) ||
            RTL_SCRIPTS.has(script)
        ) {
            return "rtl";
        }

        return "ltr";
    }

    function getExplicitDirection() {
        const direction = [
            document.documentElement.getAttribute(
                "dir"
            ),
            document.body?.getAttribute("dir")
        ]
            .map((value) =>
                String(value || "").toLowerCase()
            )
            .find(
                (value) =>
                    value === "rtl" || value === "ltr"
            );

        return direction || null;
    }

    function getTextDirection() {
        const sample = String(
            document.body?.innerText || ""
        ).slice(0, 20000);
        const rtlCharacters =
            sample.match(
                /[\u0590-\u08ff\ufb1d-\ufdff\ufe70-\ufeff]/gu
            )?.length || 0;
        const ltrCharacters =
            sample.match(
                /[A-Za-z\u00c0-\u02af\u0370-\u058f]/gu
            )?.length || 0;

        if (
            rtlCharacters >= 3 &&
            rtlCharacters > ltrCharacters
        ) {
            return "rtl";
        }

        if (ltrCharacters >= 3) {
            return "ltr";
        }

        return null;
    }

    function getComputedDirection() {
        const direction = getComputedStyle(
            document.body || document.documentElement
        ).direction;

        return direction === "rtl" ? "rtl" : "ltr";
    }

    function detectAlignment() {
        const declaredLanguage =
            getDeclaredLanguage();
        const direction =
            getExplicitDirection() ||
            getLocaleDirection(declaredLanguage) ||
            getTextDirection() ||
            getComputedDirection();

        return direction === "rtl" ? "right" : "left";
    }

    function refresh() {
        if (!enabled) {
            return currentAlignment;
        }

        currentAlignment = detectAlignment();
        document.documentElement.style.setProperty(
            ALIGNMENT_PROPERTY,
            currentAlignment
        );

        return currentAlignment;
    }

    function scheduleRefresh() {
        if (!enabled || refreshFrame !== null) {
            return;
        }

        refreshFrame = requestAnimationFrame(() => {
            refreshFrame = null;
            refresh();
        });
    }

    function toggle(shouldEnable) {
        enabled = Boolean(shouldEnable);

        if (enabled) {
            refresh();
        } else {
            if (refreshFrame !== null) {
                cancelAnimationFrame(refreshFrame);
                refreshFrame = null;
            }

            document.documentElement.style.removeProperty(
                ALIGNMENT_PROPERTY
            );
        }

        document.documentElement.classList.toggle(
            ROOT_CLASS,
            enabled
        );
    }

    installStyle();

    function observeLanguageAttributes() {
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ["dir", "lang"],
            childList: true
        });

        if (document.body) {
            observer.observe(document.body, {
                attributes: true,
                attributeFilter: ["dir", "lang"]
            });
        }
    }

    const observer = new MutationObserver(() => {
        observeLanguageAttributes();
        scheduleRefresh();
    });
    observeLanguageAttributes();

    window.addEventListener(
        "hashchange",
        scheduleRefresh
    );
    window.addEventListener(
        "popstate",
        scheduleRefresh
    );
    window.addEventListener(
        "languagechange",
        scheduleRefresh
    );

    globalThis.ADAPTJustify = Object.freeze({
        toggle,
        refresh,
        detectAlignment,
        getAlignment() {
            return currentAlignment;
        }
    });
})();