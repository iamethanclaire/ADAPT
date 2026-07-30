// Handles Dictionary API requests outside the webpage's CORS context.
(function initializeADAPTBackground() {
    "use strict";

    const LOOKUP_MESSAGE =
        "adapt-dictionary-lookup";

    const DICTIONARY_ENDPOINT =
        "https://api.dictionaryapi.dev/api/v2/entries/en/";

    async function lookUpWord(word) {
        try {
            const response = await fetch(
                `${DICTIONARY_ENDPOINT}${encodeURIComponent(word)}`,
                {
                    method: "GET",
                    credentials: "omit",
                    headers: {
                        Accept: "application/json"
                    }
                }
            );

            if (response.status === 404) {
                return {
                    ok: false,
                    error: "not-found"
                };
            }

            if (response.status === 429) {
                return {
                    ok: false,
                    error: "rate-limited",
                    retryAfter:
                        response.headers.get(
                            "Retry-After"
                        ) || ""
                };
            }

            if (response.status >= 500) {
                return {
                    ok: false,
                    error: "server-error",
                    status: response.status
                };
            }

            if (!response.ok) {
                return {
                    ok: false,
                    error: "request-failed",
                    status: response.status
                };
            }

            const entries = await response.json();

            if (
                !Array.isArray(entries) ||
                !entries.length
            ) {
                return {
                    ok: false,
                    error: "invalid-response"
                };
            }

            return {
                ok: true,
                entries
            };
        } catch (error) {
            console.error(
                "[ADAPT] Dictionary request failed:",
                error
            );

            return {
                ok: false,
                error: "network-error"
            };
        }
    }

    chrome.runtime.onMessage.addListener(
        (message, sender, sendResponse) => {
            if (
                message?.type !==
                LOOKUP_MESSAGE
            ) {
                return false;
            }

            const word = String(
                message.word || ""
            )
                .trim()
                .toLowerCase();

            if (
                !word ||
                word.length > 100
            ) {
                sendResponse({
                    ok: false,
                    error: "invalid-word"
                });

                return false;
            }

            lookUpWord(word).then(sendResponse);

            // Keeps the message channel open while fetch() completes.
            return true;
        }
    );
})();