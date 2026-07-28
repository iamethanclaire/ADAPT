// Reversibly removes italics without overwriting page inline styles.
(function initializeItalicsControl() {
    "use strict";

    const style = document.createElement("style");
    style.id = "adapt-remove-italics-style";
    style.textContent = `
        html.adapt-extension-active.adapt-remove-italics
            body > :not(#adapt-host):not([data-adapt-owned]),
        html.adapt-extension-active.adapt-remove-italics
            body > :not(#adapt-host):not([data-adapt-owned]) * {
            font-style: normal !important;
        }
    `;
    document.head.appendChild(style);
})();

function toggleItalics(shouldRemoveItalics) {
    document.documentElement.classList.toggle(
        "adapt-remove-italics",
        Boolean(shouldRemoveItalics)
    );
}
