
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

  btn.addEventListener("mouseenter", () => btn.style.background = hoverColor);
  btn.addEventListener("mouseleave", () => btn.style.background = "transparent");
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

// dropdown
const dropdownBtn = adaptShadow.getElementById("adapt-dropdown-btn");
const dropdownMenu = adaptShadow.getElementById("adapt-dropdown-menu");

dropdownBtn.addEventListener("click", () => {
  const isOpen = dropdownMenu.style.display === "block";
  dropdownMenu.style.display = isOpen ? "none" : "block";
});

// show dropdown 
adaptShadow.addEventListener("click", (e) => {
    if (!e.target.closest("#adapt-dropdown")) {
        dropdownMenu.style.display = "none";
    }
});

// hide dropdown when clicking outside
document.addEventListener("click", (e) => {
    const path = e.composedPath();
    const insideDropdown = path.some(el => el.id === "adapt-dropdown");
    if (!insideDropdown) {
        dropdownMenu.style.display = "none";
    }
});

// hover
adaptShadow.querySelectorAll(".adapt-dropdown-item").forEach(item => {
  item.style.padding = "8px 12px";
  item.style.cursor = "pointer";
  item.style.color = textColor;

  item.addEventListener("mouseenter", () => item.style.background = hoverColor);
  item.addEventListener("mouseleave", () => item.style.background = "transparent");

  item.addEventListener("click", () => {
    dropdownBtn.textContent = item.textContent + "▾";
    dropdownMenu.style.display = "none";
  });
});