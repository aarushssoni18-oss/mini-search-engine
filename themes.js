
/* ============================================================
   MINI SEARCH — THEME CONTROLLER
   ============================================================ */

(() => {

    "use strict";


    const THEME_KEY =
        "mini_search_theme";

    const WELCOME_KEY =
        "mini_search_theme_welcome_seen";


    const THEMES = {

        "classic-blue": "Classic Blue",
        "sky-blue": "Sky Blue",
        "black-neon": "Black & Neon Blue",
        "forest-green": "Forest Green",
        "royal-purple": "Royal Purple",
        "sunset-orange": "Sunset Orange",
        "adobe-red": "Adobe Red",
        "dark-slate": "Dark Slate",
        "ocean-teal": "Ocean Teal",
        "graphite-gold": "Graphite Gold",
        "burgundy-rose": "Burgundy Rose"

    };


    function getCurrentTheme() {

        return (
            localStorage.getItem(
                THEME_KEY
            )
            || "dark-slate"
        );

    }


    function applyTheme(theme) {

        if (!THEMES[theme]) {

            theme =
                "classic-blue";

        }


        document.documentElement
            .setAttribute(
                "data-theme",
                theme
            );


        localStorage.setItem(
            THEME_KEY,
            theme
        );


        updateSelections(
            theme
        );


        updateLabel(
            theme
        );

    }


    function updateLabel(theme) {

        const label =
            document.querySelector(
                "#themeCurrentLabel"
            );


        if (label) {

            label.textContent =
                THEMES[theme]
                || "Classic Blue";

        }

    }


    function updateSelections(theme) {

        document
            .querySelectorAll(
                ".theme-option"
            )
            .forEach(
                option => {

                    const selected =
                        option.dataset.theme
                        === theme;


                    option.classList.toggle(
                        "selected",
                        selected
                    );

                }
            );


        document
            .querySelectorAll(
                ".theme-welcome-card"
            )
            .forEach(
                card => {

                    const selected =
                        card.dataset.theme
                        === theme;


                    card.classList.toggle(
                        "selected",
                        selected
                    );

                }
            );

    }


    /* ========================================================
       CREATE TOP TOOLBAR BRAND + THEME CONTROL
       ======================================================== */

    function createToolbarControls() {

        const browserBar =
            document.querySelector(
                ".browser-bar"
            );


        if (!browserBar) {

            return;

        }


        let area =
            document.querySelector(
                ".theme-toolbar-area"
            );


        if (!area) {

            area =
                document.createElement(
                    "div"
                );

            area.className =
                "theme-toolbar-area";

            browserBar.appendChild(
                area
            );

        }


        if (
            !document.querySelector(
                ".toolbar-brand"
            )
        ) {

            const brand =
                document.createElement(
                    "div"
                );

            brand.className =
                "toolbar-brand";

            brand.innerHTML = `

                <span
                    class="toolbar-brand-mark"
                >
                    M
                </span>

                <span
                    class="toolbar-brand-name"
                >
                    Mini Search
                </span>

            `;

            area.appendChild(
                brand
            );

        }


        if (
            document.querySelector(
                "#miniSearchThemeCenter"
            )
        ) {

            return;

        }


        const center =
            document.createElement(
                "div"
            );

        center.id =
            "miniSearchThemeCenter";

        center.className =
            "theme-center";


        center.innerHTML = `

            <button
                id="themeButton"
                class="theme-button"
                type="button"
                aria-expanded="false"
                title="Choose appearance"
            >

                <span
                    class="theme-button-icon"
                >
                    ◐
                </span>

                <span
                    class="theme-button-text"
                >
                    Theme
                </span>

                <span
                    id="themeCurrentLabel"
                    class="theme-current-label"
                >
                    Classic Blue
                </span>

            </button>


            <div
                id="themePanel"
                class="theme-panel"
                hidden
            >

                <div
                    class="theme-panel-header"
                >

                    <div>

                        <div
                            class="theme-panel-kicker"
                        >
                            APPEARANCE
                        </div>

                        <div
                            class="theme-panel-title"
                        >
                            Choose your theme
                        </div>

                    </div>

                    <button
                        id="themeCloseButton"
                        class="theme-close-button"
                        type="button"
                        aria-label="Close"
                    >
                        ×
                    </button>

                </div>


                <div
                    class="theme-grid"
                    role="listbox"
                >

                    ${
                        Object.entries(THEMES)
                            .map(
                                ([id, name]) => `

                                    <button
                                        class="theme-option"
                                        type="button"
                                        role="option"
                                        data-theme="${id}"
                                    >

                                        <span
                                            class="theme-swatch theme-swatch-${id}"
                                        ></span>

                                        <span
                                            class="theme-option-name"
                                        >
                                            ${name}
                                        </span>

                                        <span
                                            class="theme-check"
                                        >
                                            ✓
                                        </span>

                                    </button>

                                `
                            )
                            .join("")
                    }

                </div>

            </div>

        `;


        area.appendChild(
            center
        );


        bindToolbarEvents();

    }


    function bindToolbarEvents() {

        const button =
            document.querySelector(
                "#themeButton"
            );


        const panel =
            document.querySelector(
                "#themePanel"
            );


        const close =
            document.querySelector(
                "#themeCloseButton"
            );


        if (!button || !panel) {

            return;

        }


        button.addEventListener(
            "click",
            event => {

                event.stopPropagation();

                panel.hidden =
                    !panel.hidden;

                button.setAttribute(
                    "aria-expanded",
                    String(
                        !panel.hidden
                    )
                );

            }
        );


        close?.addEventListener(
            "click",
            () => {

                panel.hidden =
                    true;

            }
        );


        panel.addEventListener(
            "click",
            event => {

                const option =
                    event.target.closest(
                        ".theme-option"
                    );


                if (!option) {

                    return;

                }


                applyTheme(
                    option.dataset.theme
                );


                panel.hidden =
                    true;

            }
        );


        document.addEventListener(
            "click",
            event => {

                const center =
                    document.querySelector(
                        "#miniSearchThemeCenter"
                    );


                if (
                    center
                    &&
                    !center.contains(
                        event.target
                    )
                ) {

                    panel.hidden =
                        true;

                }

            }
        );

    }


    /* ========================================================
       FIRST VISIT CHOOSER
       ======================================================== */

    function createWelcomeChooser() {

        const existing =
            document.querySelector(
                "#miniSearchThemeWelcome"
            );


        if (existing) {

            return;

        }


        const overlay =
            document.createElement(
                "div"
            );


        overlay.id =
            "miniSearchThemeWelcome";


        overlay.className =
            "theme-welcome-overlay";


        overlay.innerHTML = `

            <section
                class="theme-welcome"
                role="dialog"
                aria-modal="true"
            >

                <div
                    class="theme-welcome-header"
                >

                    <div
                        class="theme-welcome-mark"
                    >
                        M
                    </div>

                    <div
                        class="theme-welcome-kicker"
                    >
                        MINI SEARCH
                    </div>

                    <div
                        class="theme-welcome-title"
                    >
                        Choose your appearance
                    </div>

                    <div
                        class="theme-welcome-subtitle"
                    >
                        Select the visual style you
                        want for Mini Search.
                    </div>

                </div>


                <div
                    class="theme-welcome-grid"
                >

                    ${
                        Object.entries(THEMES)
                            .map(
                                ([id, name]) => `

                                    <button
                                        class="theme-welcome-card"
                                        type="button"
                                        data-theme="${id}"
                                    >

                                        <div
                                            class="welcome-preview welcome-preview-${id}"
                                        ></div>

                                        <div
                                            class="theme-welcome-name"
                                        >
                                            ${name}
                                        </div>

                                    </button>

                                `
                            )
                            .join("")
                    }

                </div>


                <div
                    class="theme-welcome-actions"
                >

                    <button
                        id="themeSkipButton"
                        class="theme-skip-button"
                        type="button"
                    >
                        Use default
                    </button>

                    <button
                        id="themeContinueButton"
                        class="theme-continue-button"
                        type="button"
                    >
                        Continue
                    </button>

                </div>

            </section>

        `;


        document.body.appendChild(
            overlay
        );


        bindWelcomeEvents();

    }


    function bindWelcomeEvents() {

        const overlay =
            document.querySelector(
                "#miniSearchThemeWelcome"
            );


        if (!overlay) {

            return;

        }


        overlay.addEventListener(
            "click",
            event => {

                const card =
                    event.target.closest(
                        ".theme-welcome-card"
                    );


                if (!card) {

                    return;

                }


                applyTheme(
                    card.dataset.theme
                );

            }
        );


        document
            .querySelector(
                "#themeContinueButton"
            )
            ?.addEventListener(
                "click",
                () => {

                    localStorage.setItem(
                        WELCOME_KEY,
                        "true"
                    );

                    overlay.remove();

                }
            );


        document
            .querySelector(
                "#themeSkipButton"
            )
            ?.addEventListener(
                "click",
                () => {

                    applyTheme(
                        "classic-blue"
                    );

                    localStorage.setItem(
                        WELCOME_KEY,
                        "true"
                    );

                    overlay.remove();

                }
            );

    }


    /* ========================================================
       INITIALIZATION
       ======================================================== */

    function initialize() {

        const savedTheme =
            getCurrentTheme();


        applyTheme(
            savedTheme
        );


        createToolbarControls();


        updateSelections(
            savedTheme
        );


        updateLabel(
            savedTheme
        );


        const seen =
            localStorage.getItem(
                WELCOME_KEY
            );


        if (
            seen !== "true"
        ) {

            setTimeout(
                createWelcomeChooser,
                400
            );

        }

    }


    if (
        document.readyState
        === "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            initialize
        );

    } else {

        initialize();

    }


    window.MiniSearchThemes = {

        apply:
            applyTheme,

        current:
            getCurrentTheme,

        themes:
            THEMES

    };

})();
