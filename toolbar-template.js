// inner html for toolbar

function getToolbarHTML(logoSrc) {
    const { textColor, borderColor, bgColor } = ADAPT;
    return `
        <img id="adapt-logo" src="${logoSrc}" alt="A.D.A.P.T" style="height: 32px; margin-left: 16px; margin-right: 16px;">

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

        <button id="adapt-underline">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="${textColor}" style="width: 18px; height: 18px;">
                <path stroke-linecap="round" stroke-linejoin="round" d="M17.995 3.744v7.5a6 6 0 1 1-12 0v-7.5m-2.25 16.502h16.5" />
            </svg>
        </button>

        <div style="width: 1px; height: 24px; background: ${borderColor};"></div>

        <button id="adapt-decrease-size">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="${textColor}" style="width: 18px; height: 18px;">
            <path stroke-linecap="round" stroke-linejoin="round" d="M11.5 13.5H4.5M21 7.5H14M14 19L8 4L2 19"/>
            </svg>
        </button>

        <input id="adapt-size-value" type="text" name="adapt-size" placeholder="100%" style="width: auto; max-width: 48px; height: 28px;">

        <button id="adapt-increase-size">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="${textColor}" style="width: 18px; height: 18px;">
                <path stroke-linecap="round" stroke-linejoin="round" d="M11.5 13.5H4.5M17.5 4V11M21 7.5H14M14 19L8 4L2 19"/>
            </svg>
        </button>

        <div style="width: 1px; height: 24px; background: ${borderColor};"></div>

        <button id="adapt-decrease-leading">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="${textColor}" style="width: 18px; height: 18px;">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 13V19M19 13L21 16.2727M19 13L17 16.2727" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 10L19 4M19 10L17 6.72727M19 10L21 6.72727" />
                <path stroke-linecap="round" d="M3 9.5H14" />
                <path stroke-linecap="round" d="M3 14H14" />
                <path stroke-linecap="round" d="M3 18.5H14" />
                <path stroke-linecap="round" d="M3 5H14" />
            </svg>
        </button>

        <input id="adapt-ldeading-value" type="text" name="adapt-size" placeholder="100%" style="width: auto; max-width: 48px; height: 28px;">

        <button id="adapt-increase-leading">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="${textColor}" style="width: 18px; height: 18px;">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 19V10M19 19L21 15.7273M19 19L17 15.7273" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 4L19 10M19 4L17 7.27273M19 4L21 7.27273" />
                <path stroke-linecap="round" d="M3 9.5H14" />
                <path stroke-linecap="round" d="M3 14H14" />
                <path stroke-linecap="round" d="M3 18.5H14" />
                <path stroke-linecap="round" d="M3 5H14"/>
            </svg>
        </button>

        <div style="width: 1px; height: 24px; background: ${borderColor};"></div>

        <button id="adapt-decrease-spacing">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="${textColor}" style="width: 18px; height: 18px;">
                <path stroke-linecap="round" stroke-linejoin="round" d="M8.75001 11.7595L3.25004 11.7755M8.75001 11.7595L5.75876 14.7682M8.75001 11.7595L5.7413 8.7682" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M15.25 11.7405L20.75 11.7245M15.25 11.7405L18.2412 8.73183M15.25 11.7405L18.2587 14.7318" />
                <path stroke-linecap="round" d="M11.7282 4.25076L11.7718 19.2507"/>
            </svg>
        </button>

        <input id="adapt-ldeading-spacing" type="text" name="adapt-size" placeholder="100%" style="width: auto; max-width: 48px; height: 28px;">

        <button id="adapt-increase-spacing">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="${textColor}" style="width: 18px; height: 18px;">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3.25004 11.7595L8.75002 11.7755M3.25004 11.7595L6.2413 14.7682M3.25004 11.7595L6.25876 8.7682" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M20.75 11.7405L15.25 11.7245M20.75 11.7405L17.7587 8.73183M20.75 11.7405L17.7412 14.7318"/>
                <path stroke-linecap="round" d="M11.7282 4.25076L11.7718 19.2507" />
            </svg>
        </button>

        <div style="width: 1px; height: 24px; background: ${borderColor};"></div>

        <button id="adapt-define">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="${textColor}" style="width: 18px; height: 18px;">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
            </svg>
        </button>

        <button id="adapt-speak">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="${textColor}" style="width: 18px; height: 18px;">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" />
            </svg>
        </button>

        <div style="width: 1px; height: 24px; background: ${borderColor};"></div>

        <button id="adapt-settings">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="${textColor}" style="width: 18px; height: 18px;">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            </svg>
        </button>

        <div style="width: 1px; height: 24px; background: ${borderColor};"></div>

        
        <button id="adapt-hide" style="margin-left: auto; margin-right: 12px;">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="${textColor}" style="width: 18px; height: 18px;">
                <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 6.75 12 3m0 0 3.75 3.75M12 3v18" />
            </svg>
        </button>
        `;
}

function getTabHTML(logoSrc) {
    return `<img id="adapt-tab-logo" src="${logoSrc}" alt="Show" style="height: 16px; padding-left: 4px; padding-right: 4px;">`
}