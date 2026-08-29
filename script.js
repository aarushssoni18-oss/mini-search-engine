// ============================================================
// MINI SEARCH ENGINE
// STABLE FRONTEND CONTROLLER
// ============================================================

document.addEventListener("DOMContentLoaded", function () {

    const API_URL = "";

    // ========================================================
    // GET ELEMENTS
    // ========================================================

    const searchInput =
        document.getElementById("searchInput");

    const searchButton =
        document.getElementById("searchButton");

    const clearSearchButton =
        document.getElementById("clearSearchButton");

    const resultsContainer =
        document.getElementById("results");

    const message =
        document.getElementById("message");

    const addressInput =
        document.getElementById("addressInput");

    const addressClearButton =
        document.getElementById("addressClearButton");

    const goButton =
        document.getElementById("goButton");

    const backButton =
        document.getElementById("backButton");

    const forwardButton =
        document.getElementById("forwardButton");

    const refreshButton =
        document.getElementById("refreshButton");

    const homeButton =
        document.getElementById("homeButton");

    const searchDropdown =
        document.getElementById("searchDropdown");

    const addressDropdown =
        document.getElementById("addressDropdown");

    const historyButton =
        document.getElementById("historyButton");

    const historyPanel =
        document.getElementById("historyPanel");

    const historyList =
        document.getElementById("historyList");

    const clearHistoryButton =
        document.getElementById("clearHistoryButton");

    const mobileHomeButton =
        document.getElementById("mobileHomeButton");

    const mobileSearchButton =
        document.getElementById("mobileSearchButton");

    const mobileHistoryButton =
        document.getElementById("mobileHistoryButton");

    const mobileRefreshButton =
        document.getElementById("mobileRefreshButton");

    const quickChips =
        document.querySelectorAll(".quick-chip");


    // ========================================================
    // BASIC ELEMENT CHECK
    // ========================================================

    const requiredElements = [
        searchInput,
        searchButton,
        clearSearchButton,
        resultsContainer,
        message,
        addressInput,
        addressClearButton,
        goButton,
        backButton,
        forwardButton,
        refreshButton,
        homeButton,
        searchDropdown,
        addressDropdown,
        historyButton,
        historyPanel,
        historyList,
        clearHistoryButton,
        mobileHomeButton,
        mobileSearchButton,
        mobileHistoryButton,
        mobileRefreshButton
    ];


    if (
        requiredElements.some(
            function (element) {
                return !element;
            }
        )
    ) {

        console.error(
            "Mini Search: one or more HTML elements are missing."
        );

        return;
    }


    console.log(
        "✅ Mini Search JavaScript loaded successfully."
    );


    // ========================================================
    // HISTORY
    // ========================================================

    const HISTORY_KEY =
        "mini_search_history";

    const MAX_HISTORY =
        15;


    function getHistory() {

        try {

            const saved =
                localStorage.getItem(
                    HISTORY_KEY
                );

            if (!saved) {
                return [];
            }

            const parsed =
                JSON.parse(saved);

            return Array.isArray(parsed)
                ? parsed
                : [];

        } catch (error) {

            console.error(
                "History read error:",
                error
            );

            return [];
        }
    }


    function saveHistory(query) {

        const cleanQuery =
            String(query).trim();

        if (!cleanQuery) {
            return;
        }


        let items =
            getHistory();


        items =
            items.filter(
                function (item) {

                    return (
                        String(item).toLowerCase()
                        !==
                        cleanQuery.toLowerCase()
                    );

                }
            );


        items.unshift(
            cleanQuery
        );


        items =
            items.slice(
                0,
                MAX_HISTORY
            );


        try {

            localStorage.setItem(
                HISTORY_KEY,
                JSON.stringify(items)
            );

        } catch (error) {

            console.error(
                "History save error:",
                error
            );
        }

    }


    function clearHistory() {

        try {

            localStorage.removeItem(
                HISTORY_KEY
            );

        } catch (error) {

            console.error(
                "History clear error:",
                error
            );
        }


        renderHistory();


        setMessage(
            "Search history cleared.",
            false
        );

    }


    // ========================================================
    // STATUS MESSAGE
    // ========================================================

    function setMessage(
        text,
        active = true
    ) {

        message.innerHTML = "";

        const dot =
            document.createElement("span");

        dot.className =
            "status-dot";


        if (!active) {

            dot.style.background =
                "#7F8BA5";

            dot.style.boxShadow =
                "none";
        }


        const textNode =
            document.createTextNode(
                " " + text
            );


        message.appendChild(
            dot
        );

        message.appendChild(
            textNode
        );

    }


    // ========================================================
    // HIDE DROPDOWNS
    // ========================================================

    function hideDropdowns() {

        searchDropdown.classList.add(
            "hidden"
        );

        addressDropdown.classList.add(
            "hidden"
        );

    }


    // ========================================================
    // HIDE HISTORY
    // ========================================================

    function hideHistory() {

        historyPanel.classList.add(
            "hidden"
        );

    }


    // ========================================================
    // CLEAR SEARCH PAGE
    // ========================================================

    function clearSearchPage() {

        searchInput.value =
            "";

        addressInput.value =
            "";

        resultsContainer.innerHTML =
            "";

        setMessage(
            "Ready to search."
        );

        hideDropdowns();

    }


    // ========================================================
    // HTML ESCAPE
    // ========================================================

    function escapeHTML(value) {

        const div =
            document.createElement("div");

        div.textContent =
            value == null
                ? ""
                : String(value);

        return div.innerHTML;

    }


    // ========================================================
    // URL TEST
    // ========================================================

    function looksLikeURL(value) {

        return (
            /^https?:\/\//i.test(value)
            ||
            /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(\/.*)?$/.test(value)
        );

    }


    // ========================================================
    // OPEN WEBSITE
    // ========================================================

    function openWebsite(value) {

        let url =
            String(value).trim();


        if (!url) {
            return;
        }


        if (
            !/^https?:\/\//i.test(url)
        ) {

            url =
                "https://" + url;

        }


        window.location.href =
            url;

    }


    // ========================================================
    // DISPLAY RESULTS
    // ========================================================

    function displayResults(results) {

        resultsContainer.innerHTML =
            "";


        if (
            !Array.isArray(results)
            ||
            results.length === 0
        ) {

            setMessage(
                "No results found.",
                false
            );

            return;
        }


        setMessage(
            results.length
            + " results found."
        );


        results.forEach(
            function (result) {

                const card =
                    document.createElement(
                        "article"
                    );

                card.className =
                    "result";


                const title =
                    result.title
                    ||
                    result.name
                    ||
                    "Untitled result";


                const url =
                    result.url
                    ||
                    result.link
                    ||
                    result.href
                    ||
                    result.website
                    ||
                    "#";


                const snippet =
                    result.snippet
                    ||
                    result.content
                    ||
                    result.description
                    ||
                    result.text
                    ||
                    "No description available.";


                const source =
                    result.source
                    ||
                    "search";


                const titleLink =
                    document.createElement(
                        "a"
                    );


                titleLink.className =
                    "result-title";


                titleLink.href =
                    url;


                titleLink.target =
                    "_self";


                titleLink.textContent =
                    title;


                const urlElement =
                    document.createElement(
                        "div"
                    );


                urlElement.className =
                    "result-url";


                urlElement.textContent =
                    url;


                const snippetElement =
                    document.createElement(
                        "div"
                    );


                snippetElement.className =
                    "result-snippet";


                snippetElement.textContent =
                    snippet;


                const metaElement =
                    document.createElement(
                        "div"
                    );


                metaElement.className =
                    "result-meta";


                metaElement.textContent =
                    source;


                card.appendChild(
                    titleLink
                );

                card.appendChild(
                    urlElement
                );

                card.appendChild(
                    snippetElement
                );

                card.appendChild(
                    metaElement
                );


                resultsContainer.appendChild(
                    card
                );

            }
        );

    }


    // ========================================================
    // SEARCH REQUEST
    // ========================================================

    async function performSearch(
        suppliedQuery = null,
        saveToHistory = true,
        updateBrowserHistory = true
    ) {

        const rawQuery =
            suppliedQuery !== null
                ? suppliedQuery
                : searchInput.value;


        const query =
            String(rawQuery).trim();


        if (!query) {

            setMessage(
                "Enter something to search.",
                false
            );

            return;
        }


        searchInput.value =
            query;

        addressInput.value =
            query;


        hideDropdowns();

        hideHistory();


        if (saveToHistory) {

            saveHistory(
                query
            );

        }


        if (updateBrowserHistory) {

            const currentState =
                window.history.state;


            if (
                !currentState
                ||
                currentState.query
                    !== query
            ) {

                window.history.pushState(
                    {
                        query: query
                    },
                    "",
                    "?q="
                    + encodeURIComponent(
                        query
                    )
                );

            }

        }


        setMessage(
            "Searching the web..."
        );


        resultsContainer.innerHTML = `
            <div class="loading">
                Searching companies, websites and the wider web...
            </div>
        `;


        try {

            const response =
                await fetch(
                    API_URL
                    + "/search?q="
                    + encodeURIComponent(
                        query
                    ),
                    {
                        method: "GET",

                        headers: {
                            "ngrok-skip-browser-warning":
                                "true"
                        },

                        cache:
                            "no-store"
                    }
                );


            if (!response.ok) {

                throw new Error(
                    "Search server returned "
                    + response.status
                );

            }


            const data =
                await response.json();


            displayResults(
                data.results || []
            );


        } catch (error) {

            console.error(
                "Search request failed:",
                error
            );


            setMessage(
                "Search server is unavailable.",
                false
            );


            resultsContainer.innerHTML = `
                <article class="result">

                    <div class="result-title">
                        Search could not be completed
                    </div>

                    <div class="result-snippet">
                        Check that your Flask server,
                        Tavily connection and ngrok tunnel
                        are running.
                    </div>

                </article>
            `;

        }

    }


    // ========================================================
    // HISTORY DISPLAY
    // ========================================================

    function renderHistory() {

        const items =
            getHistory();


        historyList.innerHTML =
            "";


        if (
            items.length === 0
        ) {

            historyList.innerHTML = `
                <div class="history-empty">
                    No searches yet.
                </div>
            `;

            return;

        }


        items.forEach(
            function(query) {

                const button =
                    document.createElement(
                        "button"
                    );


                button.type =
                    "button";


                button.className =
                    "history-item";


                button.innerHTML = `
                    <span>🕘</span>
                    <span></span>
                `;


                button
                    .querySelector("span:last-child")
                    .textContent =
                    query;


                button.addEventListener(
                    "click",
                    function() {

                        performSearch(
                            query
                        );

                    }
                );


                historyList.appendChild(
                    button
                );

            }
        );

    }


    // ========================================================
    // SUGGESTION CREATOR
    // ========================================================

    function addSuggestion(
        container,
        text,
        icon
    ) {

        const button =
            document.createElement(
                "button"
            );


        button.type =
            "button";


        button.className =
            "suggestion-item";


        button.innerHTML = `
            <span class="suggestion-icon">
                ${icon}
            </span>
            <span></span>
        `;


        button
            .querySelector(
                "span:last-child"
            )
            .textContent =
            text;


        button.addEventListener(
            "click",
            function() {

                searchInput.value =
                    text;

                performSearch(
                    text
                );

            }
        );


        container.appendChild(
            button
        );

    }


    // ========================================================
    // SEARCH DROPDOWN
    // ========================================================

    function updateSearchDropdown() {

        const query =
            searchInput.value.trim();


        const items =
            getHistory();


        searchDropdown.innerHTML =
            "";


        let suggestions =
            [];


        if (!query) {

            suggestions =
                items.slice(
                    0,
                    6
                );

        } else {

            suggestions =
                items.filter(
                    function(item) {

                        return String(item)
                            .toLowerCase()
                            .includes(
                                query.toLowerCase()
                            );

                    }
                ).slice(
                    0,
                    6
                );


            const alreadyExists =
                suggestions.some(
                    function(item) {

                        return (
                            String(item).toLowerCase()
                            ===
                            query.toLowerCase()
                        );

                    }
                );


            if (!alreadyExists) {

                suggestions.unshift(
                    query
                );

            }

        }


        if (
            suggestions.length === 0
        ) {

            searchDropdown.classList.add(
                "hidden"
            );

            return;
        }


        suggestions.forEach(
            function(item) {

                addSuggestion(
                    searchDropdown,
                    item,
                    item === query
                        ? "🔎"
                        : "🕘"
                );

            }
        );


        searchDropdown.classList.remove(
            "hidden"
        );

    }


    // ========================================================
    // ADDRESS DROPDOWN
    // ========================================================

    function updateAddressDropdown() {

        const value =
            addressInput.value.trim();


        const items =
            getHistory();


        addressDropdown.innerHTML =
            "";


        const suggestions =
            items.filter(
                function(item) {

                    return (
                        !value
                        ||
                        String(item)
                            .toLowerCase()
                            .includes(
                                value.toLowerCase()
                            )
                    );

                }
            ).slice(
                0,
                6
            );


        if (
            value
            &&
            suggestions.length === 0
        ) {

            addSuggestion(
                addressDropdown,
                value,
                "🔎"
            );

        } else {

            suggestions.forEach(
                function(item) {

                    const button =
                        document.createElement(
                            "button"
                        );


                    button.type =
                        "button";


                    button.className =
                        "suggestion-item";


                    button.innerHTML = `
                        <span class="suggestion-icon">
                            🕘
                        </span>
                        <span></span>
                    `;


                    button
                        .querySelector(
                            "span:last-child"
                        )
                        .textContent =
                        item;


                    button.addEventListener(
                        "click",
                        function() {

                            addressInput.value =
                                item;

                            performSearch(
                                item
                            );

                        }
                    );


                    addressDropdown.appendChild(
                        button
                    );

                }
            );

        }


        if (
            addressDropdown.children.length
            > 0
        ) {

            addressDropdown.classList.remove(
                "hidden"
            );

        } else {

            addressDropdown.classList.add(
                "hidden"
            );

        }

    }


    // ========================================================
    // SEARCH EVENTS
    // ========================================================

    searchButton.addEventListener(
        "click",
        function(event) {

            event.preventDefault();

            performSearch();

        }
    );


    searchInput.addEventListener(
        "keydown",
        function(event) {

            if (
                event.key === "Enter"
            ) {

                event.preventDefault();

                performSearch();

            }


            if (
                event.key === "Escape"
            ) {

                hideDropdowns();

            }

        }
    );


    searchInput.addEventListener(
        "input",
        updateSearchDropdown
    );


    searchInput.addEventListener(
        "focus",
        updateSearchDropdown
    );


    clearSearchButton.addEventListener(
        "click",
        function() {

            searchInput.value =
                "";

            resultsContainer.innerHTML =
                "";

            setMessage(
                "Ready to search."
            );

            hideDropdowns();

            searchInput.focus();

        }
    );


    // ========================================================
    // ADDRESS BAR
    // ========================================================

    addressInput.addEventListener(
        "input",
        updateAddressDropdown
    );


    addressInput.addEventListener(
        "focus",
        updateAddressDropdown
    );


    addressInput.addEventListener(
        "keydown",
        function(event) {

            if (
                event.key === "Enter"
            ) {

                event.preventDefault();

                openAddressOrSearch();

            }


            if (
                event.key === "Escape"
            ) {

                hideDropdowns();

            }

        }
    );


    addressClearButton.addEventListener(
        "click",
        function() {

            addressInput.value =
                "";

            hideDropdowns();

            addressInput.focus();

        }
    );


    goButton.addEventListener(
        "click",
        function(event) {

            event.preventDefault();

            openAddressOrSearch();

        }
    );


    function openAddressOrSearch() {

        const value =
            addressInput.value.trim();


        if (!value) {
            return;
        }


        hideDropdowns();


        if (
            looksLikeURL(
                value
            )
        ) {

            openWebsite(
                value
            );

        } else {

            performSearch(
                value
            );

        }

    }


    // ========================================================
    // BROWSER CONTROLS
    // ========================================================

    backButton.addEventListener(
        "click",
        function() {

            window.history.back();

        }
    );


    forwardButton.addEventListener(
        "click",
        function() {

            window.history.forward();

        }
    );


    refreshButton.addEventListener(
        "click",
        function() {

            window.location.reload();

        }
    );


    function goHome() {

        window.location.href =
            "/";

    }


    homeButton.addEventListener(
        "click",
        goHome
    );


    mobileHomeButton.addEventListener(
        "click",
        goHome
    );


    mobileSearchButton.addEventListener(
        "click",
        function() {

            searchInput.focus();

            searchInput.scrollIntoView({
                behavior:
                    "smooth",

                block:
                    "center"
            });

        }
    );


    mobileHistoryButton.addEventListener(
        "click",
        function() {

            historyPanel.classList.toggle(
                "hidden"
            );

            hideDropdowns();

            renderHistory();


            if (
                !historyPanel.classList.contains(
                    "hidden"
                )
            ) {

                historyPanel.scrollIntoView({
                    behavior:
                        "smooth",

                    block:
                        "center"
                });

            }

        }
    );


    mobileRefreshButton.addEventListener(
        "click",
        function() {

            window.location.reload();

        }
    );


    // ========================================================
    // DESKTOP HISTORY
    // ========================================================

    historyButton.addEventListener(
        "click",
        function() {

            historyPanel.classList.toggle(
                "hidden"
            );

            hideDropdowns();

            renderHistory();

        }
    );


    clearHistoryButton.addEventListener(
        "click",
        clearHistory
    );


    // ========================================================
    // QUICK SEARCHES
    // ========================================================

    quickChips.forEach(
        function(chip) {

            chip.addEventListener(
                "click",
                function() {

                    const query =
                        chip.getAttribute(
                            "data-query"
                        );


                    if (!query) {
                        return;
                    }


                    searchInput.value =
                        query;


                    performSearch(
                        query
                    );

                }
            );

        }
    );


    // ========================================================
    // CLICK OUTSIDE DROPDOWNS
    // ========================================================

    document.addEventListener(
        "click",
        function(event) {

            if (
                !event.target.closest(
                    ".main-search-wrapper"
                )
                &&
                !event.target.closest(
                    ".omnibox-wrapper"
                )
            ) {

                hideDropdowns();

            }

        }
    );


    // ========================================================
    // BROWSER HISTORY
    // ========================================================

    window.addEventListener(
        "popstate",
        function(event) {

            const state =
                event.state;


            if (
                state
                &&
                state.query
            ) {

                performSearch(
                    state.query,
                    false,
                    false
                );

            } else {

                const params =
                    new URLSearchParams(
                        window.location.search
                    );


                const query =
                    params.get(
                        "q"
                    );


                if (query) {

                    performSearch(
                        query,
                        false,
                        false
                    );

                } else {

                    clearSearchPage();

                }

            }

        }
    );


    // ========================================================
    // INITIAL PAGE LOAD
    // ========================================================

    const initialParams =
        new URLSearchParams(
            window.location.search
        );


    const initialQuery =
        initialParams.get(
            "q"
        );


    if (initialQuery) {

        performSearch(
            initialQuery,
            false,
            false
        );

    } else {

        renderHistory();

    }

});