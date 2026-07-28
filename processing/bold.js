// Reversibly removes bold text without overwriting page inline styles.
(function initializeBoldControl() {
    "use strict";

    const style = document.createElement("style");
    style.id = "adapt-remove-bold-style";
    style.textContent = `
        html.adapt-extension-active.adapt-remove-bold
            body > :not(#adapt-host):not([data-adapt-owned]),
        html.adapt-extension-active.adapt-remove-bold
            body > :not(#adapt-host):not([data-adapt-owned]) * {
            font-weight: 400 !important;
        }
    `;
    document.head.appendChild(style);
})();

function toggleBold(shouldRemoveBold) {
    document.documentElement.classList.toggle(
        "adapt-remove-bold",
        Boolean(shouldRemoveBold)
    );
}
