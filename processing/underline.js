// Reversibly removes underlines without overwriting page inline styles.
(function initializeUnderlineControl() {
    "use strict";

    const style = document.createElement("style");
    style.id = "adapt-remove-underline-style";
    style.textContent = `
        html.adapt-extension-active.adapt-remove-underline
            body > :not(#adapt-host):not([data-adapt-owned]),
        html.adapt-extension-active.adapt-remove-underline
            body > :not(#adapt-host):not([data-adapt-owned]) * {
            text-decoration: none !important;
        }
    `;
    document.head.appendChild(style);
})();

function toggleUnderline(shouldRemoveUnderline) {
    document.documentElement.classList.toggle(
        "adapt-remove-underline",
        Boolean(shouldRemoveUnderline)
    );
}
