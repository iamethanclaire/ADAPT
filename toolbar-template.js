// inner html for toolbar
function getToolbarHTML(logoSrc) {
    const { menuColor } = ADAPT;
    return `
        <img id="adapt-logo" src="${logoSrc}" alt="Toggle A.D.A.P.T. page changes" role="button" tabindex="0" style="height: 32px; margin-left: 16px; margin-right: 16px; cursor: pointer;">

        <div id="adapt-dropdown" style="position: relative; width: 120px; justify-content: space-between;">
            <button id="adapt-dropdown-btn" style="
                width: 120px;
                min-width: 120px;
                max-width: 120px;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                display: flex;
                justify-content: space-between;
                align-items: center;
                user-select: none;
            ">
                <span id="adapt-dropdown-label" style="flex: 1; text-align: left;">Page Default</span>
                <span id="adapt-dropdown-icon">▾</span>
            </button>
            
            <div id="adapt-dropdown-menu" style="
                display: none;
                position: absolute;
                top: 100%;
                left: 0;
                background:
                    var(
                        --adapt-toolbar-menu,
                        ${menuColor}
                    );
                border-radius: 4px;
                width: 130px;
                z-index: 9999999;
                max-height: 120px;
                overflow-y: scroll;
                overflow-x: hidden;
                box-shadow:
                    0 2px 8px
                    ${ADAPT.colors.shadowLight};
                user-select: none;
            ">
            ${ADAPT.getFontDropdownHTML(false)}
            </div>
        </div>

        <div class="adapt-divider" aria-hidden="true"></div>

        <button id="adapt-bold">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width: 18px; height: 18px;">
                <path stroke-linejoin="round" d="M6.75 3.744h-.753v8.25h7.125a4.125 4.125 0 0 0 0-8.25H6.75Zm                0 0v.38m0 16.122h6.747a4.5 4.5 0 0 0 0-9.001h-7.5v9h.753Zm                0 0v-.37m0-15.751h6a3.75 3.75 0 1 1 0 7.5h-6m0-7.5v7.5m0 0v8.25m0-8.25h6.375a4.125 4.125 0 0 1 0 8.25H6.75m.747-15.38h4.875a3.375 3.375 0 0 1 0 6.75H7.497v-6.75Zm                0 7.5h5.25a3.75 3.75 0 0 1 0 7.5h-5.25v-7.5Z" />
            </svg>
        </button>

        <button id="adapt-italic">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width: 18px; height: 18px;">
                <path stroke-linecap="round" stroke-linejoin="round" d="M5.248 20.246H9.05m0 0h3.696m-3.696 0 5.893-16.502m0 0h-3.697m3.697 0h3.803" />
            </svg>
        </button>

        <button
            id="adapt-justify"
            aria-label="Align page text by language direction"
            title="Align page text by language direction"
        >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width: 18px; height: 18px;">
                <path stroke-linecap="round" d="M4 6h16M4 10h11M4 14h16M4 18h9" />
            </svg>
        </button>

        <div id="adapt-underline-control" style="position: relative;">
            <button
                id="adapt-underline"
                aria-label="Underline"
                aria-haspopup="true"
                aria-expanded="false"
            >
                <svg xmlns="http://www.w3.org/2000/svg"" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width: 18px; height: 18px;">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M17.995 3.744v7.5a6 6 0 1 1-12 0v-7.5m-2.25 16.502h16.5" />
                </svg>
            </button>

            <div
                id="adapt-underline-menu"
                role="menu"
                aria-label="Underline colors"
                style="
                    display: none;
                    position: absolute;
                    top: 100%;
                    left: 0%;
                    width: max-content;
                    padding: 8px;
                    border-radius: 8px;
                    background: var(--adapt-toolbar-menu);
                    box-shadow: 0 2px 8px ${ADAPT.colors.shadowLight};
                    z-index: 9999999;
                "
            ></div>
        </div>

        <div class="adapt-divider" aria-hidden="true"></div>

        <button id="adapt-decrease-size">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width: 18px; height: 18px;">
            <path stroke-linecap="round" stroke-linejoin="round" d="M11.5 13.5H4.5M21 7.5H14M14 19L8 4L2 19"/>
            </svg>
        </button>

        <input class="adapt-value-input" id="adapt-size-value" type="text" name="adapt-size" aria-label="Text size percentage" placeholder="100%" style="width: auto; max-width: 48px; height: 28px;">

        <button id="adapt-increase-size">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width: 18px; height: 18px;">
                <path stroke-linecap="round" stroke-linejoin="round" d="M11.5 13.5H4.5M17.5 4V11M21 7.5H14M14 19L8 4L2 19"/>
            </svg>
        </button>

        <div class="adapt-divider" aria-hidden="true"></div>

        <button id="adapt-decrease-leading">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width: 18px; height: 18px;">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 13V19M19 13L21 16.2727M19 13L17 16.2727" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 10L19 4M19 10L17 6.72727M19 10L21 6.72727" />
                <path stroke-linecap="round" d="M3 9.5H14" />
                <path stroke-linecap="round" d="M3 14H14" />
                <path stroke-linecap="round" d="M3 18.5H14" />
                <path stroke-linecap="round" d="M3 5H14" />
            </svg>
        </button>

        <input class="adapt-value-input" id="adapt-leading-value" type="text" name="adapt-leading" aria-label="Line spacing percentage" placeholder="100%" style="width: auto; max-width: 48px; height: 28px;">

        <button id="adapt-increase-leading">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width: 18px; height: 18px;">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 19V10M19 19L21 15.7273M19 19L17 15.7273" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 4L19 10M19 4L17 7.27273M19 4L21 7.27273" />
                <path stroke-linecap="round" d="M3 9.5H14" />
                <path stroke-linecap="round" d="M3 14H14" />
                <path stroke-linecap="round" d="M3 18.5H14" />
                <path stroke-linecap="round" d="M3 5H14"/>
            </svg>
        </button>

        <div class="adapt-divider" aria-hidden="true"></div>

        <button id="adapt-decrease-spacing">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width: 18px; height: 18px;">
                <path stroke-linecap="round" stroke-linejoin="round" d="M8.75001 11.7595L3.25004 11.7755M8.75001 11.7595L5.75876 14.7682M8.75001 11.7595L5.7413 8.7682" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M15.25 11.7405L20.75 11.7245M15.25 11.7405L18.2412 8.73183M15.25 11.7405L18.2587 14.7318" />
                <path stroke-linecap="round" d="M11.7282 4.25076L11.7718 19.2507"/>
            </svg>
        </button>

        <input class="adapt-value-input" id="adapt-spacing-value" type="text" name="adapt-spacing" aria-label="Letter spacing percentage" placeholder="100%" style="width: auto; max-width: 48px; height: 28px;">

        <button id="adapt-increase-spacing">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width: 18px; height: 18px;">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3.25004 11.7595L8.75002 11.7755M3.25004 11.7595L6.2413 14.7682M3.25004 11.7595L6.25876 8.7682" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M20.75 11.7405L15.25 11.7245M20.75 11.7405L17.7587 8.73183M20.75 11.7405L17.7412 14.7318"/>
                <path stroke-linecap="round" d="M11.7282 4.25076L11.7718 19.2507" />
            </svg>
        </button>

        <div class="adapt-divider" aria-hidden="true"></div>

        <div id="adapt-highlight-control" style="position: relative;">
            <button
                id="adapt-highlight"
                aria-label="Highlighter"
                aria-haspopup="true"
                aria-expanded="false"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width: 18px; height: 18px;">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12.0078 18.0421L21.6847 5.26093L17.8944 2L6.70136 13.4768M12.0078 18.0421L6.70136 13.4768M12.0078 
                    18.0421L7.88292 19.7699L7.23073 20.528M6.70136 13.4768L5.60874 17.8134L4.95656 18.5714M7.23073 20.528L4.95656 18.5714M7.23073 20.528L5.92636 22.0441L3 20.8456L4.95656 18.5714"/>
                </svg>
            </button>

            <div
                id="adapt-highlight-menu"
                role="menu"
                aria-label="Highlighter colors"
                style="
                    display: none;
                    position: absolute;
                    top: 100%;
                    left: 0%;
                    width: max-content;
                    padding: 8px;
                    border-radius: 8px;
                    background: var(--adapt-toolbar-menu);
                    box-shadow: 0 2px 8px ${ADAPT.colors.shadowLight};
                    z-index: 9999999;
                "
            ></div>
        </div>

        <button id="adapt-line-guide">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width: 18px; height: 18px;">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13.7 7.68857C13.7 7.49159 13.7407 8.49378 13.8199 8.31179C13.899 8.12981 14.0151 7.96445 
                14.1613 7.82516C14.3076 7.68587 14.4812 7.57538 14.6723 7.5C14.8634 7.42462 15.0682 7.38582 15.275 7.38582C15.4818 7.38582 15.6866 7.42462 15.8777 
                7.5C16.0688 7.57538 16.2424 7.68587 16.3887 7.82516C16.5349 7.96445 16.651 8.12981 16.7301 8.31179C16.8093 8.49378 16.85 9.47132 16.85 9.6683L16.85 
                9.84787M13.7 7.68857C13.7 7.29075 13.5341 6.90922 13.2387 6.62791C12.9433 6.34661 12.5427 6.18857 12.125 6.18857C11.7073 6.18857 11.3067 6.34661 11.0113 
                6.62791C10.7159 6.90922 10.55 7.29075 10.55 7.68857L10.55 3.92857M13.7 7.68857V10.7292M16.85 9.84787C16.85 9.45004 17.0159 9.06851 17.3113 8.78721C17.6067 
                8.5059 18.0073 8.34787 18.425 8.34787C18.8427 8.34787 19.2433 8.5059 19.5387 8.78721C19.8341 9.06851 20 9.45004 20 9.84787L20 14.5714C20 16.2764 19.2888
                 17.9115 18.023 19.1171C16.7571 20.3227 15.0402 21 13.25 21H11.232C9.83967 20.9998 8.50444 20.473 7.52 19.5352L5.788 17.8857C4.80339 16.9481 4.25016 
                 15.6765 4.25 14.3505L4.247 12.4229C4.24602 12.2542 4.1748 12.0929 4.049 11.9743C3.9027 11.835 3.78666 11.6695 3.70749 11.4875C3.62831 11.3055
                  3.58756 11.1104 3.58756 10.9133C3.58756 10.7163 3.62831 10.5212 3.70749 10.3391C3.78666 10.1571 3.9027 9.9917 4.049 9.85238C4.19529 9.71305 
                  4.36897 9.60253 4.56011 9.52713C4.75125 9.45172 4.95611 9.41291 5.163 9.41291C5.36989 9.41291 5.57475 9.45172 5.76589 9.52713C5.95703 9.60253 
                  6.13071 9.71305 6.277 9.85238C6.99054 10.531 7.39317 11.451 7.397 12.4114M16.85 9.84787L16.85 11.3191M10.55 3.92857V10.2857M10.55 3.92857C10.55 
                  3.53074 10.3841 3.14921 10.0887 2.86791C9.79332 2.5866 9.39271 2.42857 8.975 2.42857C8.55728 2.42857 8.15668 2.5866 7.86131 2.86791C7.56594 3.14921 
                  7.4 3.53074 7.4 3.92857V13.8571H7.398"/>
            </svg>
        </button>

        <div id="adapt-note-control" style="position: relative;">
            <button
                id="adapt-note"
                aria-label="Notes"
                aria-haspopup="true"
                aria-expanded="false"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width: 18px; height: 18px;">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M21 15V4H4V21H14M21 15L14 21M21 15H14V21"/>
                </svg>
            </button>

            <div
                id="adapt-note-menu"
                role="menu"
                aria-label="Note colors"
                style="
                    display: none;
                    position: absolute;
                    top: 100%;
                    left: 0%;
                    width: max-content;
                    padding: 8px;
                    border-radius: 8px;
                    background: var(--adapt-toolbar-menu);
                    box-shadow: 0 2px 8px ${ADAPT.colors.shadowLight};
                    z-index: 9999999;
                "
            ></div>
        </div>

        <div id="adapt-sticker-control" style="position: relative;">
            <button
                id="adapt-sticker"
                aria-label="Stickers"
                aria-haspopup="true"
                aria-expanded="false"
                style="position: relative;"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width: 18px; height: 18px;">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M7.5 3.75h9A3.75 3.75 0 0 1 20.25 7.5v6.75L14.25 20.25H7.5A3.75 3.75 0 0 1 3.75 16.5v-9A3.75 3.75 0 0 1 7.5 3.75Z"/>
                    <path stroke-linecap="round" stroke-linejoin="round" d="M14.25 20.25v-3a3 3 0 0 1 3-3h3M8.25 9.5h.01M15.75 9.5h.01M8.75 13.25c.9 1.1 2 1.65 3.25 1.65s2.35-.55 3.25-1.65"/>
                </svg>
                <span
                    id="adapt-sticker-lock"
                    class="adapt-button-lock"
                    aria-hidden="true"
                >🔒</span>
            </button>

            <div
                id="adapt-sticker-menu"
                role="menu"
                aria-label="Sticker choices"
                style="
                    display: none;
                    position: absolute;
                    top: 100%;
                    left: 0%;
                    width: max-content;
                    padding: 8px;
                    border-radius: 8px;
                    background: var(--adapt-toolbar-menu);
                    box-shadow: 0 2px 8px ${ADAPT.colors.shadowLight};
                    z-index: 9999999;
                "
            ></div>
        </div>

        <div class="adapt-divider" aria-hidden="true"></div>

        <button id="adapt-define">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width: 18px; height: 18px;">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305
                 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
            </svg>
        </button>

        <button id="adapt-speak">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width: 18px; height: 18px;">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75
                 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 
                 3.63 8.25 4.51 8.25H6.75Z" />
            </svg>
        </button>

        <div class="adapt-divider" aria-hidden="true"></div>

        <button id="adapt-settings">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width: 18px; height: 18px;">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 
                1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 
                1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 
                0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 
                .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 
                1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            </svg>
        </button>

        <div class="adapt-divider" aria-hidden="true"></div>

        
        <button id="adapt-hide" style="margin-left: auto; margin-right: 12px;">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width: 18px; height: 18px;">
                <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 6.75 12 3m0 0 3.75 3.75M12 3v18" />
            </svg>
        </button>
        `;
}

function getTabHTML(logoSrc) {
    return `<img id="adapt-tab-logo" src="${logoSrc}" alt="Show" style="height: 16px; padding-left: 4px; padding-right: 4px;">`
}