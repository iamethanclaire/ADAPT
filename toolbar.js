// Toolbar behavior, saved settings, and extension-wide active state.
(function initializeADAPTToolbar() {
    "use strict";

    const activeButtons = new Set();

    const alterationButtonIds = new Set([
        "adapt-bold",
        "adapt-italic",
        "adapt-underline"
    ]);

    let settings = {
        isActive: true,
        toolbarHidden: false,
        font: "page-default",
        size: 100,
        leading: 100,
        spacing: 100,
        removeBold: false,
        removeItalics: false,
        removeUnderline: false,
        highlightEnabled: false,
        lineGuideEnabled: false,
        lineGuideYRatio: 0.5,
        noteEnabled: false
    };

    let isApplyingSettings = false;

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

    function getSelectedButtonColor(
        buttonId,
        hover = false
    ) {
        if (alterationButtonIds.has(buttonId)) {
            return hover
                ? hoverSelectedAlterationColor
                : selectedAlterationColor;
        }

        return hover
            ? hoverSelectedToolColor
            : selectedToolColor;
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
            : "transparent";

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
        const fontObject = ADAPT.fonts.find(
            (font) =>
                font.value === settings.font
        );

        const safeFont =
            fontObject ||
            ADAPT.fonts.find(
                (font) =>
                    font.value === "page-default"
            );

        settings.font = safeFont.value;

        changeFont(
            safeFont.value,
            safeFont
        );

        dropdownLabel.textContent =
            safeFont.label;

        dropdownLabel.style.fontFamily =
            safeFont.value === "page-default"
                ? "inherit"
                : safeFont.family;
    }

    function applyToolRuntime() {
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
                yRatio: settings.lineGuideYRatio
            }
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

        applySize(settings.size);
        applyLeading(settings.leading);
        applySpacing(settings.spacing);

        isApplyingSettings = false;

        applyTypography();
        applyToolRuntime();
        syncSavedButtonStates();

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

        try {
            await globalThis.ADAPTStorage.updateGlobal(
                patch
            );
        } catch (error) {
            console.error(
                "[ADAPT] Could not save toolbar settings:",
                error
            );
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

    function closeDropdown() {
        dropdownMenu.style.display = "none";

        dropdownArrow.style.transform =
            "rotate(0deg)";

        dropdownButton.style.background =
            "transparent";
    }

    adaptShadow
        .querySelectorAll("button")
        .forEach((button) => {
            button.type = "button";
            button.style.background =
                "transparent";
            button.style.color = textColor;
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
                                  button.id,
                                  true
                              )
                            : hoverColor;
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

    adaptShadow
        .querySelectorAll("input")
        .forEach((input) => {
            input.style.background =
                inputColor;

            input.style.color = textColor;
            input.style.fontSize = "12px";

            input.style.border =
                `1px solid ${borderColor}`;

            input.style.padding = "4px 8px";
            input.style.borderRadius = "4px";
            input.style.cursor = "text";
            input.style.textAlign = "center";
            input.style.outline = "none";

            input.addEventListener(
                "focus",
                () => {
                    input.style.border =
                        `1px solid ${selectedInputBorderColor}`;
                }
            );

            input.addEventListener(
                "blur",
                () => {
                    input.style.border =
                        `1px solid ${borderColor}`;
                }
            );
        });

    adaptShadow
        .querySelectorAll(
            ".adapt-dropdown-item"
        )
        .forEach((item) => {
            item.style.padding = "8px 12px";
            item.style.cursor = "pointer";
            item.style.color = textColor;

            item.style.borderBottom =
                `1px solid ${borderColor}`;

            item.addEventListener(
                "mouseenter",
                () => {
                    item.style.background =
                        hoverColor;
                }
            );

            item.addEventListener(
                "mouseleave",
                () => {
                    item.style.background =
                        "transparent";
                }
            );

            item.addEventListener(
                "click",
                () => {
                    const font =
                        item.getAttribute(
                            "data-value"
                        );

                    closeDropdown();
                    saveAndApply({ font });
                }
            );
        });

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
                    ? "transparent"
                    : hoverColor;
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
        }
    );

    adaptShadow.addEventListener(
        "click",
        (event) => {
            const button =
                event.target.closest("button");

            if (
                !button ||
                button === dropdownButton
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

                case "adapt-highlight":
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
                            !settings.highlightEnabled,
                        noteEnabled: false
                    });
                    break;

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

                case "adapt-note":
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
                            !settings.noteEnabled,
                        highlightEnabled: false
                    });
                    break;

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
                            noteEnabled: false
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
                            noteEnabled: false
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

            globalThis.ADAPTStorage.subscribeGlobal(
                (nextSettings) => {
                    settings = nextSettings;
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