// Persistent page stickers with a selected five-sticker pack.
(function initializeADAPTSticker() {
    "use strict";

    if (
        globalThis.ADAPTSticker &&
        typeof globalThis.ADAPTSticker.destroy ===
            "function"
    ) {
        globalThis.ADAPTSticker.destroy();
    }

    const STYLE_ID = "adapt-sticker-styles";
    const MINIMUM_STICKER_SIZE = 10;
    const MAXIMUM_STICKER_SIZE = 100;
    const DEFAULT_STICKER_SIZE = 50;
    const stickers = new Map();

    let isEnabled = false;
    let isRestoring = false;
    let isShiftPressed = false;
    let nextStickerId = 1;
    let resizeAnimationFrame = null;
    let unsubscribePage = null;
    let selectedPackId = "text-annotation";
    let selectedStickerId = "question";
    let stickerSize = DEFAULT_STICKER_SIZE;

    function injectStyles() {
        if (document.getElementById(STYLE_ID)) {
            return;
        }

        const style = document.createElement("style");
        style.id = STYLE_ID;
        style.textContent = `
            html.adapt-sticker-placement-mode
                body > :not(#adapt-host):not([data-adapt-owned]),
            html.adapt-sticker-placement-mode
                body > :not(#adapt-host):not([data-adapt-owned]) * {
                cursor: copy !important;
            }

            html:not(.adapt-extension-active)
                .adapt-page-sticker {
                display: none !important;
            }

            .adapt-page-sticker {
                position: absolute;
                width: var(
                    --adapt-sticker-size,
                    ${DEFAULT_STICKER_SIZE}px
                );
                height: var(
                    --adapt-sticker-size,
                    ${DEFAULT_STICKER_SIZE}px
                );
                display: grid;
                place-items: center;
                margin: 0;
                padding: 0;
                transform: translate(-50%, -50%);
                background:
                    ${ADAPT.colors.transparent};
                border: none;
                border-radius: 8px;
                cursor: default;
                user-select: none;
                appearance: none;
                z-index: 99997;
            }

            html.adapt-sticker-placement-mode
                .adapt-page-sticker {
                cursor: not-allowed !important;
            }

            html.adapt-sticker-placement-mode
                .adapt-page-sticker:hover {
                filter: none;
                outline-offset: 3px;
            }

            .adapt-page-sticker img {
                width: 100%;
                height: 100%;
                display: block;
                object-fit: contain;
                pointer-events: none;
                user-select: none;
                -webkit-user-drag: none;
            }

            .adapt-page-sticker.adapt-sticker-delete-mode,
            .adapt-page-sticker.adapt-sticker-delete-mode:hover {
                cursor: not-allowed !important;
                filter: none;
                outline:
                    3px solid
                    ${ADAPT.colors.deleteRed};
                outline-offset: 3px;
            }
        `;

        (document.head || document.documentElement)
            .appendChild(style);
    }

    function getPageDimensions() {
        return {
            width: Math.max(
                document.documentElement.clientWidth,
                document.documentElement.scrollWidth,
                document.body?.scrollWidth || 0
            ),
            height: Math.max(
                document.documentElement.clientHeight,
                document.documentElement.scrollHeight,
                document.body?.scrollHeight || 0
            )
        };
    }

    function positionSticker(sticker) {
        const halfSticker = stickerSize / 2;
        const page = getPageDimensions();
        const x = Math.min(
            Math.max(
                sticker.xRatio * page.width,
                halfSticker
            ),
            Math.max(
                page.width - halfSticker,
                halfSticker
            )
        );
        const y = Math.min(
            Math.max(
                sticker.yRatio * page.height,
                halfSticker
            ),
            Math.max(
                page.height - halfSticker,
                halfSticker
            )
        );

        sticker.element.style.left = `${x}px`;
        sticker.element.style.top = `${y}px`;
    }

    function repositionStickers() {
        stickers.forEach(positionSticker);
    }

    function setSize(value) {
        const numericValue = Number(value);
        const nextSize = Number.isFinite(numericValue)
            ? Math.round(numericValue)
            : DEFAULT_STICKER_SIZE;

        stickerSize = Math.min(
            Math.max(
                nextSize,
                MINIMUM_STICKER_SIZE
            ),
            MAXIMUM_STICKER_SIZE
        );

        document.documentElement.style.setProperty(
            "--adapt-sticker-size",
            `${stickerSize}px`
        );

        repositionStickers();
        return stickerSize;
    }

    function scheduleReposition() {
        if (resizeAnimationFrame !== null) {
            window.cancelAnimationFrame(
                resizeAnimationFrame
            );
        }

        resizeAnimationFrame =
            window.requestAnimationFrame(() => {
                resizeAnimationFrame = null;
                repositionStickers();
            });
    }

    function serializeStickers() {
        return Array.from(stickers.values()).map(
            (sticker) => ({
                id: sticker.id,
                xRatio: sticker.xRatio,
                yRatio: sticker.yRatio,
                packId: sticker.packId,
                stickerId: sticker.stickerId
            })
        );
    }

    function saveStickers() {
        if (isRestoring) {
            return;
        }

        globalThis.ADAPTStorage
            ?.updatePage({
                stickers: serializeStickers()
            })
            .catch((error) => {
                console.error(
                    "[ADAPT] Could not save stickers:",
                    error
                );
            });
    }

    function createSticker(
        pageX,
        pageY,
        options = {}
    ) {
        const page = getPageDimensions();
        const stickerPallet =
            globalThis.ADAPTStickerPallet;
        const pack = stickerPallet?.getPalette?.(
            options.packId || selectedPackId
        );

        if (!pack) {
            return null;
        }

        const stickerDefinition =
            stickerPallet.getSticker(
                pack.id,
                options.stickerId ||
                    selectedStickerId
            );

        if (!stickerDefinition) {
            return null;
        }

        const stickerURL =
            stickerPallet.getStickerURL(
                pack.id,
                stickerDefinition.id
            );
        const stickerId = Number.isInteger(options.id)
            ? options.id
            : nextStickerId;

        nextStickerId = Math.max(
            nextStickerId,
            stickerId + 1
        );

        const element = document.createElement(
            "button"
        );
        element.type = "button";
        element.className = "adapt-page-sticker";
        element.dataset.adaptOwned = "true";
        element.dataset.adaptStickerId =
            String(stickerId);

        const image = document.createElement("img");
        image.src = stickerURL;
        image.alt = "";
        image.draggable = false;
        element.appendChild(image);

        const record = {
            id: stickerId,
            xRatio: Math.min(
                Math.max(pageX / page.width, 0),
                1
            ),
            yRatio: Math.min(
                Math.max(pageY / page.height, 0),
                1
            ),
            packId: pack.id,
            stickerId: stickerDefinition.id,
            name: stickerDefinition.name,
            element
        };

        stickers.set(stickerId, record);
        updateStickerDeletePresentation(record);

        element.addEventListener(
            "click",
            (event) => {
                event.preventDefault();
                event.stopPropagation();

                if (
                    isEnabled ||
                    event.shiftKey ||
                    isShiftPressed
                ) {
                    deleteSticker(stickerId);
                }
            }
        );

        document.body.appendChild(element);
        positionSticker(record);

        if (!options.skipSave && !isRestoring) {
            saveStickers();
        }

        return record;
    }

    function deleteSticker(stickerId) {
        const sticker = stickers.get(stickerId);

        if (!sticker) {
            return false;
        }

        sticker.element.remove();
        stickers.delete(stickerId);
        saveStickers();
        return true;
    }

    function updateDeleteMode() {
        stickers.forEach((sticker) => {
            updateStickerDeletePresentation(
                sticker
            );
        });
    }

    function updateStickerDeletePresentation(sticker) {
        const canDelete =
            isEnabled || isShiftPressed;

        sticker.element.classList.toggle(
            "adapt-sticker-delete-mode",
            isShiftPressed
        );
        sticker.element.title = canDelete
            ? `Delete ${sticker.name}`
            : sticker.name;
        sticker.element.setAttribute(
            "aria-label",
            canDelete
                ? `Delete ${sticker.name}`
                : sticker.name
        );
    }

    function restoreStickers(savedStickers) {
        isRestoring = true;

        stickers.forEach((sticker) => {
            sticker.element.remove();
        });
        stickers.clear();
        nextStickerId = 1;

        if (Array.isArray(savedStickers)) {
            const page = getPageDimensions();

            savedStickers.forEach((savedSticker) => {
                const xRatio = Math.min(
                    Math.max(
                        Number(savedSticker.xRatio) || 0,
                        0
                    ),
                    1
                );
                const yRatio = Math.min(
                    Math.max(
                        Number(savedSticker.yRatio) || 0,
                        0
                    ),
                    1
                );

                createSticker(
                    xRatio * page.width,
                    yRatio * page.height,
                    {
                        id: Number.isInteger(
                            savedSticker.id
                        )
                            ? savedSticker.id
                            : undefined,
                        packId: savedSticker.packId,
                        stickerId:
                            savedSticker.stickerId,
                        skipSave: true
                    }
                );
            });
        }

        isRestoring = false;
        repositionStickers();
    }

    function isADAPTInterfaceClick(event) {
        return event.composedPath().some((node) => {
            if (!(node instanceof Element)) {
                return false;
            }

            return (
                node.id === "adapt-host" ||
                node.id.startsWith("adapt-") ||
                node.hasAttribute("data-adapt-owned") ||
                node.hasAttribute("data-adapt-toolbar")
            );
        });
    }

    function handlePageClick(event) {
        if (
            !isEnabled ||
            event.button !== 0 ||
            event.shiftKey ||
            isShiftPressed ||
            isADAPTInterfaceClick(event)
        ) {
            return;
        }

        event.preventDefault();
        event.stopPropagation();

        createSticker(
            event.pageX,
            event.pageY
        );
    }

    function setSelection(packId, stickerId) {
        const stickerPallet =
            globalThis.ADAPTStickerPallet;
        const pack = stickerPallet
            ?.getPalettes?.()
            .find(
                (candidate) =>
                    candidate.id === packId
            );

        if (!pack) {
            return {
                packId: selectedPackId,
                stickerId: selectedStickerId
            };
        }

        const sticker = pack.stickers.find(
            (candidate) =>
                candidate.id === stickerId
        );

        if (!sticker) {
            return {
                packId: selectedPackId,
                stickerId: selectedStickerId
            };
        }

        selectedPackId = pack.id;
        selectedStickerId = sticker.id;

        return {
            packId: selectedPackId,
            stickerId: selectedStickerId
        };
    }

    function toggle(shouldEnable) {
        const nextEnabled =
            Boolean(shouldEnable);

        if (nextEnabled === isEnabled) {
            return;
        }

        isEnabled = nextEnabled;

        document.documentElement.classList.toggle(
            "adapt-sticker-placement-mode",
            isEnabled
        );

        updateDeleteMode();

        if (isEnabled) {
            document.addEventListener(
                "click",
                handlePageClick,
                true
            );
        } else {
            document.removeEventListener(
                "click",
                handlePageClick,
                true
            );
        }
    }

    function handleKeyDown(event) {
        if (event.key !== "Shift") {
            return;
        }

        isShiftPressed = true;
        updateDeleteMode();
    }

    function handleKeyUp(event) {
        if (event.key !== "Shift") {
            return;
        }

        isShiftPressed = false;
        updateDeleteMode();
    }

    function handleWindowBlur() {
        isShiftPressed = false;
        updateDeleteMode();
    }

    function destroy() {
        toggle(false);

        window.removeEventListener(
            "resize",
            scheduleReposition
        );
        window.removeEventListener(
            "blur",
            handleWindowBlur
        );
        document.removeEventListener(
            "keydown",
            handleKeyDown,
            true
        );
        document.removeEventListener(
            "keyup",
            handleKeyUp,
            true
        );

        unsubscribePage?.();
        unsubscribePage = null;

        if (resizeAnimationFrame !== null) {
            window.cancelAnimationFrame(
                resizeAnimationFrame
            );
            resizeAnimationFrame = null;
        }

        stickers.forEach((sticker) => {
            sticker.element.remove();
        });
        stickers.clear();

        document
            .getElementById(STYLE_ID)
            ?.remove();

        document.documentElement.style.removeProperty(
            "--adapt-sticker-size"
        );
    }

    injectStyles();
    setSize(DEFAULT_STICKER_SIZE);
    window.addEventListener(
        "resize",
        scheduleReposition
    );
    window.addEventListener(
        "blur",
        handleWindowBlur
    );
    document.addEventListener(
        "keydown",
        handleKeyDown,
        true
    );
    document.addEventListener(
        "keyup",
        handleKeyUp,
        true
    );

    unsubscribePage =
        globalThis.ADAPTStorage?.subscribePage?.(
            (savedPage) => {
                restoreStickers(
                    savedPage.stickers
                );
            }
        ) || null;

    globalThis.ADAPTSticker = Object.freeze({
        toggle,
        setSelection,
        setSize,
        delete: deleteSticker,
        destroy,
        restore: restoreStickers,
        reposition: repositionStickers,
        save: saveStickers,
        isEnabled() {
            return isEnabled;
        },
        getSelection() {
            return {
                packId: selectedPackId,
                stickerId: selectedStickerId
            };
        },
        getSize() {
            return stickerSize;
        },
        getStickers() {
            return serializeStickers();
        }
    });
})();