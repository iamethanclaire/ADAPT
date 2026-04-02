// create toolbar
const toolbar = document.createElement("div");
toolbar.id = "adapt-toolbar";
toolbar.style.cssText = `
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 48px;
  background: #1e1e1e;
  color: white;
  z-index: 999999;
  display: flex;
  align-items: center;
  padding: 0 16px;
  gap: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
`;

// fetch image for A.D.A.P.T Logo
const logoSrc = chrome.runtime.getURL("images/icon-48.png");
const logoInactiveSrc = chrome.runtime.getURL("images/icon-48-inactive.png")

// inner html for toolbar
toolbar.innerHTML = `
  <img id="adapt-logo" src="${logoSrc}" alt="A.D.A.P.T" style="height: 32px;">
  <button id="adapt-bold">Bold</button>
  <button id="adapt-italic">Italic</button>
`;

document.body.appendChild(toolbar);
document.body.style.marginTop = "48px";

// toggle active state
let isActive = true;
const logo = document.getElementById("adapt-logo");

logo.addEventListener("click", () => {
    isActive = !isActive;
    logo.src = isActive ? logoSrc : logoInactiveSrc;
});