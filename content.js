// for light-dark theme

const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

const bgColor = prefersDark ? "#1e1e1e" : "#ffffff";
const textColor = prefersDark ? "#ffffff" : "#000000";
const borderColor = prefersDark ? "#444" : "#cccccc";

// create toolbar
const toolbar = document.createElement("div");
toolbar.id = "adapt-toolbar";
toolbar.style.cssText = `
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 48px;
  background: ${bgColor};
  color: ${textColor};
  z-index: 999999;
  display: flex;
  align-items: center;
  padding: 0;
  gap: 8px;
  border-bottom: 1px solid ${borderColor};
`;

// Create the tab to bring it back
const tab = document.createElement("div");
tab.id = "adapt-tab";
tab.innerText = "A";
tab.style.cssText = `
  position: fixed;
  top: 0;
  right: 12px;
  background: #1e1e1e;
  color: white;
  padding: 2px 12px;
  border-radius: 0 0 8px 8px;
  cursor: pointer;
  z-index: 999999;
  display: none;
  font-size: 12px;
`;
document.body.appendChild(tab);

// fetch image for A.D.A.P.T Logo
const logoSrc = chrome.runtime.getURL("images/icon-48.png");
const logoInactiveSrc = chrome.runtime.getURL("images/icon-48-inactive.png")

// inner html for toolbar
toolbar.innerHTML = `
  <img id="adapt-logo" src="${logoSrc}" alt="A.D.A.P.T" style="height: 32px; padding-left: 12px; padding-right: 24px;">

  <div id="adapt-dropdown" style="position: relative;">
    <button id="adapt-dropdown-btn">Normal Text▾</button>
    <div id="adapt-dropdown-menu" style="
      display: none;
      position: absolute;
      top: 100%;
      left: 0;
      background: ${bgColor};
      border: 1px solid ${borderColor};
      border-radius: 4px;
      min-width: 140px;
      z-index: 9999999;
    ">
      <div class="adapt-dropdown-item" data-value="p">Normal Text</div>
      <div class="adapt-dropdown-item" data-value="h1">Heading 1</div>
      <div class="adapt-dropdown-item" data-value="h2">Heading 2</div>
      <div class="adapt-dropdown-item" data-value="h3">Heading 3</div>
    </div>
  </div>

  <div style="width: 1px; height: 24px; background: ${borderColor};"></div>

  <button id="adapt-bold">
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="${textColor}" style="width: 18px; height: 18px;">
        <path stroke-linejoin="round" d="M6.75 3.744h-.753v8.25h7.125a4.125 4.125 0 0 0 0-8.25H6.75Zm0 0v.38m0 16.122h6.747a4.5 4.5 0 0 0 0-9.001h-7.5v9h.753Zm0 0v-.37m0-15.751h6a3.75 3.75 0 1 1 0 7.5h-6m0-7.5v7.5m0 0v8.25m0-8.25h6.375a4.125 4.125 0 0 1 0 8.25H6.75m.747-15.38h4.875a3.375 3.375 0 0 1 0 6.75H7.497v-6.75Zm0 7.5h5.25a3.75 3.75 0 0 1 0 7.5h-5.25v-7.5Z" />
    </svg>
  </button>

  <button id="adapt-italic">
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="${textColor}" style="width: 18px; height: 18px;">
        <path stroke-linecap="round" stroke-linejoin="round" d="M5.248 20.246H9.05m0 0h3.696m-3.696 0 5.893-16.502m0 0h-3.697m3.697 0h3.803" />
    </svg>
  </button>

   <button id="adapt-italic">
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="${textColor}" style="width: 18px; height: 18px;">
        <path stroke-linecap="round" stroke-linejoin="round" d="M17.995 3.744v7.5a6 6 0 1 1-12 0v-7.5m-2.25 16.502h16.5" />
    </svg>
  </button>

  <div style="width: 1px; height: 24px; background: ${borderColor};"></div>
  
  <button id="adapt-hide" style="margin-left: auto; margin-right: 12px;">
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="${textColor}" style="width: 18px; height: 18px;">
        <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 6.75 12 3m0 0 3.75 3.75M12 3v18" />
    </svg>
  </button>
`;

document.body.appendChild(toolbar);
document.body.style.marginTop = "48px";

toolbar.querySelectorAll("button").forEach(btn => {
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
    btn.style.background = borderColor;
  });
  btn.addEventListener("mouseleave", () => {
    btn.style.background = "transparent";
  });
});

// toggle active state
let isActive = true;
const logo = document.getElementById("adapt-logo");

logo.addEventListener("click", () => {
    isActive = !isActive;
    logo.src = isActive ? logoSrc : logoInactiveSrc;
});

// Hide toolbar
document.getElementById("adapt-hide").addEventListener("click", () => {
  toolbar.style.display = "none";
  document.body.style.marginTop = "0px";
  tab.style.display = "block";
});

// Show toolbar
tab.addEventListener("click", () => {
  toolbar.style.display = "flex";
  document.body.style.marginTop = "48px";
  tab.style.display = "none";
});

// style dropdown items
document.querySelectorAll(".adapt-dropdown-item").forEach(item => {
  item.style.padding = "8px 12px";
  item.style.cursor = "pointer";
  item.style.color = textColor;

  item.addEventListener("mouseenter", () => {
    item.style.background = borderColor;
  });
  item.addEventListener("mouseleave", () => {
    item.style.background = "transparent";
  });
});