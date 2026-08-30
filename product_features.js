
/* ============================================================
   MINI SEARCH — PRODUCTIVITY FEATURE CENTER
   ============================================================ */

(() => {

    "use strict";


    const BOOKMARK_KEY =
        "mini_search_bookmarks";


    const CALC_HISTORY_KEY =
        "mini_search_calculation_history";


    const PRIVATE_KEY =
        "mini_search_private_session";


    const FEATURES = [

        {
            id: "bookmarks",
            label: "Bookmarks",
            icon: "🔖",
            description:
                "Save useful search results and AI answers.",
            status: "active"
        },

        {
            id: "file-analyzer",
            label: "File Analyzer",
            icon: "📄",
            description:
                "Upload documents for AI analysis.",
            status: "ready"
        },

        {
            id: "image-search",
            label: "Image Search",
            icon: "▧",
            description:
                "Search visual content from the web.",
            status: "ready"
        },

        {
            id: "unit-converter",
            label: "Unit Converter",
            icon: "⇄",
            description:
                "Convert length, weight, volume and temperature.",
            status: "active"
        },

        {
            id: "compare",
            label: "Compare",
            icon: "⇆",
            description:
                "Compare companies, products, technologies or options.",
            status: "ready"
        },

        {
            id: "research",
            label: "Research Mode",
            icon: "⌁",
            description:
                "Turn complex questions into structured research.",
            status: "ready"
        },

        {
            id: "source-explorer",
            label: "Source Explorer",
            icon: "◎",
            description:
                "Inspect and organize sources behind answers.",
            status: "ready"
        },

        {
            id: "calc-history",
            label: "Calculation History",
            icon: "◴",
            description:
                "Keep important calculations for later.",
            status: "active"
        },

        {
            id: "languages",
            label: "Language Mode",
            icon: "文",
            description:
                "Choose the language for AI workflows.",
            status: "active"
        },

        {
            id: "private-search",
            label: "Private Search",
            icon: "⌑",
            description:
                "Temporarily search without saving your local history.",
            status: "active"
        },

        {
            id: "search-modes",
            label: "Search Modes",
            icon: "◇",
            description:
                "Switch between Web, News, Images, Research and Compare.",
            status: "active"
        },

        {
            id: "command-center",
            label: "AI Command Center",
            icon: "✦",
            description:
                "Use Mini Search AI as the control center.",
            status: "active"

        }

    ];


    /* ========================================================
       STORAGE HELPERS
       ======================================================== */

    function readJSON(key, fallback) {

        try {

            const value =
                localStorage.getItem(key);


            if (!value) {

                return fallback;

            }


            const parsed =
                JSON.parse(value);


            return parsed;

        } catch {

            return fallback;

        }

    }


    function writeJSON(key, value) {

        try {

            localStorage.setItem(
                key,
                JSON.stringify(value)
            );

            return true;

        } catch {

            return false;

        }

    }


    /* ========================================================
       BOOKMARKS
       ======================================================== */

    function getBookmarks() {

        return readJSON(
            BOOKMARK_KEY,
            []
        );

    }


    function addBookmark(item) {

        if (!item) {

            return;

        }


        const bookmarks =
            getBookmarks();


        const normalized = {

            title:
                String(
                    item.title || "Untitled"
                ),

            url:
                String(
                    item.url || "#"
                ),

            snippet:
                String(
                    item.snippet || ""
                ),

            createdAt:
                new Date().toISOString()

        };


        const duplicate =
            bookmarks.some(
                bookmark =>
                    bookmark.url
                    === normalized.url
            );


        if (duplicate) {

            return;

        }


        bookmarks.unshift(
            normalized
        );


        writeJSON(
            BOOKMARK_KEY,
            bookmarks.slice(
                0,
                100
            )
        );


        refreshBookmarkBadges();

    }


    function renderBookmarks(container) {

        const bookmarks =
            getBookmarks();


        if (!bookmarks.length) {

            container.innerHTML = `

                <div class="ms-empty-state">

                    <div class="ms-empty-icon">
                        🔖
                    </div>

                    <div class="ms-empty-title">
                        No bookmarks yet
                    </div>

                    <div class="ms-empty-text">
                        Save useful search results
                        for quick access later.
                    </div>

                </div>

            `;

            return;

        }


        container.innerHTML = "";


        bookmarks.forEach(
            (bookmark, index) => {

                const card =
                    document.createElement(
                        "div"
                    );


                card.className =
                    "ms-bookmark-item";


                card.innerHTML = `

                    <div class="ms-bookmark-main">

                        <a
                            href="${escapeHTML(bookmark.url)}"
                            target="_blank"
                            rel="noopener noreferrer"
                            class="ms-bookmark-title"
                        >
                            ${escapeHTML(bookmark.title)}
                        </a>

                        <div class="ms-bookmark-url">
                            ${escapeHTML(bookmark.url)}
                        </div>

                        <div class="ms-bookmark-snippet">
                            ${escapeHTML(bookmark.snippet)}
                        </div>

                    </div>

                    <button
                        class="ms-bookmark-remove"
                        data-index="${index}"
                        type="button"
                    >
                        ×
                    </button>

                `;


                container.appendChild(
                    card
                );

            }
        );


        container
            .querySelectorAll(
                ".ms-bookmark-remove"
            )
            .forEach(
                button => {

                    button.addEventListener(
                        "click",
                        () => {

                            const list =
                                getBookmarks();


                            list.splice(
                                Number(
                                    button.dataset.index
                                ),
                                1
                            );


                            writeJSON(
                                BOOKMARK_KEY,
                                list
                            );


                            renderBookmarks(
                                container
                            );

                        }
                    );

                }
            );

    }


    function escapeHTML(value) {

        const node =
            document.createElement(
                "div"
            );


        node.textContent =
            value == null
                ? ""
                : String(value);


        return node.innerHTML;

    }


    /* ========================================================
       CALCULATION HISTORY
       ======================================================== */

    function getCalculationHistory() {

        return readJSON(
            CALC_HISTORY_KEY,
            []
        );

    }


    function saveCalculation(
        question,
        answer
    ) {

        if (
            !question
            ||
            !answer
        ) {

            return;

        }


        const history =
            getCalculationHistory();


        history.unshift({

            question:
                String(question),

            answer:
                String(answer),

            createdAt:
                new Date().toISOString()

        });


        writeJSON(
            CALC_HISTORY_KEY,
            history.slice(
                0,
                50
            )
        );

    }


    function renderCalculationHistory(
        container
    ) {

        const history =
            getCalculationHistory();


        if (!history.length) {

            container.innerHTML = `

                <div class="ms-empty-state">

                    <div class="ms-empty-icon">
                        ◴
                    </div>

                    <div class="ms-empty-title">
                        No saved calculations
                    </div>

                    <div class="ms-empty-text">
                        Calculation history will
                        appear here when saved.
                    </div>

                </div>

            `;

            return;

        }


        container.innerHTML = "";


        history.forEach(
            item => {

                const card =
                    document.createElement(
                        "article"
                    );


                card.className =
                    "ms-calc-history-item";


                card.innerHTML = `

                    <div
                        class="ms-calc-question"
                    >
                        ${escapeHTML(
                            item.question
                        )}
                    </div>

                    <pre
                        class="ms-calc-answer"
                    >${escapeHTML(
                        item.answer
                    )}</pre>

                `;


                container.appendChild(
                    card
                );

            }
        );

    }


    /* ========================================================
       PRIVATE SEARCH
       ======================================================== */

    function isPrivateSearch() {

        return (
            localStorage.getItem(
                PRIVATE_KEY
            )
            === "true"
        );

    }


    function setPrivateSearch(enabled) {

        localStorage.setItem(
            PRIVATE_KEY,
            enabled
                ? "true"
                : "false"
        );


        updatePrivateIndicator(
            enabled
        );

    }


    function updatePrivateIndicator(
        enabled
    ) {

        const indicator =
            document.querySelector(
                "#msPrivateIndicator"
            );


        if (!indicator) {

            return;

        }


        indicator.textContent =
            enabled
                ? "Private"
                : "Standard";


        indicator.classList.toggle(
            "active",
            enabled
        );

    }


    /* ========================================================
       UNIT CONVERTER
       ======================================================== */

    const CONVERSIONS = {

        length: {

            meter: 1,

            kilometer: 1000,

            centimeter: 0.01,

            millimeter: 0.001,

            foot: 0.3048,

            inch: 0.0254

        },


        weight: {

            kilogram: 1,

            gram: 0.001,

            ton: 1000,

            pound: 0.45359237,

            ounce: 0.028349523125

        },


        volume: {

            liter: 1,

            milliliter: 0.001,

            cubic_meter: 1000,

            cubic_centimeter: 0.001,

            gallon: 3.785411784

        }

    };


    function convertUnits(
        value,
        from,
        to,
        category
    ) {

        const table =
            CONVERSIONS[
                category
            ];


        if (
            !table
            ||
            table[from] == null
            ||
            table[to] == null
        ) {

            return NaN;

        }


        return (
            Number(value)
            *
            table[from]
            /
            table[to]
        );

    }


    /* ========================================================
       AI COMMAND CENTER
       ======================================================== */

    function sendToAIChat(
        prompt
    ) {

        const input =
            document.querySelector(
                "#aiChatInput"
            );


        const sendButton =
            document.querySelector(
                "#aiChatSendButton"
            );


        const openButton =
            document.querySelector(
                "#aiChatOpenButton"
            );


        if (
            !input
            ||
            !sendButton
        ) {

            return;

        }


        if (openButton) {

            openButton.click();

        }


        input.value =
            prompt;


        input.dispatchEvent(
            new Event(
                "input",
                {
                    bubbles: true
                }
            )
        );


        setTimeout(
            () => {

                sendButton.click();

            },
            80
        );

    }


    /* ========================================================
       SEARCH MODES
       ======================================================== */

    function setSearchMode(mode) {

        localStorage.setItem(
            "mini_search_mode",
            mode
        );


        document
            .querySelectorAll(
                ".ms-mode-button"
            )
            .forEach(
                button => {

                    button.classList.toggle(
                        "active",
                        button.dataset.mode
                        === mode
                    );

                }
            );

    }


    /* ========================================================
       MODAL
       ======================================================== */

    function createModal(
        title,
        subtitle,
        content
    ) {

        const old =
            document.querySelector(
                ".ms-feature-modal-overlay"
            );


        old?.remove();


        const overlay =
            document.createElement(
                "div"
            );


        overlay.className =
            "ms-feature-modal-overlay";


        overlay.innerHTML = `

            <section
                class="ms-feature-modal"
                role="dialog"
                aria-modal="true"
            >

                <header
                    class="ms-feature-modal-header"
                >

                    <div>

                        <div
                            class="ms-feature-modal-title"
                        >
                            ${escapeHTML(title)}
                        </div>

                        <div
                            class="ms-feature-modal-subtitle"
                        >
                            ${escapeHTML(subtitle)}
                        </div>

                    </div>

                    <button
                        class="ms-feature-close"
                        type="button"
                        aria-label="Close"
                    >
                        ×
                    </button>

                </header>

                <div
                    class="ms-feature-modal-body"
                >
                    ${content}
                </div>

            </section>

        `;


        document.body.appendChild(
            overlay
        );


        overlay
            .querySelector(
                ".ms-feature-close"
            )
            .addEventListener(
                "click",
                () => overlay.remove()
            );


        overlay.addEventListener(
            "click",
            event => {

                if (
                    event.target
                    === overlay
                ) {

                    overlay.remove();

                }

            }
        );


        return overlay;

    }


    /* ========================================================
       OPEN FEATURE
       ======================================================== */

    function openFeature(
        featureId
    ) {

        switch (featureId) {

            case "bookmarks":

                {

                    const modal =
                        createModal(
                            "Bookmarks",
                            "Saved items stored on this device.",
                            `<div id="msBookmarksList"></div>`
                        );


                    renderBookmarks(
                        modal.querySelector(
                            "#msBookmarksList"
                        )
                    );

                }

                break;


            case "calc-history":

                {

                    const modal =
                        createModal(
                            "Calculation History",
                            "Saved commercial, scientific and freight calculations.",
                            `<div id="msCalcHistoryList"></div>`
                        );


                    renderCalculationHistory(
                        modal.querySelector(
                            "#msCalcHistoryList"
                        )
                    );

                }

                break;


            case "unit-converter":

                {

                    const modal =
                        createModal(
                            "Unit Converter",
                            "Fast local conversions for common scientific and freight units.",
                            `

                                <div class="ms-converter">

                                    <select id="msConvertCategory">
                                        <option value="length">
                                            Length
                                        </option>
                                        <option value="weight">
                                            Weight
                                        </option>
                                        <option value="volume">
                                            Volume
                                        </option>
                                    </select>

                                    <input
                                        id="msConvertValue"
                                        type="number"
                                        placeholder="Value"
                                    >

                                    <select id="msConvertFrom"></select>

                                    <select id="msConvertTo"></select>

                                    <button
                                        id="msConvertButton"
                                        class="ms-primary-button"
                                        type="button"
                                    >
                                        Convert
                                    </button>

                                    <div
                                        id="msConvertResult"
                                        class="ms-convert-result"
                                    >
                                        Enter a value to begin.
                                    </div>

                                </div>

                            `
                        );


                    const category =
                        modal.querySelector(
                            "#msConvertCategory"
                        );


                    const from =
                        modal.querySelector(
                            "#msConvertFrom"
                        );


                    const to =
                        modal.querySelector(
                            "#msConvertTo"
                        );


                    function populateUnits() {

                        const units =
                            Object.keys(
                                CONVERSIONS[
                                    category.value
                                ]
                            );


                        from.innerHTML =
                            units
                                .map(
                                    unit =>
                                        `<option value="${unit}">
                                            ${unit.replaceAll("_", " ")}
                                        </option>`
                                )
                                .join("");


                        to.innerHTML =
                            units
                                .map(
                                    unit =>
                                        `<option value="${unit}">
                                            ${unit.replaceAll("_", " ")}
                                        </option>`
                                )
                                .join("");


                        if (units.length > 1) {

                            to.value =
                                units[1];

                        }

                    }


                    populateUnits();


                    category.addEventListener(
                        "change",
                        populateUnits
                    );


                    modal
                        .querySelector(
                            "#msConvertButton"
                        )
                        .addEventListener(
                            "click",
                            () => {

                                const result =
                                    convertUnits(
                                        modal.querySelector(
                                            "#msConvertValue"
                                        ).value,
                                        from.value,
                                        to.value,
                                        category.value
                                    );


                                modal.querySelector(
                                    "#msConvertResult"
                                ).textContent =
                                    Number.isFinite(result)
                                        ? result.toLocaleString(
                                            undefined,
                                            {
                                                maximumFractionDigits:
                                                    8
                                            }
                                        )
                                        : "Invalid input.";

                            }
                        );

                }

                break;


            case "private-search":

                {

                    const enabled =
                        isPrivateSearch();


                    createModal(
                        "Private Search",
                        "Control whether your local search history is used for the session.",
                        `

                            <div class="ms-private-card">

                                <div
                                    class="ms-private-state"
                                >

                                    <span
                                        id="msPrivateIndicator"
                                        class="${enabled ? "active" : ""}"
                                    >
                                        ${enabled ? "Private" : "Standard"}
                                    </span>

                                </div>

                                <p>
                                    Private Search is a local-session
                                    preference. Existing browser
                                    history is not erased by this switch.
                                </p>

                                <button
                                    id="msPrivateToggle"
                                    class="ms-primary-button"
                                    type="button"
                                >
                                    ${
                                        enabled
                                            ? "Turn off Private Search"
                                            : "Turn on Private Search"
                                    }
                                </button>

                            </div>

                        `
                    );


                    document
                        .querySelector(
                            "#msPrivateToggle"
                        )
                        ?.addEventListener(
                            "click",
                            event => {

                                const next =
                                    !isPrivateSearch();


                                setPrivateSearch(
                                    next
                                );


                                event.target.textContent =
                                    next
                                        ? "Turn off Private Search"
                                        : "Turn on Private Search";

                            }
                        );

                }

                break;


            case "languages":

                createModal(
                    "Language Mode",
                    "Select the preferred language for future AI workflows.",
                    `

                        <div class="ms-language-grid">

                            <button
                                class="ms-language-button active"
                                data-language="English"
                            >
                                English
                            </button>

                            <button
                                class="ms-language-button"
                                data-language="Hindi"
                            >
                                Hindi
                            </button>

                            <button
                                class="ms-language-button"
                                data-language="Gujarati"
                            >
                                Gujarati
                            </button>

                            <button
                                class="ms-language-button"
                                data-language="Spanish"
                            >
                                Spanish
                            </button>

                            <button
                                class="ms-language-button"
                                data-language="French"
                            >
                                French
                            </button>

                            <button
                                class="ms-language-button"
                                data-language="German"
                            >
                                German
                            </button>

                        </div>

                    `
                );


                document
                    .querySelectorAll(
                        ".ms-language-button"
                    )
                    .forEach(
                        button => {

                            button.addEventListener(
                                "click",
                                () => {

                                    localStorage.setItem(
                                        "mini_search_language",
                                        button.dataset.language
                                    );


                                    document
                                        .querySelectorAll(
                                            ".ms-language-button"
                                        )
                                        .forEach(
                                            item =>
                                                item.classList.remove(
                                                    "active"
                                                )
                                        );


                                    button.classList.add(
                                        "active"
                                    );

                                }
                            );

                        }
                    );

                break;


            case "search-modes":

                createModal(
                    "Search Modes",
                    "Choose how Mini Search should handle the next request.",
                    `

                        <div class="ms-mode-grid">

                            <button
                                class="ms-mode-button"
                                data-mode="web"
                            >
                                Web
                            </button>

                            <button
                                class="ms-mode-button"
                                data-mode="news"
                            >
                                News
                            </button>

                            <button
                                class="ms-mode-button"
                                data-mode="images"
                            >
                                Images
                            </button>

                            <button
                                class="ms-mode-button"
                                data-mode="research"
                            >
                                Research
                            </button>

                            <button
                                class="ms-mode-button"
                                data-mode="compare"
                            >
                                Compare
                            </button>

                            <button
                                class="ms-mode-button"
                                data-mode="ai"
                            >
                                AI
                            </button>

                        </div>

                    `
                );


                document
                    .querySelectorAll(
                        ".ms-mode-button"
                    )
                    .forEach(
                        button => {

                            button.addEventListener(
                                "click",
                                () => {

                                    setSearchMode(
                                        button.dataset.mode
                                    );

                                }
                            );

                        }
                    );

                break;


            case "command-center":

                {

                    createModal(
                        "AI Command Center",
                        "Use Mini Search AI as the workspace for search, analysis and calculations.",
                        `

                            <div class="ms-command-grid">

                                <button
                                    class="ms-command-button"
                                    data-command="Research this topic and give me a structured report with sources."
                                >
                                    Research
                                </button>

                                <button
                                    class="ms-command-button"
                                    data-command="Compare these two options and give me a decision table."
                                >
                                    Compare
                                </button>

                                <button
                                    class="ms-command-button"
                                    data-command="Analyze this question step by step and show the assumptions."
                                >
                                    Analyze
                                </button>

                                <button
                                    class="ms-command-button"
                                    data-command="Solve this calculation and show the formula and result."
                                >
                                    Calculate
                                </button>

                            </div>

                        `
                    );


                    document
                        .querySelectorAll(
                            ".ms-command-button"
                        )
                        .forEach(
                            button => {

                                button.addEventListener(
                                    "click",
                                    () => {

                                        sendToAIChat(
                                            button.dataset.command
                                        );

                                        document
                                            .querySelector(
                                                ".ms-feature-modal-overlay"
                                            )
                                            ?.remove();

                                    }
                                );

                            }
                        );

                }

                break;


            case "research":

                sendToAIChat(
                    "Research this topic thoroughly. Break it into key questions, summarize the findings, distinguish facts from assumptions, and provide a structured answer with sources."
                );

                break;


            case "compare":

                sendToAIChat(
                    "Compare the two subjects in my next question. Create a structured comparison with important differences, advantages, disadvantages, and a conclusion."
                );

                break;


            case "source-explorer":

                sendToAIChat(
                    "Analyze the sources behind the answer to my next question. Explain which sources are most useful and why."
                );

                break;


            case "file-analyzer":

                createModal(
                    "File Analyzer",
                    "UI is ready. Connect a document parser/backend next.",
                    `

                        <div class="ms-upload-zone">

                            <input
                                id="msFileInput"
                                type="file"
                                accept=".txt,.md,.csv,.json,.pdf,.doc,.docx"
                            >

                            <div class="ms-upload-note">
                                Text-based files can be read locally.
                                PDF/DOCX extraction needs a parser
                                connection.
                            </div>

                        </div>

                    `
                );

                break;


            case "image-search":

                createModal(
                    "Image Search",
                    "The dashboard entry point is ready for the image-search backend.",
                    `

                        <div class="ms-ready-card">

                            <div class="ms-ready-title">
                                Image Search
                            </div>

                            <p>
                                Connect the image-search
                                endpoint here without
                                changing the dashboard.
                            </p>

                        </div>

                    `
                );

                break;


            default:

                {

                    const feature =
                        FEATURES.find(
                            item =>
                                item.id
                                === featureId
                        );


                    createModal(
                        feature?.label
                        || "Mini Search",
                        feature?.description
                        || "",
                        `
                            <div class="ms-ready-card">
                                <div class="ms-ready-title">
                                    ${escapeHTML(
                                        feature?.label
                                        || "Feature"
                                    )}
                                </div>
                                <p>
                                    The professional interface
                                    is ready for this module.
                                </p>
                            </div>
                        `
                    );

                }

        }

    }


    /* ========================================================
       BUILD FEATURE RAIL
       ======================================================== */

    function buildFeatureRail() {

        if (
            document.querySelector(
                ".ms-feature-rail"
            )
        ) {

            return;

        }


        const rail =
            document.createElement(
                "aside"
            );


        rail.className =
            "ms-feature-rail";


        rail.innerHTML = `

            <div
                class="ms-feature-heading"
            >
                CORE
            </div>

            ${FEATURES
                .filter(
                    feature =>
                        [
                            "search",
                            "news",
                            "ai-chat"
                        ].includes(
                            feature.id
                        )
                )
                .map(
                    feature => `
                        <button
                            class="ms-feature-item"
                            data-feature-id="${feature.id}"
                            type="button"
                        >

                            <span class="ms-feature-icon">
                                ${feature.icon}
                            </span>

                            <span class="ms-feature-label">
                                ${feature.label}
                            </span>

                        </button>
                    `
                )
                .join("")
            }


            <div
                class="ms-feature-heading"
            >
                INTELLIGENCE
            </div>


            ${FEATURES
                .filter(
                    feature =>
                        [
                            "math",
                            "commerce",
                            "science",
                            "calculus",
                            "freight"
                        ].includes(
                            feature.id
                        )
                )
                .map(
                    feature => `
                        <button
                            class="ms-feature-item"
                            data-feature-id="${feature.id}"
                            type="button"
                        >

                            <span class="ms-feature-icon">
                                ${feature.icon}
                            </span>

                            <span class="ms-feature-label">
                                ${feature.label}
                            </span>

                        </button>
                    `
                )
                .join("")
            }


            <div
                class="ms-feature-heading"
            >
                PRODUCTIVITY
            </div>


            ${FEATURES
                .filter(
                    feature =>
                        [
                            "bookmarks",
                            "file-analyzer",
                            "image-search",
                            "unit-converter",
                            "compare",
                            "research",
                            "source-explorer",
                            "calc-history",
                            "languages",
                            "private-search",
                            "search-modes",
                            "command-center"
                        ].includes(
                            feature.id
                        )
                )
                .map(
                    feature => `

                        <button
                            class="ms-feature-item"
                            data-feature-id="${feature.id}"
                            type="button"
                        >

                            <span class="ms-feature-icon">
                                ${feature.icon}
                            </span>

                            <span class="ms-feature-label">
                                ${feature.label}
                            </span>

                            ${
                                feature.status === "ready"
                                    ? '<span class="ms-feature-badge">READY</span>'
                                    : ""
                            }

                        </button>

                    `
                )
                .join("")
            }

        `;


        document.body.appendChild(
            rail
        );


        rail
            .querySelectorAll(
                ".ms-feature-item"
            )
            .forEach(
                button => {

                    button.addEventListener(
                        "click",
                        () => {

                            const featureId =
                                button.dataset.featureId;


                            if (
                                featureId
                                === "search"
                            ) {

                                document
                                    .querySelector(
                                        "#searchInput"
                                    )
                                    ?.focus();

                                return;

                            }


                            if (
                                featureId
                                === "news"
                            ) {

                                document
                                    .querySelector(
                                        "#newsHub"
                                    )
                                    ?.scrollIntoView(
                                        {
                                            behavior:
                                                "smooth"
                                        }
                                    );

                                return;

                            }


                            if (
                                featureId
                                === "ai-chat"
                            ) {

                                document
                                    .querySelector(
                                        "#aiChatOpenButton"
                                    )
                                    ?.click();

                                return;

                            }


                            openFeature(
                                featureId
                            );

                        }
                    );

                }
            );

    }


    /* ========================================================
       BOOKMARK BUTTONS ON SEARCH RESULTS
       ======================================================== */

    function refreshBookmarkBadges() {

        document
            .querySelectorAll(
                ".result"
            )
            .forEach(
                result => {

                    if (
                        result.querySelector(
                            ".ms-result-bookmark"
                        )
                    ) {

                        return;

                    }


                    const link =
                        result.querySelector(
                            ".result-title"
                        );


                    if (!link) {

                        return;

                    }


                    const button =
                        document.createElement(
                            "button"
                        );


                    button.className =
                        "ms-result-bookmark";


                    button.type =
                        "button";


                    button.textContent =
                        "🔖";


                    button.title =
                        "Save result";


                    button.addEventListener(
                        "click",
                        () => {

                            addBookmark({

                                title:
                                    link.textContent,

                                url:
                                    link.href,

                                snippet:
                                    result
                                        .querySelector(
                                            ".result-snippet"
                                        )
                                        ?.textContent
                                        || ""

                            });


                            button.textContent =
                                "✓";

                        }
                    );


                    result.appendChild(
                        button
                    );

                }
            );

    }


    /* ========================================================
       OBSERVE RESULTS
       ======================================================== */

    function watchResults() {

        const results =
            document.querySelector(
                "#results"
            );


        if (!results) {

            return;

        }


        const observer =
            new MutationObserver(
                () => {

                    refreshBookmarkBadges();

                }
            );


        observer.observe(
            results,
            {
                childList: true,
                subtree: true
            }
        );


        refreshBookmarkBadges();

    }


    /* ========================================================
       INITIALIZE
       ======================================================== */

    function initialize() {

        buildFeatureRail();

        watchResults();

        updatePrivateIndicator(
            isPrivateSearch()
        );

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


    window.MiniSearchFeatures = {

        features:
            FEATURES,

        bookmarks:
            getBookmarks,

        saveBookmark:
            addBookmark,

        saveCalculation:
            saveCalculation,

        isPrivate:
            isPrivateSearch

    };

})();
