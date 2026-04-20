
const { bgColor, textColor, borderColor, inputColor, hoverColor, hoverSelectedToolColor, hoverSelectedAlterationColor, selectedToolColor, selectedAlterationColor, selectedInputBorderColor} = ADAPT;

const logoSrc = chrome.runtime.getURL("images/icon-48.png");
const logoInactiveSrc = chrome.runtime.getURL("images/icon-48-inactive.png");

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

// create tab
const tab = document.createElement("div");
tab.id = "adapt-tab";
tab.style.cssText = `
  position: fixed;
  top: 0;
  right: 12px;
  background: ${bgColor};
  padding: 2px 12px;
  border-radius: 0 0 8px 8px;
  cursor: pointer;
  z-index: 999999;
  display: none;
  font-size: 12px;
  border: 1px solid ${borderColor};
  border-top: none;
`;

// create host / shadow root
const host = document.createElement("div");
host.id = "adapt-host";
document.body.appendChild(host);
const shadow = host.attachShadow({ mode: "open" });

// add style reset
const reset = document.createElement("style");
reset.textContent = `
  button {
    all: revert;
    box-sizing: border-box;
    font-family: Arial, sans-serif;
    font-size: 14px;
  }
  input {
    all: revert;
    box-sizing: border-box;
    font-family: Arial, sans-serif;
    font-size: 14px;
  }
  div {
    all: revert;
    box-sizing: border-box;
  }
  .adapt-dropdown-item {
    font-size: 14px;
    font-weight: normal;
  }
`;
shadow.appendChild(reset);

toolbar.innerHTML = getToolbarHTML(logoSrc);
tab.innerHTML = getTabHTML(logoSrc);

shadow.appendChild(tab);
shadow.appendChild(toolbar);

// inject font styles
const fontStyle = document.createElement("style");
fontStyle.textContent = ADAPT.getFontStyles();
shadow.appendChild(fontStyle);

// preload fonts
ADAPT.fonts
    .filter(f => f.url)
    .forEach(f => {
        const font = new FontFace(f.label, `url(${f.url})`);
        font.load().then(loaded => {
            document.fonts.add(loaded);
        });
    });

document.body.style.marginTop = "48px";
// expose shadow to files
var adaptShadow = shadow;