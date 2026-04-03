// for light-dark theme
var ADAPT = {
    prefersDark: window.matchMedia("(prefers-color-scheme: dark)").matches,
    get bgColor() { return this.prefersDark ? "#1e1e1e" : "#ffffff";},
    get inputColor() { return this.prefersDark ? "#1e1e1e" : "#ffffff";},
    get textColor() { return this.prefersDark ? "#ffffff" : "#000000";},
    get borderColor() { return this.prefersDark ? "#444" : "#cccccc";},
    get hoverColor() { return this.prefersDark ? "#363636" : "#efefef"; },
};