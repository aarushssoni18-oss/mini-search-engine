
document.addEventListener(
    "DOMContentLoaded",
    function () {

        const answerBox =
            document.getElementById(
                "aiAnswerBox"
            );

        const answerText =
            document.getElementById(
                "aiAnswerText"
            );

        const answerSources =
            document.getElementById(
                "aiAnswerSources"
            );

        const loading =
            document.getElementById(
                "aiAnswerLoading"
            );

        const refreshButton =
            document.getElementById(
                "aiAnswerRefresh"
            );

        const searchInput =
            document.getElementById(
                "searchInput"
            );


        if (
            !answerBox ||
            !answerText ||
            !answerSources ||
            !searchInput
        ) {

            console.error(
                "AI Answer: required elements are missing."
            );

            return;

        }


        // ====================================================
        // FIND EXISTING SEARCH RESULTS CONTAINER
        // ====================================================

        const resultsContainer =
            document.getElementById("results")
            ||
            document.getElementById("searchResults")
            ||
            document.querySelector(".search-results")
            ||
            document.querySelector(".results");


        // Put AI answer immediately above search results
        if (
            resultsContainer &&
            answerBox.parentNode
        ) {

            resultsContainer.parentNode.insertBefore(
                answerBox,
                resultsContainer
            );

        }


        let lastQuery = "";
        let requestNumber = 0;


        // ====================================================
        // HIDE
        // ====================================================

        function hideAnswer() {

            answerBox.classList.add(
                "hidden"
            );

            answerText.textContent =
                "";

            answerSources.innerHTML =
                "";

            if (loading) {
                loading.classList.add(
                    "hidden"
                );
            }

        }


        // ====================================================
        // LOADING
        // ====================================================

        function showLoading() {

            answerBox.classList.remove(
                "hidden"
            );

            answerText.textContent =
                "";

            answerSources.innerHTML =
                "";

            if (loading) {

                loading.classList.remove(
                    "hidden"
                );

            }

        }


        // ====================================================
        // DISPLAY SOURCES
        // ====================================================

        function renderSources(
            sources
        ) {

            answerSources.innerHTML =
                "";

            if (
                !Array.isArray(sources)
            ) {
                return;
            }


            const seen =
                new Set();


            sources.slice(
                0,
                6
            ).forEach(
                function (source) {

                    const url =
                        String(
                            source.url || ""
                        ).trim();


                    if (!url) {
                        return;
                    }


                    if (seen.has(url)) {
                        return;
                    }


                    seen.add(url);


                    const link =
                        document.createElement(
                            "a"
                        );


                    link.className =
                        "ai-source";

                    link.href =
                        url;

                    link.target =
                        "_blank";

                    link.rel =
                        "noopener noreferrer";


                    if (
                        source.favicon
                    ) {

                        const favicon =
                            document.createElement(
                                "img"
                            );

                        favicon.className =
                            "ai-source-favicon";

                        favicon.src =
                            source.favicon;

                        favicon.alt =
                            "";

                        favicon.loading =
                            "lazy";

                        favicon.addEventListener(
                            "error",
                            function () {
                                favicon.remove();
                            }
                        );

                        link.appendChild(
                            favicon
                        );

                    }


                    const label =
                        document.createElement(
                            "span"
                        );


                    label.textContent =
                        source.source
                        ||
                        source.title
                        ||
                        "Source";


                    link.appendChild(
                        label
                    );


                    answerSources.appendChild(
                        link
                    );

                }
            );

        }


        // ====================================================
        // LOAD AI ANSWER
        // ====================================================

        async function loadAnswer(
            query
        ) {

            const cleanQuery =
                String(
                    query || ""
                ).trim();


            if (!cleanQuery) {

                hideAnswer();

                return;

            }


            if (
                cleanQuery ===
                lastQuery
            ) {

                return;

            }


            lastQuery =
                cleanQuery;


            const thisRequest =
                ++requestNumber;


            showLoading();


            try {

                const response =
                    await fetch(
                        "/ai-answer?q="
                        + encodeURIComponent(
                            cleanQuery
                        ),
                        {
                            method:
                                "GET",

                            cache:
                                "no-store"
                        }
                    );


                const data =
                    await response.json();


                if (
                    thisRequest !==
                    requestNumber
                ) {

                    return;

                }


                if (
                    !response.ok
                    ||
                    data.status !==
                        "ok"
                ) {

                    hideAnswer();

                    return;

                }


                if (loading) {

                    loading.classList.add(
                        "hidden"
                    );

                }


                if (
                    !data.answer
                ) {

                    hideAnswer();

                    return;

                }


                answerText.textContent =
                    data.answer;


                renderSources(
                    data.sources
                );


                answerBox.classList.remove(
                    "hidden"
                );


            } catch (error) {

                console.error(
                    "AI Answer error:",
                    error
                );


                if (
                    thisRequest ===
                    requestNumber
                ) {

                    hideAnswer();

                }

            }

        }


        // ====================================================
        // WATCH SEARCH RESULTS
        // ====================================================

        if (resultsContainer) {

            const observer =
                new MutationObserver(
                    function () {

                        const query =
                            searchInput.value.trim();


                        if (!query) {
                            return;
                        }


                        clearTimeout(
                            window.miniSearchAIWait
                        );


                        window.miniSearchAIWait =
                            setTimeout(
                                function () {

                                    loadAnswer(
                                        query
                                    );

                                },
                                350
                            );

                    }
                );


            observer.observe(
                resultsContainer,
                {
                    childList:
                        true,

                    subtree:
                        true
                }
            );

        }


        // ====================================================
        // REFRESH AI ANSWER
        // ====================================================

        if (refreshButton) {

            refreshButton.addEventListener(
                "click",
                function () {

                    const query =
                        searchInput.value.trim();


                    if (!query) {
                        return;
                    }


                    lastQuery =
                        "";


                    loadAnswer(
                        query
                    );

                }
            );

        }


        console.log(
            "✅ AI Quick Answer initialized."
        );

    }
);
