// Toolbar behavior, saved settings, and extension-wide active state.
(function initializeADAPTToolbar() {
    "use strict";

    const activeButtons = new Set();

    const alterationButtonIds = new Set([
        "adapt-bold",
        "adapt-italic",
        "adapt-underline"
    ]);

    let currentPalette =
        ADAPT.getToolbarPalette("system");

    let settings = {
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
        removeBold: false,
        removeItalics: false,
        removeUnderline: false,
        highlightEnabled: false,
        highlighterColor:
            ADAPT.colors.yellowDefault,
        lineGuideEnabled: false,
        lineGuideYRatio: 0.5,
        lineGuideBlurEnabled: true,
        lineGuideThickness: 2,
        lineGuideColor: ADAPT.lineColor,
        noteEnabled: false,
        noteColor: "yellow",
        speechVoiceURI: "default",
        toolbarColor: "system",
        stickerEnabled: false,
        selectedStickerPack: "text-annotation",
        selectedStickerId: "question"
    };

    let isApplyingSettings = false;
    let globalSettingsWriteQueue = Promise.resolve();
    let pendingGlobalSettingsPatch = {};
    let pendingGlobalSettingsWrites = 0;

    function getToolbarElement(elementId) {
        return adaptShadow.getElementById(elementId);
    }

    const dropdownButton = getToolbarElement(
        "adapt-dropdown-btn"
    );

    const dropdownMenu = getToolbarElement(
        "adapt-dropdown-menu"
    );

    const dropdownArrow = getToolbarElement(
        "adapt-dropdown-icon"
    );

    const dropdownLabel = getToolbarElement(
        "adapt-dropdown-label"
    );

    const logo = getToolbarElement("adapt-logo");

    const highlighterButton = getToolbarElement(
        "adapt-highlight"
    );

    const highlighterMenu = getToolbarElement(
        "adapt-highlight-menu"
    );

    const noteButton = getToolbarElement(
        "adapt-note"
    );

    const noteMenu = getToolbarElement(
        "adapt-note-menu"
    );

    const stickerButton = getToolbarElement(
        "adapt-sticker"
    );

    const stickerMenu = getToolbarElement(
        "adapt-sticker-menu"
    );

    const stickerLock = getToolbarElement(
        "adapt-sticker-lock"
    );

    function getSelectedButtonColor(buttonId) {
        if (alterationButtonIds.has(buttonId)) {
            return currentPalette.selectedAlterationColor;
        }

        return currentPalette.selectedToolColor;
    }

    function renderButton(buttonId) {
        const button = getToolbarElement(buttonId);

        if (!button) {
            return;
        }

        const isSelected =
            activeButtons.has(buttonId);

        button.style.background = isSelected
            ? getSelectedButtonColor(buttonId)
            : ADAPT.colors.transparent;

        button.setAttribute(
            "aria-pressed",
            String(isSelected)
        );
    }

    function setButtonActive(
        buttonId,
        isActive
    ) {
        if (isActive) {
            activeButtons.add(buttonId);
        } else {
            activeButtons.delete(buttonId);
        }

        renderButton(buttonId);
    }

    function syncSavedButtonStates() {
        setButtonActive(
            "adapt-bold",
            settings.removeBold
        );

        setButtonActive(
            "adapt-italic",
            settings.removeItalics
        );

        setButtonActive(
            "adapt-underline",
            settings.removeUnderline
        );

        setButtonActive(
            "adapt-highlight",
            settings.highlightEnabled
        );

        setButtonActive(
            "adapt-line-guide",
            settings.lineGuideEnabled
        );

        setButtonActive(
            "adapt-note",
            settings.noteEnabled
        );

        setButtonActive(
            "adapt-sticker",
            settings.stickerEnabled
        );
    }

    function applyTypography() {
        if (isApplyingSettings) {
            return;
        }

        globalThis.ADAPTTypography.apply({
            enabled: settings.isActive,
            size,
            leading,
            spacing
        });
    }

    function applyFontSetting() {
        const fontObject =
            ADAPT.getFont(settings.font);

        const safeFont =
            fontObject.premium &&
            !settings.premiumUnlocked
                ? ADAPT.getFont("page-default")
                : fontObject;

        settings.font = safeFont.value;

        changeFont(
            safeFont.value,
            safeFont
        );

        dropdownLabel.textContent =
            safeFont.upload &&
            globalThis.ADAPTFont?.getUploadedFontName?.()
                ? globalThis.ADAPTFont.getUploadedFontName()
                : safeFont.label;

        dropdownLabel.style.fontFamily =
            safeFont.value === "page-default"
                ? "inherit"
                : safeFont.family;
    }

    function applyToolRuntime() {
        globalThis.ADAPTHighlighter?.setSelectedColor(
            settings.highlighterColor
        );

        globalThis.ADAPTNote?.setSelectedColor(
            settings.noteColor
        );

        globalThis.ADAPTSpeak?.setPreferredVoice(
            settings.speechVoiceURI
        );

        globalThis.ADAPTSticker?.setSelection(
            settings.selectedStickerPack,
            settings.selectedStickerId
        );

        toggleHighlight(
            settings.isActive &&
                settings.highlightEnabled
        );

        globalThis.ADAPTNote?.toggle(
            settings.isActive &&
                settings.noteEnabled
        );

        toggleLineGuide(
            settings.isActive &&
                settings.lineGuideEnabled,
            {
                yRatio: settings.lineGuideYRatio,
                blurEnabled:
                    settings.lineGuideBlurEnabled,
                thickness:
                    settings.lineGuideThickness,
                color: settings.lineGuideColor
            }
        );

        globalThis.ADAPTSticker?.toggle(
            settings.isActive &&
                settings.premiumUnlocked &&
                settings.stickerEnabled
        );

        globalThis.ADAPTSpeak?.toggle(
            settings.isActive &&
                activeButtons.has(
                    "adapt-speak"
                )
        );

        globalThis.ADAPTDefine?.toggle(
            settings.isActive &&
                activeButtons.has(
                    "adapt-define"
                )
        );
    }

    function applyAllSettings() {
        isApplyingSettings = true;

        currentPalette =
            globalThis.ADAPTLayout.applyToolbarPalette(
                settings.toolbarColor
            );

        applyToolbarAppearance();
        refreshFontDropdown();
        renderHighlighterMenu();
        renderNoteMenu();
        renderStickerMenu();

        document.documentElement.classList.toggle(
            "adapt-extension-active",
            settings.isActive
        );

        applyFontSetting();

        toggleBold(
            settings.removeBold
        );

        toggleItalics(
            settings.removeItalics
        );

        toggleUnderline(
            settings.removeUnderline
        );

        configureSizeControl({
            step: settings.sizeStep,
            minimum: settings.minSize,
            maximum: settings.maxSize
        });

        configureLeadingControl({
            step: settings.leadingStep,
            minimum: settings.minLeading,
            maximum: settings.maxLeading
        });

        configureSpacingControl({
            step: settings.spacingStep,
            minimum: settings.minSpacing,
            maximum: settings.maxSpacing
        });

        applySize(settings.size);
        applyLeading(settings.leading);
        applySpacing(settings.spacing);

        isApplyingSettings = false;

        applyTypography();
        applyToolRuntime();
        syncSavedButtonStates();

        if (!settings.highlightEnabled) {
            closeHighlighterMenu();
        }

        if (!settings.noteEnabled) {
            closeNoteMenu();
        }

        logo.src = settings.isActive
            ? logoSrc
            : logoInactiveSrc;

        logo.setAttribute(
            "aria-pressed",
            String(settings.isActive)
        );

        logo.title = settings.isActive
            ? "Temporarily hide A.D.A.P.T. page changes"
            : "Reapply A.D.A.P.T. page changes";

        stickerLock.style.display =
            settings.premiumUnlocked
                ? "none"
                : "grid";

        stickerButton.setAttribute(
            "aria-disabled",
            String(!settings.premiumUnlocked)
        );

        globalThis.ADAPTLayout.setToolbarHidden(
            settings.toolbarHidden
        );
    }

    function normalizeLocalConflicts(
        nextSettings
    ) {
        const normalized = {
            ...nextSettings
        };

        if (
            normalized.highlightEnabled &&
            normalized.noteEnabled
        ) {
            normalized.noteEnabled = false;
        }

        if (normalized.highlightEnabled) {
            normalized.noteEnabled = false;
            normalized.stickerEnabled = false;
        }

        if (normalized.noteEnabled) {
            normalized.highlightEnabled = false;
            normalized.stickerEnabled = false;
        }

        if (normalized.stickerEnabled) {
            normalized.highlightEnabled = false;
            normalized.noteEnabled = false;
        }

        return normalized;
    }

    async function updateGlobalSetting(
        patch,
        options = {}
    ) {
        settings = normalizeLocalConflicts({
            ...settings,
            ...patch
        });

        if (options.apply) {
            applyAllSettings();
        }

        pendingGlobalSettingsPatch = {
            ...pendingGlobalSettingsPatch,
            ...patch
        };

        pendingGlobalSettingsWrites += 1;

        const persistPatch = () =>
            globalThis.ADAPTStorage.updateGlobal(
                patch
            );

        const pendingWrite =
            globalSettingsWriteQueue.then(
                persistPatch,
                persistPatch
            );

        globalSettingsWriteQueue =
            pendingWrite.catch(() => {});

        try {
            await pendingWrite;
        } catch (error) {
            console.error(
                "[ADAPT] Could not save toolbar settings:",
                error
            );
        } finally {
            pendingGlobalSettingsWrites -= 1;

            if (pendingGlobalSettingsWrites === 0) {
                pendingGlobalSettingsPatch = {};
            }
        }
    }

    function saveAndApply(patch) {
        updateGlobalSetting(
            patch,
            {
                apply: true
            }
        );
    }

    function applyToolbarAppearance() {
        toolbar
            .querySelectorAll("button")
            .forEach((button) => {
                button.style.color =
                    currentPalette.text;
            });

        toolbar
            .querySelectorAll("input")
            .forEach((input) => {
                input.style.background =
                    currentPalette.input;

                input.style.color =
                    currentPalette.text;

                input.style.border =
                    `1px solid ${currentPalette.border}`;
            });

        dropdownMenu.style.background =
            currentPalette.menu;

        highlighterMenu.style.background =
            currentPalette.menu;

        highlighterMenu.style.borderColor =
            currentPalette.border;

        noteMenu.style.background =
            currentPalette.menu;

        noteMenu.style.borderColor =
            currentPalette.border;

        stickerMenu.style.background =
            currentPalette.menu;

        stickerMenu.style.borderColor =
            currentPalette.border;
    }

    function styleFontDropdownItems() {
        dropdownMenu
            .querySelectorAll(
                ".adapt-dropdown-item"
            )
            .forEach((item) => {
                item.style.padding =
                    "8px 12px";

                item.style.cursor =
                    "pointer";

                item.style.color =
                    currentPalette.text;

                item.style.borderBottom =
                    `1px solid ${currentPalette.border}`;
            });
    }

    function refreshFontDropdown() {
        dropdownMenu.innerHTML =
            ADAPT.getFontDropdownHTML(
                settings.premiumUnlocked
            );

        styleFontDropdownItems();
    }

    function renderHighlighterMenu() {
        const selectedColor =
            settings.highlighterColor.toLowerCase();

        highlighterMenu.innerHTML = `
            <div class="adapt-highlight-palette-grid">
                ${ADAPT.highlighterColors
                    .map((color) => {
                        const locked =
                            color.premium &&
                            !settings.premiumUnlocked;

                        const selected =
                            color.value.toLowerCase() ===
                            selectedColor;

                        const accessibleLabel =
                            locked
                                ? `${color.label}, locked`
                                : color.label;

                        return `
                            <button
                                type="button"
                                class="adapt-highlight-color-option${
                                    selected
                                        ? " adapt-highlight-color-selected"
                                        : ""
                                }"
                                data-highlight-color="${color.value}"
                                data-locked="${String(locked)}"
                                aria-label="${accessibleLabel}"
                                aria-pressed="${String(selected)}"
                                style="
                                    --adapt-highlight-swatch: ${color.value};
                                "
                            >${
                                locked
                                    ? '<span class="adapt-premium-lock" aria-hidden="true">🔒</span>'
                                    : ""
                            }</button>
                        `;
                    })
                    .join("")}
            </div>
        `;
    }

    function openHighlighterMenu() {
        highlighterMenu.style.display = "block";

        highlighterButton.setAttribute(
            "aria-expanded",
            "true"
        );
    }

    function closeHighlighterMenu() {
        highlighterMenu.style.display = "none";

        highlighterButton.setAttribute(
            "aria-expanded",
            "false"
        );
    }

    function renderNoteMenu() {
        noteMenu.innerHTML = `
            <div class="adapt-note-palette-row">
                ${ADAPT.noteColors
                    .map((color) => {
                        const locked =
                            color.premium &&
                            !settings.premiumUnlocked;

                        const selected =
                            color.id ===
                            settings.noteColor;

                        const accessibleLabel =
                            locked
                                ? `${color.label}, locked`
                                : color.label;

                        return `
                            <button
                                type="button"
                                class="adapt-note-color-option${
                                    selected
                                        ? " adapt-note-color-selected"
                                        : ""
                                }"
                                data-note-color="${color.id}"
                                data-locked="${String(locked)}"
                                aria-label="${accessibleLabel}"
                                aria-pressed="${String(selected)}"
                                style="
                                    --adapt-note-swatch: ${color.background};
                                "
                            >${
                                locked
                                    ? '<span class="adapt-premium-lock" aria-hidden="true">🔒</span>'
                                    : ""
                            }</button>
                        `;
                    })
                    .join("")}
            </div>
        `;
    }

    function openNoteMenu() {
        noteMenu.style.display = "block";

        noteButton.setAttribute(
            "aria-expanded",
            "true"
        );
    }

    function closeNoteMenu() {
        noteMenu.style.display = "none";

        noteButton.setAttribute(
            "aria-expanded",
            "false"
        );
    }

    function getExactStickerSelection(
        packId,
        stickerId
    ) {
        const stickerPallet =
            globalThis.ADAPTStickerPallet;

        const pack = stickerPallet
            ?.getPalettes?.()
            .find(
                (candidate) =>
                    candidate.id === packId
            );

        const sticker = pack?.stickers.find(
            (candidate) =>
                candidate.id === stickerId
        );

        if (!pack || !sticker) {
            return null;
        }

        return {
            packId: pack.id,
            stickerId: sticker.id
        };
    }

    function getFirstStickerSelection(packId) {
        const stickerPallet =
            globalThis.ADAPTStickerPallet;

        const pack = stickerPallet?.getPalette?.(
            packId
        );

        const firstSticker = pack?.stickers[0];

        if (!pack || !firstSticker) {
            return null;
        }

        return {
            packId: pack.id,
            stickerId: firstSticker.id
        };
    }

    function renderStickerMenu() {
        const stickerPallet =
            globalThis.ADAPTStickerPallet;

        const pack = stickerPallet?.getPalette?.(
            settings.selectedStickerPack
        );

        if (!pack) {
            stickerMenu.innerHTML = `
                <div style="
                    padding: 4px;
                    color: ${currentPalette.text};
                    font: 600 11px/1.2 Arial, Helvetica, sans-serif;
                    white-space: nowrap;
                ">
                    Loading sticker palette…
                </div>
            `;

            return;
        }

        stickerMenu.innerHTML = `
            <div style="
                margin: 0 0 7px;
                color: ${currentPalette.text};
                font: 700 11px/1.2 Arial, Helvetica, sans-serif;
                white-space: nowrap;
            ">
                ${pack.name}
            </div>

            <div style="
                display: flex;
                align-items: center;
                gap: 7px;
            ">
                ${pack.stickers
                    .map((sticker) => {
                        const selected =
                            sticker.id ===
                            settings.selectedStickerId;

                        return `
                            <button
                                type="button"
                                class="adapt-sticker-option"
                                data-pack-id="${pack.id}"
                                data-sticker-id="${sticker.id}"
                                aria-label="${sticker.name}"
                                aria-pressed="${String(selected)}"
                                style="
                                    width: 50px;
                                    height: 50px;
                                    min-width: 50px;
                                    min-height: 50px;
                                    flex: 0 0 50px;
                                    display: grid;
                                    place-items: center;
                                    box-sizing: border-box;
                                    padding: 4px;
                                    border: 1px solid ${currentPalette.border};
                                    border-radius: 8px;
                                    overflow: hidden;
                                    background: ${
                                        selected
                                            ? currentPalette.selectedToolColor
                                            : ADAPT.colors.transparent
                                    };
                                "
                            >
                                <img
                                    class="adapt-sticker-option-image"
                                    src="${stickerPallet.getStickerURL(
                                        pack.id,
                                        sticker.id
                                    )}"
                                    alt=""
                                    style="
                                        display: block;
                                        width: 40px;
                                        height: 40px;
                                        max-width: 40px;
                                        max-height: 40px;
                                        object-fit: contain;
                                    "
                                >
                            </button>
                        `;
                    })
                    .join("")}
            </div>
        `;
    }

    function closeDropdown() {
        dropdownMenu.style.display = "none";

        dropdownArrow.style.transform =
            "rotate(0deg)";

        dropdownButton.style.background =
            ADAPT.colors.transparent;
    }

    function closeStickerMenu() {
        stickerMenu.style.display = "none";

        stickerButton.setAttribute(
            "aria-expanded",
            "false"
        );
    }

    toolbar
        .querySelectorAll("button")
        .forEach((button) => {
            button.type = "button";

            button.style.background =
                ADAPT.colors.transparent;

            button.style.color =
                currentPalette.text;

            button.style.border = "none";
            button.style.padding = "4px 8px";
            button.style.borderRadius = "4px";
            button.style.cursor = "pointer";
            button.style.display = "flex";
            button.style.alignItems = "center";

            button.style.justifyContent =
                "center";

            button.addEventListener(
                "mouseenter",
                () => {
                    button.style.background =
                        activeButtons.has(button.id)
                            ? getSelectedButtonColor(
                                  button.id
                              )
                            : currentPalette.hover;
                }
            );

            button.addEventListener(
                "mouseleave",
                () => {
                    if (
                        button === dropdownButton &&
                        dropdownMenu.style
                            .display === "block"
                    ) {
                        return;
                    }

                    renderButton(button.id);
                }
            );
        });

    toolbar
        .querySelectorAll("input")
        .forEach((input) => {
            input.style.background =
                currentPalette.input;

            input.style.color =
                currentPalette.text;

            input.style.fontSize = "12px";

            input.style.border =
                `1px solid ${currentPalette.border}`;

            input.style.padding = "4px 8px";
            input.style.borderRadius = "4px";
            input.style.cursor = "text";
            input.style.textAlign = "center";
            input.style.outline = "none";

            input.addEventListener(
                "focus",
                () => {
                    input.style.border =
                        `1px solid ${currentPalette.text}`;
                }
            );

            input.addEventListener(
                "blur",
                () => {
                    input.style.border =
                        `1px solid ${currentPalette.border}`;
                }
            );
        });

    dropdownMenu.addEventListener(
        "mouseover",
        (event) => {
            const item = event.target.closest(
                ".adapt-dropdown-item"
            );

            if (item) {
                item.style.background =
                    currentPalette.hover;
            }
        }
    );

    dropdownMenu.addEventListener(
        "mouseout",
        (event) => {
            const item = event.target.closest(
                ".adapt-dropdown-item"
            );

            if (item) {
                item.style.background =
                    ADAPT.colors.transparent;
            }
        }
    );

    dropdownMenu.addEventListener(
        "click",
        (event) => {
            const item = event.target.closest(
                ".adapt-dropdown-item"
            );

            if (!item) {
                return;
            }

            const font =
                item.getAttribute("data-value");

            const isPremium =
                item.dataset.premium === "true";

            const isUpload =
                item.dataset.upload === "true";

            closeDropdown();

            if (
                isPremium &&
                !settings.premiumUnlocked
            ) {
                globalThis.ADAPTSettings
                    ?.openPurchase();

                return;
            }

            if (isUpload) {
                globalThis.ADAPTSettings
                    ?.chooseFontUpload();

                return;
            }

            saveAndApply({ font });
        }
    );

    dropdownButton.addEventListener(
        "click",
        () => {
            const isOpen =
                dropdownMenu.style.display ===
                "block";

            dropdownMenu.style.display = isOpen
                ? "none"
                : "block";

            dropdownArrow.style.transform =
                isOpen
                    ? "rotate(0deg)"
                    : "rotate(180deg) translateY(-2px)";

            dropdownButton.style.background =
                isOpen
                    ? ADAPT.colors.transparent
                    : currentPalette.hover;
        }
    );

    stickerMenu.addEventListener(
        "click",
        (event) => {
            const option = event.target.closest(
                ".adapt-sticker-option"
            );

            if (!option) {
                return;
            }

            event.preventDefault();
            event.stopPropagation();

            const selection =
                getExactStickerSelection(
                    option.dataset.packId,
                    option.dataset.stickerId
                );

            if (!selection) {
                return;
            }

            setButtonActive(
                "adapt-define",
                false
            );

            setButtonActive(
                "adapt-speak",
                false
            );

            globalThis.ADAPTDefine?.toggle(false);
            globalThis.ADAPTSpeak?.toggle(false);

            saveAndApply({
                stickerEnabled: true,
                selectedStickerPack:
                    selection.packId,
                selectedStickerId:
                    selection.stickerId,
                highlightEnabled: false,
                noteEnabled: false
            });
        }
    );

    highlighterMenu.addEventListener(
        "click",
        (event) => {
            const option = event.target.closest(
                ".adapt-highlight-color-option"
            );

            if (!option) {
                return;
            }

            event.stopPropagation();

            if (option.dataset.locked === "true") {
                globalThis.ADAPTSettings
                    ?.openPurchase();

                return;
            }

            saveAndApply({
                highlighterColor:
                    option.dataset.highlightColor
            });
        }
    );

    noteMenu.addEventListener(
        "click",
        (event) => {
            const option = event.target.closest(
                ".adapt-note-color-option"
            );

            if (!option) {
                return;
            }

            event.stopPropagation();

            if (option.dataset.locked === "true") {
                globalThis.ADAPTSettings
                    ?.openPurchase();

                return;
            }

            saveAndApply({
                noteColor:
                    option.dataset.noteColor
            });
        }
    );

    adaptShadow.addEventListener(
        "click",
        (event) => {
            if (
                !event.target.closest(
                    "#adapt-dropdown"
                )
            ) {
                closeDropdown();
            }

            if (
                !event.target.closest(
                    "#adapt-highlight-control"
                )
            ) {
                closeHighlighterMenu();
            }

            if (
                !event.target.closest(
                    "#adapt-note-control"
                )
            ) {
                closeNoteMenu();
            }

            if (
                !event.target.closest(
                    "#adapt-sticker-control"
                )
            ) {
                closeStickerMenu();
            }
        }
    );

    document.addEventListener(
        "click",
        (event) => {
            const clickedDropdown =
                event
                    .composedPath()
                    .some(
                        (element) =>
                            element instanceof
                                Element &&
                            element.id ===
                                "adapt-dropdown"
                    );

            if (!clickedDropdown) {
                closeDropdown();
            }

            const clickedHighlighterControl =
                event
                    .composedPath()
                    .some(
                        (element) =>
                            element instanceof
                                Element &&
                            element.id ===
                                "adapt-highlight-control"
                    );

            if (!clickedHighlighterControl) {
                closeHighlighterMenu();
            }

            const clickedNoteControl =
                event
                    .composedPath()
                    .some(
                        (element) =>
                            element instanceof
                                Element &&
                            element.id ===
                                "adapt-note-control"
                    );

            if (!clickedNoteControl) {
                closeNoteMenu();
            }

            const clickedStickerControl =
                event
                    .composedPath()
                    .some(
                        (element) =>
                            element instanceof
                                Element &&
                            element.id ===
                                "adapt-sticker-control"
                    );

            if (!clickedStickerControl) {
                closeStickerMenu();
            }
        }
    );

    document.addEventListener(
        "click",
        (event) => {
            const clickedNoteControl =
                event
                    .composedPath()
                    .some(
                        (element) =>
                            element instanceof
                                Element &&
                            element.id ===
                                "adapt-note-control"
                    );

            if (!clickedNoteControl) {
                closeNoteMenu();
            }
        },
        true
    );

    adaptShadow.addEventListener(
        "click",
        (event) => {
            const button =
                event.target.closest("button");

            if (
                !button ||
                button === dropdownButton ||
                !toolbar.contains(button)
            ) {
                return;
            }

            switch (button.id) {
                case "adapt-bold":
                    saveAndApply({
                        removeBold:
                            !settings.removeBold
                    });
                    break;

                case "adapt-italic":
                    saveAndApply({
                        removeItalics:
                            !settings.removeItalics
                    });
                    break;

                case "adapt-underline":
                    saveAndApply({
                        removeUnderline:
                            !settings.removeUnderline
                    });
                    break;

                case "adapt-highlight": {
                    const nextValue =
                        !settings.highlightEnabled;

                    setButtonActive(
                        "adapt-define",
                        false
                    );

                    setButtonActive(
                        "adapt-speak",
                        false
                    );

                    saveAndApply({
                        highlightEnabled:
                            nextValue,
                        noteEnabled: false,
                        stickerEnabled: false
                    });

                    closeNoteMenu();
                    closeStickerMenu();

                    if (nextValue) {
                        openHighlighterMenu();
                    } else {
                        closeHighlighterMenu();
                    }

                    break;
                }

                case "adapt-line-guide":
                    setButtonActive(
                        "adapt-define",
                        false
                    );

                    setButtonActive(
                        "adapt-speak",
                        false
                    );

                    saveAndApply({
                        lineGuideEnabled:
                            !settings.lineGuideEnabled
                    });

                    break;

                case "adapt-note": {
                    const nextValue =
                        !settings.noteEnabled;

                    setButtonActive(
                        "adapt-define",
                        false
                    );

                    setButtonActive(
                        "adapt-speak",
                        false
                    );

                    saveAndApply({
                        noteEnabled:
                            nextValue,
                        highlightEnabled: false,
                        stickerEnabled: false
                    });

                    closeHighlighterMenu();
                    closeStickerMenu();

                    if (nextValue) {
                        openNoteMenu();
                    } else {
                        closeNoteMenu();
                    }

                    break;
                }

                case "adapt-sticker": {
                    if (!settings.premiumUnlocked) {
                        globalThis.ADAPTSettings
                            ?.openPurchase();

                        break;
                    }

                    const isOpen =
                        stickerMenu.style.display ===
                        "block";

                    const selection =
                        settings.stickerEnabled
                            ? getExactStickerSelection(
                                  settings.selectedStickerPack,
                                  settings.selectedStickerId
                              ) ||
                              getFirstStickerSelection(
                                  settings.selectedStickerPack
                              )
                            : getFirstStickerSelection(
                                  settings.selectedStickerPack
                              );

                    if (!selection) {
                        break;
                    }

                    setButtonActive(
                        "adapt-define",
                        false
                    );

                    setButtonActive(
                        "adapt-speak",
                        false
                    );

                    globalThis.ADAPTDefine?.toggle(
                        false
                    );

                    globalThis.ADAPTSpeak?.toggle(
                        false
                    );

                    saveAndApply({
                        stickerEnabled: true,
                        selectedStickerPack:
                            selection.packId,
                        selectedStickerId:
                            selection.stickerId,
                        highlightEnabled: false,
                        noteEnabled: false
                    });

                    stickerMenu.style.display =
                        isOpen ? "none" : "block";

                    stickerButton.setAttribute(
                        "aria-expanded",
                        String(!isOpen)
                    );

                    break;
                }

                case "adapt-define": {
                    const nextValue =
                        !activeButtons.has(
                            "adapt-define"
                        );

                    setButtonActive(
                        "adapt-define",
                        nextValue
                    );

                    setButtonActive(
                        "adapt-speak",
                        false
                    );

                    globalThis.ADAPTSpeak?.toggle(
                        false
                    );

                    if (nextValue) {
                        saveAndApply({
                            highlightEnabled: false,
                            lineGuideEnabled: false,
                            noteEnabled: false,
                            stickerEnabled: false
                        });
                    } else {
                        globalThis.ADAPTDefine?.toggle(
                            false
                        );
                    }

                    break;
                }

                case "adapt-speak": {
                    const nextValue =
                        !activeButtons.has(
                            "adapt-speak"
                        );

                    setButtonActive(
                        "adapt-speak",
                        nextValue
                    );

                    setButtonActive(
                        "adapt-define",
                        false
                    );

                    globalThis.ADAPTDefine?.toggle(
                        false
                    );

                    if (nextValue) {
                        saveAndApply({
                            highlightEnabled: false,
                            lineGuideEnabled: false,
                            noteEnabled: false,
                            stickerEnabled: false
                        });
                    } else {
                        globalThis.ADAPTSpeak?.toggle(
                            false
                        );
                    }

                    break;
                }

                case "adapt-decrease-size":
                    decreaseSize();
                    break;

                case "adapt-increase-size":
                    increaseSize();
                    break;

                case "adapt-decrease-leading":
                    decreaseLeading();
                    break;

                case "adapt-increase-leading":
                    increaseLeading();
                    break;

                case "adapt-decrease-spacing":
                    decreaseSpacing();
                    break;

                case "adapt-increase-spacing":
                    increaseSpacing();
                    break;

                case "adapt-hide":
                    saveAndApply({
                        toolbarHidden: true
                    });
                    break;

                case "adapt-settings":
                    globalThis.ADAPTSettings?.open();
                    break;

                default:
                    break;
            }
        }
    );

    function toggleExtensionActive() {
        saveAndApply({
            isActive: !settings.isActive
        });
    }

    logo.addEventListener(
        "click",
        toggleExtensionActive
    );

    logo.addEventListener(
        "keydown",
        (event) => {
            if (
                event.key === "Enter" ||
                event.key === " "
            ) {
                event.preventDefault();
                toggleExtensionActive();
            }
        }
    );

    tab.addEventListener(
        "click",
        () => {
            saveAndApply({
                toolbarHidden: false
            });
        }
    );

    tab.addEventListener(
        "keydown",
        (event) => {
            if (
                event.key === "Enter" ||
                event.key === " "
            ) {
                event.preventDefault();

                saveAndApply({
                    toolbarHidden: false
                });
            }
        }
    );

    document.addEventListener(
        "keydown",
        (event) => {
            const target = event.target;
            const tagName = target?.tagName;

            if (
                tagName === "INPUT" ||
                tagName === "TEXTAREA" ||
                target?.isContentEditable
            ) {
                return;
            }

            const controlOrCommand =
                event.ctrlKey ||
                event.metaKey;

            const key =
                event.key.toUpperCase();

            if (
                controlOrCommand &&
                event.shiftKey &&
                !event.altKey
            ) {
                const shortcutMap = {
                    P: "adapt-logo",
                    H: "adapt-highlight",
                    B: "adapt-bold",
                    I: "adapt-italic",
                    U: "adapt-underline",
                    L: "adapt-line-guide",
                    D: "adapt-define",
                    S: "adapt-speak",
                    J: "adapt-note"
                };

                if (key === "E") {
                    event.preventDefault();

                    if (
                        settings.toolbarHidden
                    ) {
                        tab.click();
                    } else {
                        getToolbarElement(
                            "adapt-hide"
                        ).click();
                    }

                    return;
                }

                const buttonId =
                    shortcutMap[key];

                if (buttonId) {
                    event.preventDefault();

                    if (
                        buttonId ===
                        "adapt-logo"
                    ) {
                        logo.click();
                    } else {
                        getToolbarElement(
                            buttonId
                        )?.click();
                    }
                }
            }

            if (
                event.ctrlKey &&
                event.altKey &&
                !event.shiftKey
            ) {
                const shortcutMap = {
                    ArrowUp:
                        "adapt-increase-leading",
                    ArrowDown:
                        "adapt-decrease-leading",
                    ArrowLeft:
                        "adapt-decrease-spacing",
                    ArrowRight:
                        "adapt-increase-spacing",
                    ".":
                        "adapt-increase-size",
                    ",":
                        "adapt-decrease-size"
                };

                const buttonId =
                    shortcutMap[event.key];

                if (buttonId) {
                    event.preventDefault();

                    getToolbarElement(
                        buttonId
                    )?.click();
                }
            }
        }
    );

    globalThis.ADAPTApp = Object.freeze({
        applyTypography,
        updateGlobalSetting
    });

    async function loadSavedState() {
        try {
            await globalThis.ADAPTStickerPallet
                ?.load?.();

            settings =
                await globalThis.ADAPTStorage.loadGlobal();

            applyAllSettings();

            const savedPage =
                await globalThis.ADAPTStorage.loadPage();

            globalThis.ADAPTHighlighter?.restore(
                savedPage.highlights
            );

            globalThis.ADAPTNote?.restore(
                savedPage.notes
            );

            globalThis.ADAPTSticker?.restore(
                savedPage.stickers
            );

            globalThis.ADAPTStorage.subscribeGlobal(
                (nextSettings) => {
                    settings = normalizeLocalConflicts({
                        ...nextSettings,
                        ...(pendingGlobalSettingsWrites > 0
                            ? pendingGlobalSettingsPatch
                            : {})
                    });

                    applyAllSettings();
                }
            );
        } catch (error) {
            console.error(
                "[ADAPT] Could not restore saved settings:",
                error
            );

            applyAllSettings();
        }
    }

    loadSavedState();
})();