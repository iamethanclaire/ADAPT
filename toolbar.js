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
                btn.style.background = selectedColor;
            }
        }
    });

    btn.addEventListener("mouseenter", () => btn.style.background = hoverColor);
    btn.addEventListener("mouseleave", () => {
        if (btn.id === "adapt-dropdown-btn" && dropdownMenu.style.display === "block") return;
        if (activeButtons.has(btn.id)) return; // keep highlight if active
        btn.style.background = "transparent";
    });
});

// dropdown
const dropdownBtn = adaptShadow.getElementById("adapt-dropdown-btn");
const dropdownMenu = adaptShadow.getElementById("adapt-dropdown-menu");
const dropdownArrow = adaptShadow.getElementById("adapt-dropdown-icon");

dropdownBtn.addEventListener("click", () => {
    const isOpen = dropdownMenu.style.display === "block";
    dropdownMenu.style.display = isOpen ? "none" : "block";
    dropdownArrow.style.transform = isOpen ? "rotate(0deg)" : "rotate(180deg) translateY(-2px)";
    dropdownBtn.style.background = isOpen ? "transparent" : hoverColor;
});

// close when clicking elsewhere inside shadow
adaptShadow.addEventListener("click", (e) => {
    if (!e.target.closest("#adapt-dropdown")) {
        dropdownMenu.style.display = "none";
        dropdownArrow.textContent = "▾";
        dropdownBtn.style.background = "transparent";
    }
});

// close when clicking outside shadow
document.addEventListener("click", (e) => {
    const path = e.composedPath();
    const insideDropdown = path.some(el => el.id === "adapt-dropdown");
    if (!insideDropdown) {
        dropdownMenu.style.display = "none";
        dropdownArrow.textContent = "▾";
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
