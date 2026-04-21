// for light-dark theme
var ADAPT = {
    prefersDark: window.matchMedia("(prefers-color-scheme: dark)").matches,
    get bgColor() { return this.prefersDark ? "#1e1e1e" : "#ffffff";},
    get inputColor() { return this.prefersDark ? "#1e1e1e" : "#ffffff";},
    get textColor() { return this.prefersDark ? "#ffffff" : "#000000";},
    get borderColor() { return this.prefersDark ? "#444" : "#cccccc";},
    get hoverColor() { return this.prefersDark ? "#363636" : "#efefef"; },
    get hoverSelectedToolColor() { return this.prefersDark ? "#006fba" : "#95c9e6"; },
    get hoverSelectedAlterationColor() { return this.prefersDark ? "#ba0000" : "#ee655e"; },
    get menuColor() { return this.prefersDark ? "#1e1e1e" : "#ffffff"; },
    get selectedToolColor() { return this.prefersDark ? "#007acc" : "#9fd7f5"; },
    get selectedAlterationColor() { return this.prefersDark ? "#cc0000" : "rgb(250, 113, 106)"; },
    get selectedInputBorderColor() { return this.prefersDark ? "#ffffff" : "#1e1e1e"; },
    get lineColor() { return this.prefersDark ? "#888888" : "#666666"; },

    fonts: [
    { label: "Page Default", value: "page-default", family: "inherit" },
    { label: "Arial", value: "arial", family: "Arial, sans-serif"},
    { label: "Verdana", value: "verdana", family: "Verdana, sans-serif", url: chrome.runtime.getURL("fonts/Verdana.woff2") },
    { label: "Helvetica", value: "helvetica", family: "Helvetica, sans-serif", url: chrome.runtime.getURL("fonts/Helvetica.woff2") },
    { label: "Calibri", value: "calibri", family: "Calibri, sans-serif", url: chrome.runtime.getURL("fonts/Calibri.woff2") },
],

    getFontDropdownHTML() {
        return this.fonts
            .map(f => `<div class="adapt-dropdown-item" data-value="${f.value}">${f.label}</div>`)
            .join("");
    },

    getFontStyles() {
        const fontFaces = this.fonts
            .filter(f => f.url)
            .map(f => `
                @font-face {
                    font-family: "${f.label}";
                    src: url("${f.url}") format("woff2");
                    sans-serif !important;
                    font-weight: normal !important;
                }
            `).join("");

        const fontRules = this.fonts
            .map(f => `.adapt-dropdown-item[data-value="${f.value}"] { font-family: "${f.label}", sans-serif !important; font-weight: normal !important; }`)
            .join("\n");

        return fontFaces + fontRules;
    }
};