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

    btn.addEventListener("click", () => {
        if (btn.id === "adapt-dropdown-btn") return;
        if (btn.id === "adapt-bold" || btn.id === "adapt-italic" || btn.id === "adapt-underline") {
            if (activeButtons.has(btn.id)) {
                activeButtons.delete(btn.id);
                btn.style.background = "transparent";
            } else {
                activeButtons.add(btn.id);
                btn.style.background = selectedAlterationColor;
            }
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
    });

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
    inpt.style.display = "flex";
    inpt.style.alignItems = "center";
    inpt.style.justifyContent = "center";
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
