// const { act } = require("react");

// inject font styles
const style = document.createElement("style");
style.textContent = ADAPT.getFontStyles();
adaptShadow.appendChild(style);

// for communication with backend
const activeButtons = new Set();

// style buttons
adaptShadow.querySelectorAll("button").forEach(btn => {
    btn.style.background = "transparent";
    btn.style.color = textColor;
    btn.style.border = "none";
    btn.style.padding = "4px 8px";
    btn.style.borderRadius = "4px";
    btn.style.cursor = "pointer";
    btn.style.display = "flex";
    btn.style.alignItems = "center";
    btn.style.justifyContent = "center";

    btn.addEventListener("mouseenter", () => {
        const hoverBg = activeButtons.has(btn.id) ? (btn.id === "adapt-bold" || btn.id === "adapt-italic" || btn.id === "adapt-underline" ? hoverSelectedAlterationColor : hoverSelectedToolColor) : hoverColor;
        btn.style.background = hoverBg;
    });
    btn.addEventListener("mouseleave", () => {
        if (btn.id === "adapt-dropdown-btn" && dropdownMenu.style.display === "block") return;
        if (activeButtons.has(btn.id)) { // keep highlight if active
            if (btn.id === "adapt-bold" || btn.id === "adapt-italic" || btn.id === "adapt-underline") {
                btn.style.background = selectedAlterationColor;
            } else {
                btn.style.background = selectedToolColor;
            }
        }
        else { btn.style.background = "transparent" };
    });
});

// input for buttons
adaptShadow.querySelectorAll("button").forEach(btn => {
    btn.addEventListener("click", () => {
        if (btn.id === "adapt-dropdown-btn") return;
        if (btn.id === "adapt-underline") {
            if (activeButtons.has(btn.id)) {
                activeButtons.delete(btn.id);
                btn.style.background = "transparent";
            } else {
                activeButtons.add(btn.id);
                btn.style.background = selectedAlterationColor;
            }
            toggleUnderline(activeButtons.has(btn.id));
        }

        if(btn.id === "adapt-bold") {
            if (activeButtons.has(btn.id)) {
                activeButtons.delete(btn.id);
                btn.style.background = "transparent";
            } else {
                activeButtons.add(btn.id);
                btn.style.background = selectedAlterationColor;
            }
            toggleBold(activeButtons.has(btn.id));
        }

        if(btn.id === "adapt-italic") {
            if (activeButtons.has(btn.id)) {
                activeButtons.delete(btn.id);
                btn.style.background = "transparent";
            } else {
                activeButtons.add(btn.id);
                btn.style.background = selectedAlterationColor;
            }
            toggleItalics(activeButtons.has(btn.id));
        }
        
        if (btn.id === "adapt-highlight") {
            if (activeButtons.has(btn.id)) {
                activeButtons.delete(btn.id);
                btn.style.background = "transparent";
            } else {
                activeButtons.add(btn.id);
                activeButtons.delete("adapt-define");
                activeButtons.delete("adapt-speak");
                activeButtons.delete("adapt-line-guide");
                activeButtons.delete("adapt-note");
                adaptShadow.getElementById("adapt-define").style.background = "transparent";
                adaptShadow.getElementById("adapt-speak").style.background = "transparent";
                adaptShadow.getElementById("adapt-line-guide").style.background = "transparent";
                adaptShadow.getElementById("adapt-note").style.background = "transparent";
                btn.style.background = selectedToolColor;
            }
        } else if (btn.id === "adapt-define") {
            if (activeButtons.has(btn.id)) {
                activeButtons.delete(btn.id);
                btn.style.background = "transparent";
            } else {
                activeButtons.add(btn.id);
                activeButtons.delete("adapt-highlight");
                activeButtons.delete("adapt-speak");
                activeButtons.delete("adapt-line-guide");
                activeButtons.delete("adapt-note");
                adaptShadow.getElementById("adapt-highlight").style.background = "transparent";
                adaptShadow.getElementById("adapt-speak").style.background = "transparent";
                adaptShadow.getElementById("adapt-line-guide").style.background = "transparent";
                adaptShadow.getElementById("adapt-note").style.background = "transparent";
                btn.style.background = selectedToolColor;
            }
        } else if (btn.id === "adapt-speak") {
            if (activeButtons.has(btn.id)) {
                activeButtons.delete(btn.id);
                btn.style.background = "transparent";
            } else {
                activeButtons.add(btn.id);
                activeButtons.delete("adapt-highlight");
                activeButtons.delete("adapt-define");
                activeButtons.delete("adapt-line-guide");
                activeButtons.delete("adapt-note");
                adaptShadow.getElementById("adapt-highlight").style.background = "transparent";
                adaptShadow.getElementById("adapt-define").style.background = "transparent";
                adaptShadow.getElementById("adapt-line-guide").style.background = "transparent";
                adaptShadow.getElementById("adapt-note").style.background = "transparent";
                btn.style.background = selectedToolColor;
            }
        } else if (btn.id === "adapt-line-guide") {
            if (activeButtons.has(btn.id)) {
                activeButtons.delete(btn.id);
                btn.style.background = "transparent";
            } else {
                activeButtons.add(btn.id);
                activeButtons.delete("adapt-highlight");
                activeButtons.delete("adapt-speak");
                activeButtons.delete("adapt-define");
                activeButtons.delete("adapt-note");
                adaptShadow.getElementById("adapt-highlight").style.background = "transparent";
                adaptShadow.getElementById("adapt-define").style.background = "transparent";
                adaptShadow.getElementById("adapt-speak").style.background = "transparent";
                adaptShadow.getElementById("adapt-note").style.background = "transparent";
                btn.style.background = selectedToolColor;
            }
        } else if (btn.id === "adapt-note") {
            if (activeButtons.has(btn.id)) {
                activeButtons.delete(btn.id);
                btn.style.background = "transparent";
            } else {
                activeButtons.add(btn.id);
                activeButtons.delete("adapt-highlight");
                activeButtons.delete("adapt-speak");
                activeButtons.delete("adapt-define");
                activeButtons.delete("adapt-line-guide");
                adaptShadow.getElementById("adapt-highlight").style.background = "transparent";
                adaptShadow.getElementById("adapt-define").style.background = "transparent";
                adaptShadow.getElementById("adapt-speak").style.background = "transparent";
                adaptShadow.getElementById("adapt-line-guide").style.background = "transparent";
                btn.style.background = selectedToolColor;
            }
        }

        // reference size.js
        if (btn.id === "adapt-decrease-size") {
            decreaseSize();
        } else if (btn.id === "adapt-increase-size") {
            increaseSize();
        }

        // reference leading.js
        if (btn.id === "adapt-decrease-leading") {
            decreaseLeading();
        } else if (btn.id === "adapt-increase-leading") {
            increaseLeading();
        }

        // reference spacing.js
        if (btn.id === "adapt-decrease-spacing") {
            decreaseSpacing();
        } else if (btn.id === "adapt-increase-spacing") {
            increaseSpacing();
        }

    });
});

// keyboard shortcuts
document.addEventListener("keydown", (e) => {
    const tag = e.target.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || e.target.isContentEditable) return;

    const ctrlOrMeta = e.ctrlKey || e.metaKey;
    const shift = e.shiftKey;
    const alt = e.altKey;
    const key = e.key.toUpperCase();

    // Ctrl+Shift+letter for text formatting
    if (ctrlOrMeta && shift && !alt) {
        switch (key) {
            case "P": e.preventDefault(); logo.click(); break
            case "H": e.preventDefault(); adaptShadow.getElementById("adapt-highlight").click(); break;
            case "B": e.preventDefault(); adaptShadow.getElementById("adapt-bold").click(); break;
            case "I": e.preventDefault(); adaptShadow.getElementById("adapt-italic").click(); break;
            case "U": e.preventDefault(); adaptShadow.getElementById("adapt-underline").click(); break;
            case "L": e.preventDefault(); adaptShadow.getElementById("adapt-line-guide").click(); break;
            case "D": e.preventDefault(); adaptShadow.getElementById("adapt-define").click(); break;
            case "S": e.preventDefault(); adaptShadow.getElementById("adapt-speak").click(); break;
            case "J": e.preventDefault(); adaptShadow.getElementById("adapt-note").click(); break;
            case "E": e.preventDefault();
                if (toolbar.style.display === "none") {
                    tab.click();
                } else {
                    adaptShadow.getElementById("adapt-hide").click();
                }
                break;
        }
    }

    // Ctrl+Alt+number for sizing and spacing
    if (e.ctrlKey && alt && !shift) {
        switch (e.key) {
            case "ArrowUp": e.preventDefault(); adaptShadow.getElementById("adapt-increase-leading").click(); break;
            case "ArrowDown": e.preventDefault(); adaptShadow.getElementById("adapt-decrease-leading").click(); break;
            case "ArrowLeft": e.preventDefault(); adaptShadow.getElementById("adapt-decrease-spacing").click(); break;
            case "ArrowRight": e.preventDefault(); adaptShadow.getElementById("adapt-increase-spacing").click(); break;
            case ".": e.preventDefault(); adaptShadow.getElementById("adapt-increase-size").click(); break;
            case ",": e.preventDefault(); adaptShadow.getElementById("adapt-decrease-size").click(); break;
        }
    }
});

// dropdown
const dropdownBtn = adaptShadow.getElementById("adapt-dropdown-btn");
const dropdownMenu = adaptShadow.getElementById("adapt-dropdown-menu");
const dropdownArrow = adaptShadow.getElementById("adapt-dropdown-icon");

dropdownBtn.addEventListener("click", () => {
    const isOpen = dropdownMenu.style.display === "block";
    dropdownMenu.style.display = isOpen ? "none" : "block";
    dropdownArrow.style.transform = isOpen ? "rotate(0deg)" : "rotate(180deg) translateY(-2px)";    // change arrow direction
    dropdownBtn.style.background = isOpen ? "transparent" : hoverColor;
});

// close when clicking elsewhere inside shadow
adaptShadow.addEventListener("click", (e) => {
    if (!e.target.closest("#adapt-dropdown")) {
        dropdownMenu.style.display = "none";
        dropdownArrow.style.transform = "rotate(0deg)";
        dropdownBtn.style.background = "transparent";
    }
});

// close when clicking outside shadow
document.addEventListener("click", (e) => {
    const path = e.composedPath();
    const insideDropdown = path.some(el => el.id === "adapt-dropdown");
    if (!insideDropdown) {
        dropdownMenu.style.display = "none";
        dropdownArrow.style.transform = "rotate(0deg)";
        dropdownBtn.style.background = "transparent";
    }
});

// hover over dropdown items
adaptShadow.querySelectorAll(".adapt-dropdown-item").forEach(item => {
    item.style.padding = "8px 12px";
    item.style.cursor = "pointer";
    item.style.color = textColor;
    item.style.borderBottom = `1px solid ${borderColor}`;

    item.addEventListener("mouseenter", () => item.style.background = hoverColor);
    item.addEventListener("mouseleave", () => item.style.background = "transparent");
    item.addEventListener("click", () => {
        const font = item.getAttribute("data-value");
        const fontObj = ADAPT.fonts.find(f => f.value === font);
        const label = adaptShadow.getElementById("adapt-dropdown-label");
        label.textContent = item.textContent;
        dropdownArrow.style.transform = "rotate(0deg)";
        label.style.fontFamily = font === "page-default" ? "inherit" : `"${fontObj.label}", sans-serif`;
        dropdownMenu.style.display = "none";
        dropdownBtn.style.background = "transparent";
    });
});

// style inputs
adaptShadow.querySelectorAll("input").forEach(inpt => {
    inpt.style.background = inputColor;
    inpt.style.color = textColor;
    inpt.style.fontSize = "12px";
    inpt.style.border = `1px solid ${borderColor}`;
    inpt.style.padding = "4px 8px";
    inpt.style.borderRadius = "4px";
    inpt.style.cursor = "text";
    inpt.style.textAlign = "center";
    inpt.style.outline = "none";
    inpt.style.display = "flex";
    inpt.style.alignItems = "center";
    inpt.style.justifyContent = "center";
});

// add focus and blur handlers to all inputs, change border color
adaptShadow.querySelectorAll("input").forEach(inpt => {
    inpt.addEventListener("focus", (e) => {
        e.target.style.border = `1px solid ${selectedInputBorderColor}`;
    });
    inpt.addEventListener("blur", (e) => {
        e.target.style.border = `1px solid ${borderColor}`;
    });
});

// toggle active state
let isActive = true;
const logo = adaptShadow.getElementById("adapt-logo");
logo.addEventListener("click", () => {
    isActive = !isActive;
    logo.src = isActive ? logoSrc : logoInactiveSrc;
});

// hide/show toolbar
adaptShadow.getElementById("adapt-hide").addEventListener("click", () => {
    toolbar.style.display = "none";
    document.body.style.marginTop = "0px";
    tab.style.display = "block";
});

tab.addEventListener("click", () => {
    toolbar.style.display = "flex";
    document.body.style.marginTop = "48px";
    tab.style.display = "none";
});
