// A.D.A.P.T. settings panel and local demo premium unlock.
(function initializeADAPTSettings() {
    "use strict";

    const UPLOADED_FONT_KEY =
        "adaptUploadedFontV1";
    const TYPOGRAPHY_WARNING =
        "Text displayed at this size may impact the structure of the webpage and may impact readability.";
    const SPACING_WARNING =
        "Text displayed with this letter spacing may impact the structure of the webpage and may impact readability.";
    const LEADING_WARNING =
        "Text displayed with this line spacing may impact the structure of the webpage and may impact readability.";
    const BOLD_SIZE_WARNING =
        "This bold text size may negatively impact the readability of the screen.";

    let overlay = null;
    let panelContent = null;
    let purchaseOverlay = null;
    let uploadInput = null;
    let statusMessage = "";

    function getSettings() {
        return globalThis.ADAPTStorage?.getGlobal?.() || {};
    }

    async function updateSettings(patch) {
        if (globalThis.ADAPTApp?.updateGlobalSetting) {
            await globalThis.ADAPTApp.updateGlobalSetting(
                patch,
                { apply: true }
            );
        } else {
            await globalThis.ADAPTStorage?.updateGlobal?.(
                patch
            );
        }

        window.dispatchEvent(
            new CustomEvent(
                "adapt-settings-changed",
                { detail: patch }
            )
        );
    }

    function escapeHTML(value) {
        return String(value)
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }

    function numericField(
        id,
        label,
        value,
        minimum,
        maximum,
        locked = false
    ) {
        return `
            <label class="adapt-settings-number-field">
                <span>${label}</span>
                <input
                    id="${id}"
                    type="number"
                    min="${minimum}"
                    max="${maximum}"
                    step="1"
                    value="${value}"
                    data-locked="${String(locked)}"
                >
                <small>${minimum}–${maximum}</small>
            </label>
        `;
    }

    function typographyCard(options) {
        return `
            <article class="adapt-settings-card">
                <h3>${options.title}</h3>
                <div class="adapt-settings-number-grid">
                    ${numericField(
                        options.stepId,
                        "Step",
                        options.step,
                        1,
                        50
                    )}
                    ${numericField(
                        options.minimumId,
                        "Minimum",
                        options.minimum,
                        options.minimumLimit,
                        100
                    )}
                    ${numericField(
                        options.maximumId,
                        "Maximum",
                        options.maximum,
                        100,
                        options.maximumLimit
                    )}
                </div>
                <p
                    id="${options.warningId}"
                    class="adapt-settings-warning"
                    ${options.showWarning ? "" : "hidden"}
                >${options.warning}</p>
            </article>
        `;
    }

    function lockMarkup(locked) {
        return locked
            ? '<span class="adapt-settings-lock" aria-hidden="true">🔒</span>'
            : "";
    }

    function renderHighlighterGrid(settings) {
        return ADAPT.highlighterColors
            .map((color) => {
                const locked =
                    color.premium &&
                    !settings.premiumUnlocked;
                const selected =
                    color.value.toLowerCase() ===
                    String(
                        settings.highlighterColor
                    ).toLowerCase();

                return `
                    <button
                        type="button"
                        class="adapt-color-circle${
                            selected
                                ? " adapt-settings-selected"
                                : ""
                        }"
                        data-action="select-highlighter-color"
                        data-value="${color.value}"
                        data-locked="${String(locked)}"
                        title="${escapeHTML(color.label)}"
                        aria-label="${escapeHTML(
                            color.label
                        )}${locked ? ", locked" : ""}"
                        aria-pressed="${String(selected)}"
                        style="--adapt-swatch-color: ${color.value};"
                    >${lockMarkup(locked)}</button>
                `;
            })
            .join("");
    }

    function renderNoteColors(settings) {
        return ADAPT.noteColors
            .map((color) => {
                const locked =
                    color.premium &&
                    !settings.premiumUnlocked;
                const selected =
                    color.id === settings.noteColor;

                return `
                    <button
                        type="button"
                        class="adapt-note-color-button${
                            selected
                                ? " adapt-settings-selected"
                                : ""
                        }"
                        data-action="select-note-color"
                        data-value="${color.id}"
                        data-locked="${String(locked)}"
                        aria-label="${color.label}${
                            locked ? ", locked" : ""
                        }"
                        aria-pressed="${String(selected)}"
                        style="--adapt-note-swatch: ${color.background};"
                    >
                        ${color.label}
                        ${lockMarkup(locked)}
                    </button>
                `;
            })
            .join("");
    }

    function renderVoiceOptions(selectedVoiceURI) {
        const voices =
            globalThis.ADAPTSpeak?.getVoices?.() || [];

        const options = [
            '<option value="default">Browser Recommended</option>',
            ...voices
                .sort((first, second) =>
                    `${first.lang} ${first.name}`.localeCompare(
                        `${second.lang} ${second.name}`
                    )
                )
                .map(
                    (voice) => `
                        <option
                            value="${escapeHTML(
                                voice.voiceURI
                            )}"
                        >
                            ${escapeHTML(voice.name)}
                            (${escapeHTML(voice.lang)})
                        </option>
                    `
                )
        ].join("");

        return options.replace(
            `value="${escapeHTML(
                selectedVoiceURI
            )}"`,
            `value="${escapeHTML(
                selectedVoiceURI
            )}" selected`
        );
    }

    function renderToolbarThemes(settings) {
        return Object.entries(
            ADAPT.toolbarThemes
        )
            .map(([value, theme]) => {
                const palette =
                    ADAPT.getToolbarPalette(value);
                const selected =
                    value === settings.toolbarColor;

                return `
                    <button
                        type="button"
                        class="adapt-toolbar-color-button${
                            selected
                                ? " adapt-settings-selected"
                                : ""
                        }"
                        data-action="select-toolbar-color"
                        data-value="${value}"
                        data-locked="${String(
                            !settings.premiumUnlocked
                        )}"
                        aria-pressed="${String(selected)}"
                    >
                        <span
                            class="adapt-toolbar-color-preview"
                            style="
                                --adapt-preview-background: ${palette.background};
                                --adapt-preview-text: ${palette.text};
                            "
                        >Aa</span>
                        <span>${theme.label}</span>
                        ${lockMarkup(
                            !settings.premiumUnlocked
                        )}
                    </button>
                `;
            })
            .join("");
    }

    function renderStickerPacks(settings) {
        const stickerPallet =
            globalThis.ADAPTStickerPallet;
        const palettes =
            stickerPallet?.getPalettes?.() || [];

        if (palettes.length === 0) {
            const failed =
                stickerPallet?.getStatus?.() ===
                "error";

            return `
                <p class="adapt-sticker-pallet-status">
                    ${
                        failed
                            ? "The sticker palettes could not be loaded."
                            : "Loading sticker palettes…"
                    }
                </p>
            `;
        }

        return palettes
            .map((pack) => {
                const selected =
                    pack.id ===
                    settings.selectedStickerPack;
                const firstSticker =
                    pack.stickers[0];

                return `
                    <div
                        class="adapt-sticker-pack-card${
                            selected
                                ? " adapt-settings-selected-pack"
                                : ""
                        }"
                        role="button"
                        tabindex="0"
                        data-action="select-sticker-pack"
                        data-pack-id="${pack.id}"
                        data-sticker-id="${firstSticker.id}"
                        data-locked="${String(
                            !settings.premiumUnlocked
                        )}"
                        aria-label="Use ${escapeHTML(
                            pack.name
                        )}"
                        aria-pressed="${String(
                            selected
                        )}"
                        style="--adapt-sticker-card-width: ${
                            pack.stickers.length * 42 + 44
                        }px;"
                    >
                        <div class="adapt-sticker-pack-heading">
                            <h3>${escapeHTML(
                                pack.name
                            )}</h3>
                            ${lockMarkup(
                                !settings.premiumUnlocked
                            )}
                        </div>
                        <div
                            class="adapt-sticker-pack-row"
                        >
                            ${pack.stickers
                                .map(
                                    (sticker) => `
                                        <img
                                            class="adapt-settings-sticker-image"
                                            src="${escapeHTML(
                                                stickerPallet.getStickerURL(
                                                    pack.id,
                                                    sticker.id
                                                )
                                            )}"
                                            alt=""
                                            title="${escapeHTML(
                                                sticker.name
                                            )}"
                                        >
                                    `
                                )
                                .join("")}
                        </div>
                    </div>
                `;
            })
            .join("");
    }

    function renderSettings() {
        if (!panelContent) {
            return;
        }

        const settings = getSettings();
        const premiumUnlocked =
            Boolean(settings.premiumUnlocked);

        panelContent.innerHTML = `
            <section class="adapt-settings-section">
                <div class="adapt-settings-section-heading">
                    <div>
                        <p class="adapt-settings-eyebrow">Free settings</p>
                        <h2>Typography</h2>
                    </div>
                </div>

                <div class="adapt-settings-card-grid">
                    ${typographyCard({
                        title: "Text Size",
                        stepId: "adapt-setting-size-step",
                        step: settings.sizeStep,
                        minimumId: "adapt-setting-min-size",
                        minimum: settings.minSize,
                        minimumLimit: 50,
                        maximumId: "adapt-setting-max-size",
                        maximum: settings.maxSize,
                        maximumLimit: 200,
                        warningId: "adapt-size-warning",
                        showWarning:
                            settings.maxSize > 150 ||
                            settings.minSize < 80,
                        warning: TYPOGRAPHY_WARNING
                    })}

                    <article class="adapt-settings-card">
                        <h3>Bold Text Size</h3>
                        <div class="adapt-settings-number-grid adapt-settings-single-number-grid">
                            ${numericField(
                                "adapt-setting-bold-size-increase",
                                "Increase (%)",
                                settings.boldSizeIncrease,
                                1,
                                50
                            )}
                        </div>
                        <p class="adapt-settings-description">
                            Enlarges bold text relative to the current text size.
                        </p>
                        <p
                            class="adapt-settings-warning"
                            ${
                                settings.boldSizeIncrease < 10 ||
                                settings.boldSizeIncrease > 25
                                    ? ""
                                    : "hidden"
                            }
                        >${BOLD_SIZE_WARNING}</p>
                    </article>

                    ${typographyCard({
                        title: "Letter Spacing",
                        stepId: "adapt-setting-spacing-step",
                        step: settings.spacingStep,
                        minimumId: "adapt-setting-min-spacing",
                        minimum: settings.minSpacing,
                        minimumLimit: 25,
                        maximumId: "adapt-setting-max-spacing",
                        maximum: settings.maxSpacing,
                        maximumLimit: 300,
                        warningId: "adapt-spacing-warning",
                        showWarning:
                            settings.maxSpacing > 200 ||
                            settings.minSpacing < 50,
                        warning: SPACING_WARNING
                    })}

                    ${typographyCard({
                        title: "Line Spacing",
                        stepId: "adapt-setting-leading-step",
                        step: settings.leadingStep,
                        minimumId: "adapt-setting-min-leading",
                        minimum: settings.minLeading,
                        minimumLimit: 50,
                        maximumId: "adapt-setting-max-leading",
                        maximum: settings.maxLeading,
                        maximumLimit: 300,
                        warningId: "adapt-leading-warning",
                        showWarning:
                            settings.maxLeading > 200 ||
                            settings.minLeading < 80,
                        warning: LEADING_WARNING
                    })}
                </div>
            </section>

            <section class="adapt-settings-section">
                <div class="adapt-settings-section-heading">
                    <div>
                        <p class="adapt-settings-eyebrow">Free settings</p>
                        <h2>Underline</h2>
                    </div>
                </div>

                <div class="adapt-settings-inline-controls">
                    ${numericField(
                        "adapt-setting-underline-thickness",
                        "Underline thickness (px)",
                        settings.underlineThickness,
                        1,
                        10
                    )}
                </div>
            </section>

            <section class="adapt-settings-section">
                <div class="adapt-settings-section-heading">
                    <div>
                        <p class="adapt-settings-eyebrow">Free settings</p>
                        <h2>Line Guide</h2>
                    </div>
                </div>

                <div class="adapt-settings-inline-controls">
                    <label class="adapt-settings-toggle-row">
                        <input
                            id="adapt-setting-line-blur"
                            type="checkbox"
                            ${
                                settings.lineGuideBlurEnabled
                                    ? "checked"
                                    : ""
                            }
                        >
                        <span>Blur below line guide</span>
                    </label>

                    ${numericField(
                        "adapt-setting-line-thickness",
                        "Line thickness (px)",
                        settings.lineGuideThickness,
                        1,
                        5
                    )}
                </div>
            </section>

            <section class="adapt-settings-section adapt-premium-section">

                <div class="adapt-settings-two-column">
                    <article class="adapt-settings-card">
                        <div class="adapt-settings-card-heading">
                            <h3>Line Guide Color</h3>
                            ${lockMarkup(!premiumUnlocked)}
                        </div>
                        <label class="adapt-color-picker-row">
                            <input
                                id="adapt-setting-line-color"
                                type="color"
                                value="${escapeHTML(
                                    settings.lineGuideColor
                                )}"
                                data-locked="${String(
                                    !premiumUnlocked
                                )}"
                            >
                            <span>${escapeHTML(
                                settings.lineGuideColor
                            )}</span>
                        </label>
                    </article>

                    <article class="adapt-settings-card">
                        <div class="adapt-settings-card-heading">
                            <h3>Speak Voice</h3>
                            ${lockMarkup(!premiumUnlocked)}
                        </div>
                        <select
                            id="adapt-setting-speech-voice"
                            data-locked="${String(
                                !premiumUnlocked
                            )}"
                        >
                            ${renderVoiceOptions(
                                settings.speechVoiceURI
                            )}
                        </select>
                    </article>
                </div>

                <article class="adapt-settings-card adapt-wide-card">
                    <div class="adapt-settings-card-heading">
                        <h3>Toolbar Color</h3>
                        ${lockMarkup(!premiumUnlocked)}
                    </div>
                    <div class="adapt-toolbar-color-grid">
                        ${renderToolbarThemes(settings)}
                    </div>
                </article>
            </section>

            <section class="adapt-settings-section adapt-premium-section">
                <div class="adapt-settings-section-heading">
                    <div>
                        <p class="adapt-settings-eyebrow">Premium settings</p>
                        <h2>Stickers</h2>
                    </div>
                    ${lockMarkup(!premiumUnlocked)}
                </div>
                <p class="adapt-settings-description">
                    Choose the pack that appears when the toolbar sticker button is opened.
                </p>

                <article class="adapt-settings-card adapt-sticker-size-card">
                    <div class="adapt-settings-card-heading">
                        <h3>Sticker Size</h3>
                        ${lockMarkup(!premiumUnlocked)}
                    </div>
                    <div class="adapt-settings-number-grid adapt-settings-single-number-grid">
                        ${numericField(
                            "adapt-setting-sticker-size",
                            "Size (px)",
                            settings.stickerSize,
                            10,
                            100,
                            !premiumUnlocked
                        )}
                    </div>
                </article>

                <div class="adapt-sticker-pack-grid">
                    ${renderStickerPacks(settings)}
                </div>
            </section>

            ${
                statusMessage
                    ? `<p class="adapt-settings-status">${escapeHTML(
                          statusMessage
                      )}</p>`
                    : ""
            }
        `;
    }

    function createInterface() {
        if (overlay) {
            return;
        }

        const style = document.createElement("style");
        style.textContent = `
            .adapt-settings-overlay,
            .adapt-purchase-overlay {
                position: fixed;
                inset: 0;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 24px;
                background:
                    ${ADAPT.colors.overlayScrim};
                z-index: 2147483647;
                font-family:
                    Arial,
                    Helvetica,
                    sans-serif;
            }

            .adapt-settings-overlay[hidden],
            .adapt-purchase-overlay[hidden] {
                display: none;
            }

            .adapt-settings-panel,
            .adapt-purchase-panel {
                width: min(820px, calc(100vw - 32px));
                max-height: min(840px, calc(100vh - 32px));
                display: flex;
                flex-direction: column;
                overflow: hidden;
                color:
                    var(
                        --adapt-toolbar-text,
                        ${ADAPT.textColor}
                    );
                background:
                    var(
                        --adapt-toolbar-bg,
                        ${ADAPT.bgColor}
                    );
                border:
                    1px solid
                    var(
                        --adapt-toolbar-border,
                        ${ADAPT.borderColor}
                    );
                border-radius: 14px;
                box-shadow:
                    0 24px 70px
                    ${ADAPT.colors.shadowHeavy};
            }

            .adapt-purchase-panel {
                width: min(520px, calc(100vw - 32px));
            }

            .adapt-settings-header,
            .adapt-purchase-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 16px;
                padding: 16px 18px;
                border-bottom:
                    1px solid
                    var(
                        --adapt-toolbar-border,
                        ${ADAPT.borderColor}
                    );
            }

            .adapt-settings-header h1,
            .adapt-purchase-header h2 {
                margin: 0;
                font-size: 20px;
                line-height: 1.2;
            }

            .adapt-settings-close,
            .adapt-purchase-close {
                width: 32px;
                height: 32px;
                display: grid;
                place-items: center;
                padding: 0;
                color: inherit;
                background:
                    ${ADAPT.colors.transparent};
                border: 0;
                border-radius: 7px;
                cursor: pointer;
                font-size: 24px;
                line-height: 1;
            }

            .adapt-settings-close:hover,
            .adapt-purchase-close:hover {
                background:
                    var(
                        --adapt-toolbar-hover,
                        ${ADAPT.hoverColor}
                    );
            }

            .adapt-settings-content,
            .adapt-purchase-content {
                overflow: auto;
                padding: 18px;
            }

            .adapt-settings-section + .adapt-settings-section {
                margin-top: 24px;
                padding-top: 24px;
                border-top:
                    1px solid
                    var(
                        --adapt-toolbar-border,
                        ${ADAPT.borderColor}
                    );
            }

            .adapt-settings-section-heading,
            .adapt-settings-card-heading,
            .adapt-sticker-pack-heading {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 12px;
            }

            .adapt-settings-section-heading {
                margin-bottom: 12px;
            }

            .adapt-settings-section h2,
            .adapt-settings-card h3,
            .adapt-sticker-pack-card h3 {
                margin: 0;
            }

            .adapt-settings-section h2 {
                font-size: 18px;
            }

            .adapt-settings-card h3,
            .adapt-sticker-pack-card h3 {
                font-size: 14px;
            }

            .adapt-settings-eyebrow {
                margin: 0 0 4px;
                color:
                    ${ADAPT.colors.blue700};
                font-size: 11px;
                font-weight: 700;
                letter-spacing: 0.06em;
                text-transform: uppercase;
            }

            .adapt-settings-card-grid {
                display: grid;
                grid-template-columns:
                    repeat(3, minmax(0, 1fr));
                gap: 12px;
            }

            .adapt-settings-card,
            .adapt-sticker-pack-card {
                padding: 14px;
                background:
                    var(
                        --adapt-toolbar-input,
                        ${ADAPT.inputColor}
                    );
                border:
                    1px solid
                    var(
                        --adapt-toolbar-border,
                        ${ADAPT.borderColor}
                    );
                border-radius: 10px;
            }

            .adapt-wide-card {
                margin-top: 12px;
            }

            .adapt-settings-number-grid {
                display: grid;
                grid-template-columns:
                    repeat(3, minmax(0, 1fr));
                gap: 8px;
                margin-top: 12px;
            }

            .adapt-settings-single-number-grid {
                grid-template-columns: minmax(0, 1fr);
            }

            .adapt-settings-number-field {
                display: grid;
                gap: 5px;
                font-size: 11px;
                font-weight: 700;
            }

            .adapt-settings-number-field input,
            .adapt-settings-card select {
                width: 100%;
                min-width: 0;
                padding: 7px 8px;
                color: inherit;
                background:
                    var(
                        --adapt-toolbar-bg,
                        ${ADAPT.bgColor}
                    );
                border:
                    1px solid
                    var(
                        --adapt-toolbar-border,
                        ${ADAPT.borderColor}
                    );
                border-radius: 7px;
            }

            .adapt-settings-number-field small {
                opacity: 0.66;
                font-size: 9px;
                font-weight: 400;
            }

            .adapt-settings-warning {
                margin: 10px 0 0;
                color:
                    ${ADAPT.colors.red700};
                font-size: 11px;
                line-height: 1.4;
            }

            .adapt-settings-warning[hidden] {
                display: none;
            }

            .adapt-settings-inline-controls,
            .adapt-settings-two-column {
                display: grid;
                grid-template-columns:
                    repeat(2, minmax(0, 1fr));
                gap: 12px;
            }

            .adapt-settings-toggle-row {
                display: flex;
                align-items: center;
                gap: 10px;
                padding: 12px 14px;
                background:
                    var(
                        --adapt-toolbar-input,
                        ${ADAPT.inputColor}
                    );
                border:
                    1px solid
                    var(
                        --adapt-toolbar-border,
                        ${ADAPT.borderColor}
                    );
                border-radius: 10px;
                font-size: 13px;
                font-weight: 700;
            }

            .adapt-settings-description {
                margin: 5px 0 10px;
                opacity: 0.72;
                font-size: 12px;
                line-height: 1.45;
            }

            .adapt-premium-status-button,
            .adapt-purchase-cancel,
            .adapt-purchase-confirm {
                padding: 8px 12px;
                color: inherit;
                background:
                    var(
                        --adapt-toolbar-hover,
                        ${ADAPT.hoverColor}
                    );
                border:
                    1px solid
                    var(
                        --adapt-toolbar-border,
                        ${ADAPT.borderColor}
                    );
                border-radius: 8px;
                cursor: pointer;
                font-weight: 700;
            }

            .adapt-premium-status-button:disabled {
                cursor: default;
                opacity: 0.74;
            }

            .adapt-highlighter-color-grid {
                display: grid;
                grid-template-columns:
                    repeat(8, 30px);
                gap: 10px;
            }

            .adapt-color-circle {
                position: relative;
                width: 30px;
                height: 30px;
                padding: 0;
                background:
                    var(--adapt-swatch-color);
                border:
                    2px solid
                    var(
                        --adapt-toolbar-border,
                        ${ADAPT.borderColor}
                    );
                border-radius: 50%;
                cursor: pointer;
            }

            .adapt-settings-lock {
                font-family:
                    Arial,
                    Helvetica,
                    sans-serif;
                font-size: 10px;
                line-height: 1;
            }

            .adapt-color-circle .adapt-settings-lock {
                position: absolute;
                inset: 0;
                display: grid;
                place-items: center;
            }

            .adapt-settings-selected {
                outline:
                    3px solid
                    ${ADAPT.selectedToolColor};
                outline-offset: 2px;
            }

            .adapt-note-color-row {
                display: flex;
                flex-wrap: wrap;
                gap: 9px;
                margin-top: 10px;
            }

            .adapt-note-color-button {
                min-width: 82px;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 6px;
                padding: 9px 11px;
                color:
                    ${ADAPT.colors.nearBlack};
                background:
                    var(--adapt-note-swatch);
                border:
                    1px solid
                    var(
                        --adapt-toolbar-border,
                        ${ADAPT.borderColor}
                    );
                border-radius: 999px;
                cursor: pointer;
                font-weight: 700;
            }

            .adapt-color-picker-row {
                display: flex;
                align-items: center;
                gap: 10px;
                margin-top: 10px;
                font-size: 12px;
            }

            .adapt-color-picker-row input {
                width: 54px;
                height: 34px;
                padding: 2px;
                border:
                    1px solid
                    var(
                        --adapt-toolbar-border,
                        ${ADAPT.borderColor}
                    );
                border-radius: 7px;
                cursor: pointer;
            }

            .adapt-toolbar-color-grid {
                display: grid;
                grid-template-columns:
                    repeat(3, minmax(0, 1fr));
                gap: 9px;
                margin-top: 10px;
            }

            .adapt-toolbar-color-button {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 8px;
                color: inherit;
                background:
                    ${ADAPT.colors.transparent};
                border:
                    1px solid
                    var(
                        --adapt-toolbar-border,
                        ${ADAPT.borderColor}
                    );
                border-radius: 8px;
                cursor: pointer;
                text-align: left;
            }

            .adapt-toolbar-color-preview {
                width: 34px;
                height: 28px;
                display: grid;
                flex: 0 0 auto;
                place-items: center;
                color:
                    var(--adapt-preview-text);
                background:
                    var(--adapt-preview-background);
                border-radius: 6px;
                font-weight: 700;
            }

            .adapt-sticker-pack-grid {
                display: flex;
                flex-wrap: wrap;
                align-items: stretch;
                gap: 12px;
            }

            .adapt-sticker-size-card {
                width: min(220px, 100%);
                box-sizing: border-box;
                margin: 0 0 12px;
            }

            .adapt-settings-selected-pack {
                border-color:
                    ${ADAPT.selectedToolColor};
            }

            .adapt-sticker-pack-card {
                min-width: min(
                    100%,
                    var(--adapt-sticker-card-width)
                );
                flex: 1 1
                    var(--adapt-sticker-card-width);
                max-width: 100%;
                box-sizing: border-box;
                cursor: pointer;
            }

            .adapt-sticker-pack-card:hover {
                background:
                    var(
                        --adapt-toolbar-hover,
                        ${ADAPT.hoverColor}
                    );
            }

            .adapt-sticker-pack-card:focus-visible {
                outline:
                    3px solid
                    ${ADAPT.selectedToolColor};
                outline-offset: 2px;
            }

            .adapt-sticker-pack-row {
                display: grid;
                grid-template-columns:
                    repeat(auto-fit, 36px);
                align-items: center;
                gap: 6px;
                width: 100%;
                box-sizing: border-box;
                margin: 12px 0 0;
                padding: 7px;
                background:
                    var(
                        --adapt-toolbar-menu,
                        ${ADAPT.menuColor}
                    );
                border:
                    1px solid
                    var(
                        --adapt-toolbar-border,
                        ${ADAPT.borderColor}
                    );
                border-radius: 9px;
            }

            .adapt-settings-sticker-image {
                width: 36px;
                height: 36px;
                display: block;
                flex: 0 0 auto;
                object-fit: contain;
                pointer-events: none;
                user-select: none;
                -webkit-user-drag: none;
            }

            .adapt-sticker-pallet-status {
                grid-column: 1 / -1;
                margin: 0;
                padding: 14px;
                color:
                    var(
                        --adapt-toolbar-text,
                        ${ADAPT.textColor}
                    );
            }

            .adapt-settings-status {
                margin: 18px 0 0;
                padding: 10px 12px;
                color:
                    ${ADAPT.colors.green800};
                background:
                    ${ADAPT.colors.green050};
                border-radius: 8px;
                font-size: 12px;
            }

            .adapt-purchase-content {
                font-size: 14px;
                line-height: 1.5;
            }

            .adapt-purchase-content ul {
                margin: 10px 0 0;
                padding-left: 22px;
            }

            .adapt-purchase-actions {
                display: flex;
                justify-content: space-between;
                gap: 12px;
                padding: 14px 18px;
                border-top:
                    1px solid
                    var(
                        --adapt-toolbar-border,
                        ${ADAPT.borderColor}
                    );
            }

            .adapt-purchase-confirm {
                color:
                    ${ADAPT.colors.nearBlack};
                background:
                    ${ADAPT.colors.blueSelectedLight};
            }

            @media (max-width: 720px) {
                .adapt-settings-card-grid {
                    grid-template-columns: 1fr;
                }

                .adapt-sticker-pack-card {
                    min-width: 100%;
                    flex-basis: 100%;
                }

                .adapt-toolbar-color-grid {
                    grid-template-columns:
                        repeat(2, minmax(0, 1fr));
                }

                .adapt-highlighter-color-grid {
                    grid-template-columns:
                        repeat(6, 30px);
                }
            }
        `;

        overlay = document.createElement("div");
        overlay.className = "adapt-settings-overlay";
        overlay.hidden = true;
        overlay.innerHTML = `
            <section
                class="adapt-settings-panel"
                role="dialog"
                aria-modal="true"
                aria-labelledby="adapt-settings-title"
            >
                <header class="adapt-settings-header">
                    <h1 id="adapt-settings-title">A.D.A.P.T. Settings</h1>
                    <button
                        type="button"
                        class="adapt-settings-close"
                        data-action="close-settings"
                        aria-label="Close settings"
                    >×</button>
                </header>
                <div class="adapt-settings-content"></div>
            </section>
        `;

        purchaseOverlay = document.createElement("div");
        purchaseOverlay.className =
            "adapt-purchase-overlay";
        purchaseOverlay.hidden = true;
        purchaseOverlay.innerHTML = `
            <section
                class="adapt-purchase-panel"
                role="dialog"
                aria-modal="true"
                aria-labelledby="adapt-purchase-title"
            >
                <header class="adapt-purchase-header">
                    <h2 id="adapt-purchase-title">Unlock A.D.A.P.T. Premium</h2>
                    <button
                        type="button"
                        class="adapt-purchase-close"
                        data-action="close-purchase"
                        aria-label="Close purchase window"
                    >×</button>
                </header>
                <div class="adapt-purchase-content">
                    <p>Premium adds:</p>
                    <ul>
                        <li>All 25 web-font choices and custom .ttf uploads</li>
                        <li>The complete highlighter and underline color grids</li>
                        <li>Orange, pink, green, and blue sticky notes</li>
                        <li>A custom line-guide color selector</li>
                        <li>Default speech voice selection</li>
                        <li>Custom toolbar colors</li>
                        <li>Sticker packs and page sticker placement</li>
                    </ul>
                    <p>This prototype purchase only unlocks the features locally. No payment is processed.</p>
                </div>
                <footer class="adapt-purchase-actions">
                    <button
                        type="button"
                        class="adapt-purchase-cancel"
                        data-action="close-purchase"
                    >Cancel</button>
                    <button
                        type="button"
                        class="adapt-purchase-confirm"
                        data-action="purchase"
                    >Purchase</button>
                </footer>
            </section>
        `;

        uploadInput = document.createElement("input");
        uploadInput.type = "file";
        uploadInput.accept = ".ttf,font/ttf";
        uploadInput.hidden = true;
        uploadInput.setAttribute(
            "aria-label",
            "Upload a TTF font"
        );

        panelContent = overlay.querySelector(
            ".adapt-settings-content"
        );

        adaptShadow.append(
            style,
            overlay,
            purchaseOverlay,
            uploadInput
        );

        overlay.addEventListener(
            "click",
            handleClick
        );
        overlay.addEventListener(
            "change",
            handleChange
        );
        overlay.addEventListener(
            "keydown",
            handleStickerPackKeydown
        );
        purchaseOverlay.addEventListener(
            "click",
            handleClick
        );
        uploadInput.addEventListener(
            "change",
            handleFontUpload
        );
    }

    function open(options = {}) {
        createInterface();

        if (!options.preserveStatus) {
            statusMessage = "";
        }

        renderSettings();
        overlay.hidden = false;

        globalThis.ADAPTStickerPallet
            ?.load?.()
            .then(() => {
                if (!overlay.hidden) {
                    renderSettings();
                }
            });

        overlay
            .querySelector(".adapt-settings-close")
            ?.focus();
    }

    function close() {
        if (!overlay) {
            return;
        }

        overlay.hidden = true;
        closePurchase();
    }

    function openPurchase() {
        createInterface();
        purchaseOverlay.hidden = false;
        purchaseOverlay
            .querySelector(".adapt-purchase-close")
            ?.focus();
    }

    function closePurchase() {
        if (purchaseOverlay) {
            purchaseOverlay.hidden = true;
        }
    }

    function chooseFontUpload() {
        const settings = getSettings();

        if (!settings.premiumUnlocked) {
            openPurchase();
            return;
        }

        uploadInput.value = "";
        uploadInput.click();
    }

    async function handleFontUpload() {
        const file = uploadInput.files?.[0];

        if (!file) {
            return;
        }

        if (!file.name.toLowerCase().endsWith(".ttf")) {
            statusMessage =
                "Only .ttf font files can be uploaded.";
            open({ preserveStatus: true });
            return;
        }

        try {
            const dataUrl = await new Promise(
                (resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () =>
                        resolve(reader.result);
                    reader.onerror = () =>
                        reject(reader.error);
                    reader.readAsDataURL(file);
                }
            );
            const record = {
                name: file.name.replace(/\.ttf$/i, ""),
                dataUrl,
                updatedAt: Date.now()
            };

            await chrome.storage.local.set({
                [UPLOADED_FONT_KEY]: record
            });
            await globalThis.ADAPTFont?.loadUploadedFont?.(
                record
            );
            await updateSettings({
                font: "uploadFont"
            });

            statusMessage =
                `${record.name} was uploaded and selected.`;
            open({ preserveStatus: true });
        } catch (error) {
            console.error(
                "[ADAPT] Could not upload the font:",
                error
            );
            statusMessage =
                "The font could not be uploaded.";
            open({ preserveStatus: true });
        }
    }

    function readNumber(target) {
        const minimum = Number(target.min);
        const maximum = Number(target.max);
        const value = Number(target.value);

        return Math.min(
            Math.max(
                Number.isFinite(value)
                    ? value
                    : minimum,
                minimum
            ),
            maximum
        );
    }

    async function handleChange(event) {
        const target = event.target;

        if (!(target instanceof HTMLElement)) {
            return;
        }

        if (
            target.dataset.locked === "true"
        ) {
            renderSettings();
            openPurchase();
            return;
        }

        const numberSettings = {
            "adapt-setting-size-step": "sizeStep",
            "adapt-setting-min-size": "minSize",
            "adapt-setting-max-size": "maxSize",
            "adapt-setting-bold-size-increase":
                "boldSizeIncrease",
            "adapt-setting-underline-thickness":
                "underlineThickness",
            "adapt-setting-spacing-step":
                "spacingStep",
            "adapt-setting-min-spacing":
                "minSpacing",
            "adapt-setting-max-spacing":
                "maxSpacing",
            "adapt-setting-leading-step":
                "leadingStep",
            "adapt-setting-min-leading":
                "minLeading",
            "adapt-setting-max-leading":
                "maxLeading",
            "adapt-setting-line-thickness":
                "lineGuideThickness",
            "adapt-setting-sticker-size":
                "stickerSize"
        };

        if (numberSettings[target.id]) {
            await updateSettings({
                [numberSettings[target.id]]:
                    readNumber(target)
            });
            renderSettings();
            return;
        }

        if (
            target.id ===
            "adapt-setting-line-blur"
        ) {
            await updateSettings({
                lineGuideBlurEnabled:
                    target.checked
            });
            renderSettings();
            return;
        }

        if (
            target.id ===
            "adapt-setting-line-color"
        ) {
            await updateSettings({
                lineGuideColor: target.value
            });
            renderSettings();
            return;
        }

        if (
            target.id ===
            "adapt-setting-speech-voice"
        ) {
            await updateSettings({
                speechVoiceURI: target.value
            });
            renderSettings();
        }
    }

    function handleStickerPackKeydown(event) {
        const stickerPack =
            event.target.closest?.(
                ".adapt-sticker-pack-card[data-action='select-sticker-pack']"
            );

        if (
            !stickerPack ||
            (
                event.key !== "Enter" &&
                event.key !== " "
            )
        ) {
            return;
        }

        event.preventDefault();
        stickerPack.click();
    }

    async function handleClick(event) {
        const actionTarget =
            event.target.closest?.("[data-action]");

        if (!actionTarget) {
            return;
        }

        const action =
            actionTarget.dataset.action;

        if (
            actionTarget.dataset.locked ===
            "true"
        ) {
            openPurchase();
            return;
        }

        switch (action) {
            case "close-settings":
                close();
                break;

            case "open-purchase":
                openPurchase();
                break;

            case "close-purchase":
                closePurchase();
                break;

            case "purchase":
                await updateSettings({
                    premiumUnlocked: true
                });
                closePurchase();
                renderSettings();
                window.dispatchEvent(
                    new CustomEvent(
                        "adapt-premium-changed"
                    )
                );
                break;

            case "select-highlighter-color":
                await updateSettings({
                    highlighterColor:
                        actionTarget.dataset.value
                });
                renderSettings();
                break;

            case "select-note-color":
                await updateSettings({
                    noteColor:
                        actionTarget.dataset.value
                });
                renderSettings();
                break;

            case "select-toolbar-color":
                await updateSettings({
                    toolbarColor:
                        actionTarget.dataset.value
                });
                renderSettings();
                break;

            case "select-sticker-pack":
                await updateSettings({
                    selectedStickerPack:
                        actionTarget.dataset.packId,
                    selectedStickerId:
                        actionTarget.dataset.stickerId
                });
                renderSettings();
                break;

            default:
                break;
        }
    }

    document.addEventListener(
        "keydown",
        (event) => {
            if (event.key !== "Escape") {
                return;
            }

            if (
                purchaseOverlay &&
                !purchaseOverlay.hidden
            ) {
                closePurchase();
                return;
            }

            if (overlay && !overlay.hidden) {
                close();
            }
        },
        true
    );

    createInterface();

    globalThis.ADAPTSettings = Object.freeze({
        open,
        close,
        openPurchase,
        closePurchase,
        chooseFontUpload,
        refresh: renderSettings
    });
})();