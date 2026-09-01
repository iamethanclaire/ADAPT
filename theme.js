// Shared A.D.A.P.T. colors, fonts, sticker packs, and toolbar theme data.
// Every user-facing color used by the extension is defined in this file.
var ADAPT = {
    prefersDark: window.matchMedia(
        "(prefers-color-scheme: dark)"
    ).matches,

    colors: Object.freeze({
        transparent: "transparent",
        white: "#ffffff",
        black: "#000000",
        nearBlack: "#0e0c0c",
        darkSurface: "#1e1e1e",

        gray050: "#f3f3f3",
        gray300: "#cccccc",
        gray500: "#8e8e8e",
        gray600: "#888888",
        gray650: "#666666",
        gray700: "#636363",
        gray800: "#444444",
        gray850: "#363636",
        gray900: "#2d3235",

        brown100: "#c3a296",
        brown300: "#aa7b6f",
        brown500: "#80594e",
        brown800: "#42281d",
        brown900: "#311104",

        yellowDefault: "#ffff00",
        yellow100: "#ffe785",
        yellow200: "#ffda59",
        yellow300: "#fbc45d",
        yellow400: "#ffc340",
        yellow500: "#faa300",

        orange100: "#ffc59e",
        orange200: "#ff9b57",
        orange300: "#ff7f4a",
        orange500: "#eb5f24",
        orange700: "#d3500d",

        red100: "#ff8a89",
        red300: "#f85454",
        red500: "#e41100",
        red700: "#b20000",
        red900: "#910100",

        pink100: "#ffc1db",
        pink200: "#ffa9cb",
        pink300: "#f1a0af",
        pink500: "#f2799b",
        pink700: "#ed408b",

        purple100: "#ddaee4",
        purple300: "#a577b8",
        purple500: "#765f93",
        purple600: "#a858c8",
        purple800: "#7b4384",

        blue050: "#d4f1ff",
        blue100: "#bae3ea",
        blue300: "#9dc8db",
        blue500: "#83a8d4",
        blue700: "#2874a6",

        green050: "#cff7f2",
        green200: "#9bd9d0",
        green300: "#9ad4bc",
        green600: "#328c8d",
        green800: "#396c6a",

        olive100: "#abae98",
        olive300: "#919561",
        olive500: "#62654a",
        olive700: "#485639",
        olive900: "#40300b",

        toolbarLightHover: "#efefef",
        toolbarDarkHover: "#363636",

        shadowLight: "rgba(0, 0, 0, 0.15)",
        shadowMedium: "rgba(0, 0, 0, 0.28)",
        shadowLineGuide: "rgba(0, 0, 0, 0.30)",
        shadowHeavy: "rgba(0, 0, 0, 0.42)",
        overlayScrim: "rgba(15, 23, 42, 0.38)",
        noteHover: "rgba(71, 54, 0, 0.12)",
        notePlaceholder: "rgba(71, 54, 0, 0.58)",
        focusBlue: "#2563eb",
        deleteRed: "#ff0000",

        speakHighlight: "rgba(135, 206, 250, 0.58)",
        speakerCursorOutline: "#17202a",
        speakerCursorBlue: "#1479b8",

        defineText: "#18212a",
        defineBackground: "#ffffff",
        defineBorder: "#b8c7d3",
        defineShadowStrong: "rgba(17, 35, 50, 0.22)",
        defineShadowSoft: "rgba(17, 35, 50, 0.12)",
        defineHeaderBorder: "#e4ebf0",
        defineHeading: "#13212c",
        defineSecondary: "#587080",
        defineClose: "#425767",
        defineCloseHover: "#17242e",
        defineStatus: "#4d6372",
        defineError: "#9c2f2f",
        defineMeaningBorder: "#e7edf1",
        defineAccent: "#176eaa",
        defineBody: "#22313b",
        defineExample: "#657985",
        defineSynonyms: "#526a78",
        defineSource: "#82939e"
    }),

    get bgColor() {
        return this.prefersDark
            ? this.colors.darkSurface
            : this.colors.white;
    },

    get inputColor() {
        return this.prefersDark
            ? this.colors.darkSurface
            : this.colors.white;
    },

    get textColor() {
        return this.prefersDark
            ? this.colors.white
            : this.colors.black;
    },

    get borderColor() {
        return this.prefersDark
            ? this.colors.gray800
            : this.colors.gray300;
    },

    get hoverColor() {
        return this.prefersDark
            ? this.colors.toolbarDarkHover
            : this.colors.toolbarLightHover;
    },

    get menuColor() {
        return this.prefersDark
            ? this.colors.darkSurface
            : this.colors.white;
    },

    get lineColor() {
        return this.prefersDark
            ? this.colors.gray600
            : this.colors.gray650;
    },

    toolbarThemes: Object.freeze({
        system: {
            label: "System Default",
            selectedAlterationColor: "#cc0000",
            selectedToolColor: "#007acc"
        },
        white: {
            label: "Default White",
            background: "#ffffff",
            input: "#ffffff",
            text: "#000000",
            border: "#cccccc",
            hover: "#efefef",
            menu: "#ffffff",
            selectedAlterationColor: "#e62727",
            selectedToolColor: "#319fe9"
        },
        black: {
            label: "Default Black",
            background: "#1e1e1e",
            input: "#1e1e1e",
            text: "#ffffff",
            border: "#444444",
            hover: "#363636",
            menu: "#1e1e1e",
            selectedAlterationColor: "#cc0000",
            selectedToolColor: "#007acc"
        },
        red: {
            label: "Red",
            background: "#ff8a89",
            input: "#ff8a89",
            text: "#0e0c0c",
            border: "#b20000",
            hover: "#f85454",
            menu: "#ff8a89",
            selectedAlterationColor: "#f85454",
            selectedToolColor: "#f85454"
        },
        yellow: {
            label: "Yellow",
            background: "#ffe785",
            input: "#ffe785",
            text: "#0e0c0c",
            border: "#fecb00",
            hover: "#ffda59",
            menu: "#ffe785",
            selectedAlterationColor: "#fecb00",
            selectedToolColor: "#fecb00"
        },
        orange: {
            label: "Orange",
            background: "#ffc59e",
            input: "#ffc59e",
            text: "#0e0c0c",
            border: "rgb(223, 84, 15)",
            hover: "#ff9b57",
            menu: "#ffc59e",
            selectedAlterationColor: "#ff8b3e",
            selectedToolColor: "#ff8b3e"
        },
        green: {
            label: "Green",
            background: "#a0f3a1",
            input: "#a0f3a1",
            text: "#0e0c0c",
            border: "#358d32",
            hover: "#9bd9a1",
            menu: "#a0f3a1",
            selectedAlterationColor: "rgb(100, 201, 110)",
            selectedToolColor: "rgb(100, 201, 110)"
        },
        blue: {
            label: "Blue",
            background: "#d4f1ff",
            input: "#d4f1ff",
            text: "#0e0c0c",
            border: "#2874a6",
            hover: "#a2dbf8",
            menu: "#d4f1ff",
            selectedAlterationColor: "#7bbbe7",
            selectedToolColor: "#7bbbe7"
        },
        purple: {
            label: "Purple",
            background: "#ddaee4",
            input: "#ddaee4",
            text: "#0e0c0c",
            border: "#7b4384",
            hover: "#a577b8",
            menu: "#ddaee4",
            selectedAlterationColor: "#d489e0",
            selectedToolColor: "#d489e0"
        },
        pink: {
            label: "Pink",
            background: "#ffc1db",
            input: "#ffc1db",
            text: "#0e0c0c",
            border: "#ed408b",
            hover: "#ffa9cb",
            menu: "#ffc1db",
            selectedAlterationColor: "#ed99bd",
            selectedToolColor: "#ed99bd"
        },
        "light-coffee-brown": {
            label: "Light Coffee Brown",
            background: "#c3a296",
            input: "#c3a296",
            text: "#0e0c0c",
            border: "#80594e",
            hover: "#aa7b6f",
            menu: "#c3a296",
            selectedAlterationColor: "#ae7865",
            selectedToolColor: "#ae7865"
        }
    }),

    getToolbarPalette(themeValue = "system") {
        const selected =
            this.toolbarThemes[themeValue] ||
            this.toolbarThemes.system;

        if (themeValue !== "system" && selected.background) {
            return selected;
        }

        return {
            ...this.toolbarThemes.system,
            background: this.bgColor,
            input: this.inputColor,
            text: this.textColor,
            border: this.borderColor,
            hover: this.hoverColor,
            menu: this.menuColor
        };
    },

    highlighterColors: [
        {
            label: "Default Yellow",
            value: "#ffff00",
            premium: false
        },
        { label: "Light Red", value: "#ff8a89", premium: true },
        { label: "Red", value: "#f85454", premium: true },
        { label: "Deep Red", value: "#e41100", premium: true },
        { label: "Dark Red", value: "#b20000", premium: true },
        { label: "Burgundy", value: "#910100", premium: true },
        { label: "Light Orange", value: "#ffc59e", premium: true },
        { label: "Orange", value: "#ff9b57", premium: true },
        { label: "Tangerine", value: "#ff7f4a", premium: true },
        { label: "Deep Orange", value: "#eb5f24", premium: true },
        { label: "Burnt Orange", value: "#d3500d", premium: true },
        { label: "Soft Yellow", value: "#ffe785", premium: true },
        { label: "Golden Yellow", value: "#ffda59", premium: true },
        { label: "Warm Yellow", value: "#fbc45d", premium: true },
        { label: "Amber", value: "#ffc340", premium: true },
        { label: "Gold", value: "#faa300", premium: true },
        { label: "Mint", value: "#cff7f2", premium: true },
        { label: "Seafoam", value: "#9bd9d0", premium: true },
        { label: "Soft Green", value: "#9ad4bc", premium: true },
        { label: "Teal", value: "#328c8d", premium: true },
        { label: "Dark Teal", value: "#396c6a", premium: true },
        { label: "Light Olive", value: "#abae98", premium: true },
        { label: "Olive", value: "#919561", premium: true },
        { label: "Deep Olive", value: "#62654a", premium: true },
        { label: "Forest Olive", value: "#485639", premium: true },
        { label: "Dark Olive", value: "#40300b", premium: true },
        { label: "Ice Blue", value: "#d4f1ff", premium: true },
        { label: "Light Blue", value: "#bae3ea", premium: true },
        { label: "Powder Blue", value: "#9dc8db", premium: true },
        { label: "Blue", value: "#83a8d4", premium: true },
        { label: "Deep Blue", value: "#2874a6", premium: true },
        { label: "Lavender", value: "#ddaee4", premium: true },
        { label: "Soft Purple", value: "#a577b8", premium: true },
        { label: "Muted Purple", value: "#765f93", premium: true },
        { label: "Violet", value: "#a858c8", premium: true },
        { label: "Deep Purple", value: "#7b4384", premium: true },
        { label: "Light Pink", value: "#ffc1db", premium: true },
        { label: "Pink", value: "#ffa9cb", premium: true },
        { label: "Rose", value: "#f1a0af", premium: true },
        { label: "Deep Pink", value: "#f2799b", premium: true },
        { label: "Magenta", value: "#ed408b", premium: true },
        { label: "Light Coffee", value: "#c3a296", premium: true },
        { label: "Coffee", value: "#aa7b6f", premium: true },
        { label: "Brown", value: "#80594e", premium: true },
        { label: "Deep Brown", value: "#42281d", premium: true },
        { label: "Dark Brown", value: "#311104", premium: true },
        { label: "Off White", value: "#f3f3f3", premium: true },
        { label: "Gray", value: "#8e8e8e", premium: true },
        { label: "Dark Gray", value: "#636363", premium: true },
        { label: "Charcoal", value: "#2d3235", premium: true },
        { label: "Near Black", value: "#0e0c0c", premium: true }
    ],

    getHighlighterColor(value) {
        return (
            this.highlighterColors.find(
                (color) =>
                    color.value.toLowerCase() ===
                    String(value || "").toLowerCase()
            ) || this.highlighterColors[0]
        );
    },

    get underlineColors() {
        return this.highlighterColors.map((color) =>
            color.value.toLowerCase() ===
            this.colors.blue500.toLowerCase()
                ? {
                      ...color,
                      label: "Default Blue",
                      premium: false
                  }
                : { ...color }
        );
    },

    getUnderlineColor(value) {
        const colors = this.underlineColors;

        return (
            colors.find(
                (color) =>
                    color.value.toLowerCase() ===
                    String(value || "").toLowerCase()
            ) ||
            colors.find(
                (color) =>
                    color.value.toLowerCase() ===
                    this.colors.blue500.toLowerCase()
            )
        );
    },

    noteColors: [
        {
            id: "yellow",
            label: "Yellow",
            background: "#ffe785",
            header: "#ffda59",
            text: "#40360f",
            iconFilter:
                "sepia(98.4%) saturate(1054.1%) hue-rotate(303.2deg) brightness(107.2%) contrast(143.5%)",
            premium: false
        },
        {
            id: "orange",
            label: "Orange",
            background: "#ffc59e",
            header: "#ff9b57",
            text: "#5f371d",
            iconFilter:
                "sepia(64.3%) saturate(713.7%) hue-rotate(299.8deg) brightness(96.2%) contrast(108.3%)",
            premium: true
        },
        {
            id: "pink",
            label: "Pink",
            background: "#ffc1db",
            header: "#ffa9cb",
            text: "#4e132b",
            iconFilter:
                "sepia(64.3%) saturate(613%) hue-rotate(282deg) brightness(92.3%) contrast(118.3%)",
            premium: true
        },
        {
            id: "green",
            label: "Green",
            background: "#a6ddb3",
            header: "#84cd94",
            text: "#0e4319",
            iconFilter:
                "brightness(60.4%) contrast(600.5%) sepia(27.7%) saturate(360.1%) hue-rotate(77.5deg)",
            premium: true
        },
        {
            id: "blue",
            label: "Blue",
            background: "#d4f1ff",
            header: "#bae3ea",
            text: "#184f74",
            iconFilter:
                "sepia(64.3%) saturate(439.9%) hue-rotate(170.5deg) brightness(86.5%) contrast(136.9%)",
            premium: true
        }
    ],

    getNoteColor(colorId) {
        return (
            this.noteColors.find(
                (color) => color.id === colorId
            ) || this.noteColors[0]
        );
    },

    fonts: [
        {
            label: "Page Default",
            value: "page-default",
            family: "inherit",
            premium: false
        },
        {
            label: "Arial",
            value: "arial",
            family: "Arial, sans-serif",
            premium: false
        },
        {
            label: "Verdana",
            value: "verdana",
            family: "Verdana, sans-serif",
            url: chrome.runtime.getURL("fonts/Verdana.woff2"),
            premium: false
        },
        {
            label: "Helvetica",
            value: "helvetica",
            family: "Helvetica, sans-serif",
            url: chrome.runtime.getURL("fonts/Helvetica.woff2"),
            premium: false
        },
        {
            label: "Calibri",
            value: "calibri",
            family: "Calibri, sans-serif",
            url: chrome.runtime.getURL("fonts/Calibri.woff2"),
            premium: false
        },
        {
            label: "Helvetica Neue",
            value: "helvetica-neue",
            family: '"Helvetica Neue", Helvetica, sans-serif',
            premium: true
        },
        {
            label: "Sans-serif",
            value: "sans-serif",
            family: "sans-serif",
            premium: true
        },
        {
            label: "Monospace",
            value: "monospace",
            family: "monospace",
            premium: true
        },
        {
            label: "Open Sans",
            value: "open-sans",
            family: '"Open Sans", Arial, sans-serif',
            premium: true
        },
        {
            label: "Georgia",
            value: "georgia",
            family: "Georgia, serif",
            premium: true
        },
        {
            label: "Tahoma",
            value: "tahoma",
            family: "Tahoma, sans-serif",
            premium: true
        },
        {
            label: "Font Awesome",
            value: "font-awesome",
            family: '"Font Awesome", sans-serif',
            premium: true
        },
        {
            label: "Serif",
            value: "serif",
            family: "serif",
            premium: true
        },
        {
            label: "Trebuchet MS",
            value: "trebuchet-ms",
            family: '"Trebuchet MS", sans-serif',
            premium: true
        },
        {
            label: "Glyphicons Halflings",
            value: "glyphicons-halflings",
            family: '"Glyphicons Halflings", sans-serif',
            premium: true
        },
        {
            label: "Menlo",
            value: "menlo",
            family: "Menlo, monospace",
            premium: true
        },
        {
            label: "Monaco",
            value: "monaco",
            family: "Monaco, monospace",
            premium: true
        },
        {
            label: "Lucida Grande",
            value: "lucida-grande",
            family: '"Lucida Grande", sans-serif',
            premium: true
        },
        {
            label: "Lato",
            value: "lato",
            family: "Lato, sans-serif",
            premium: true
        },
        {
            label: "Roboto",
            value: "roboto",
            family: "Roboto, sans-serif",
            premium: true
        },
        {
            label: "Courier New",
            value: "courier-new",
            family: '"Courier New", monospace',
            premium: true
        },
        {
            label: "Consolas",
            value: "consolas",
            family: "Consolas, monospace",
            premium: true
        },
        {
            label: "Genericons",
            value: "genericons",
            family: "Genericons, sans-serif",
            premium: true
        },
        {
            label: "Oswald",
            value: "oswald",
            family: "Oswald, sans-serif",
            premium: true
        },
        {
            label: "Times New Roman",
            value: "times-new-roman",
            family: '"Times New Roman", serif',
            premium: true
        },
        {
            label: "PT Sans",
            value: "pt-sans",
            family: '"PT Sans", sans-serif',
            premium: true
        },
        {
            label: "Raleway",
            value: "raleway",
            family: "Raleway, sans-serif",
            premium: true
        },
        {
            label: "Upload Font",
            value: "uploadFont",
            family: '"ADAPT Uploaded Font", sans-serif',
            premium: true,
            upload: true
        }
    ],

    getFont(fontValue) {
        return (
            this.fonts.find(
                (font) => font.value === fontValue
            ) ||
            this.fonts.find(
                (font) => font.value === "page-default"
            )
        );
    },

    getFontDropdownHTML(premiumUnlocked = false) {
        return this.fonts
            .map((font) => {
                const locked =
                    font.premium && !premiumUnlocked;
                const lockMarkup = locked
                    ? '<span class="adapt-premium-lock" aria-hidden="true">🔒</span>'
                    : "";

                return `
                    <div
                        class="adapt-dropdown-item${
                            locked ? " adapt-locked-option" : ""
                        }"
                        data-value="${font.value}"
                        data-premium="${String(Boolean(font.premium))}"
                        data-upload="${String(Boolean(font.upload))}"
                        role="option"
                        aria-disabled="${String(locked)}"
                    >
                        <span>${font.label}</span>
                        ${lockMarkup}
                    </div>
                `;
            })
            .join("");
    },

    getFontStyles() {
        const fontFaces = this.fonts
            .filter((font) => font.url)
            .map(
                (font) => `
                    @font-face {
                        font-family: "${font.label}";
                        src: url("${font.url}") format("woff2");
                        font-style: normal;
                        font-weight: 400;
                        font-display: swap;
                    }
                `
            )
            .join("");

        const fontRules = this.fonts
            .filter(
                (font) =>
                    font.value !== "page-default" &&
                    !font.upload
            )
            .map(
                (font) => `
                    .adapt-dropdown-item[data-value="${font.value}"] {
                        font-family: ${font.family} !important;
                        font-style: normal !important;
                        font-weight: 400 !important;
                    }
                `
            )
            .join("");

        return fontFaces + fontRules;
    },

    stickerPacks: [
        {
            id: "text-annotation",
            label: "Text Annotation Pack",
            stickers: [
                {
                    id: "question",
                    label: "Question",
                    symbol: "?",
                    background: "#d4f1ff",
                    foreground: "#2874a6"
                },
                {
                    id: "important",
                    label: "Important",
                    symbol: "!",
                    background: "#ffc59e",
                    foreground: "#d3500d"
                },
                {
                    id: "star",
                    label: "Star",
                    symbol: "★",
                    background: "#ffe785",
                    foreground: "#faa300"
                },
                {
                    id: "check",
                    label: "Check",
                    symbol: "✓",
                    background: "#cff7f2",
                    foreground: "#396c6a"
                },
                {
                    id: "idea",
                    label: "Idea",
                    symbol: "💡",
                    background: "#ddaee4",
                    foreground: "#7b4384"
                }
            ]
        },
        {
            id: "study",
            label: "Study Pack",
            stickers: [
                {
                    id: "book",
                    label: "Book",
                    symbol: "📖",
                    background: "#d4f1ff",
                    foreground: "#2874a6"
                },
                {
                    id: "pencil",
                    label: "Pencil",
                    symbol: "✏️",
                    background: "#ffe785",
                    foreground: "#faa300"
                },
                {
                    id: "pin",
                    label: "Pin",
                    symbol: "📌",
                    background: "#ffc1db",
                    foreground: "#ed408b"
                },
                {
                    id: "search",
                    label: "Search",
                    symbol: "🔍",
                    background: "#cff7f2",
                    foreground: "#396c6a"
                },
                {
                    id: "brain",
                    label: "Brain",
                    symbol: "🧠",
                    background: "#ddaee4",
                    foreground: "#7b4384"
                }
            ]
        },
        {
            id: "encouragement",
            label: "Encouragement Pack",
            stickers: [
                {
                    id: "thumbs-up",
                    label: "Thumbs Up",
                    symbol: "👍",
                    background: "#d4f1ff",
                    foreground: "#2874a6"
                },
                {
                    id: "celebrate",
                    label: "Celebrate",
                    symbol: "🎉",
                    background: "#ffc1db",
                    foreground: "#ed408b"
                },
                {
                    id: "trophy",
                    label: "Trophy",
                    symbol: "🏆",
                    background: "#ffe785",
                    foreground: "#faa300"
                },
                {
                    id: "one-hundred",
                    label: "One Hundred",
                    symbol: "💯",
                    background: "#ff8a89",
                    foreground: "#b20000"
                },
                {
                    id: "sparkle",
                    label: "Sparkle",
                    symbol: "✨",
                    background: "#ddaee4",
                    foreground: "#7b4384"
                }
            ]
        }
    ],

    getStickerPack(packId) {
        return (
            this.stickerPacks.find(
                (pack) => pack.id === packId
            ) || this.stickerPacks[0]
        );
    },

    getSticker(packId, stickerId) {
        const pack = this.getStickerPack(packId);

        return (
            pack.stickers.find(
                (sticker) => sticker.id === stickerId
            ) || pack.stickers[0]
        );
    }
};