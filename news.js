
document.addEventListener(
    "DOMContentLoaded",
    function () {

        const categoryButtons =
            document.querySelectorAll(
                ".news-category"
            );

        const newsList =
            document.getElementById(
                "newsList"
            );

        const newsStatus =
            document.getElementById(
                "newsStatus"
            );

        const newsRefresh =
            document.getElementById(
                "newsRefresh"
            );


        if (
            !newsList
            ||
            !newsStatus
        ) {

            return;

        }


        // ====================================================
        // ESCAPE HTML
        // ====================================================

        function escapeHTML(
            value
        ) {

            const div =
                document.createElement(
                    "div"
                );

            div.textContent =
                value == null
                    ? ""
                    : String(value);

            return div.innerHTML;

        }


        // ====================================================
        // LOAD NEWS
        // ====================================================

        async function loadNews(
            category = "all"
        ) {

            newsList.innerHTML = `
                <div class="news-loading">
                    Loading the latest news...
                </div>
            `;


            newsStatus.textContent =
                "Fetching latest stories...";


            try {

                const response =
                    await fetch(
                        "/news?category="
                        + encodeURIComponent(
                            category
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
                    !response.ok
                    ||
                    data.status !== "ok"
                ) {

                    throw new Error(
                        data.message
                        ||
                        "Unable to load news."
                    );

                }


                renderNews(
                    data.results
                    ||
                    []
                );


                newsStatus.textContent =
                    "Latest stories • "
                    + formatCategory(
                        category
                    );


            } catch (error) {

                console.error(
                    "News error:",
                    error
                );


                newsList.innerHTML = `
                    <div class="news-error">
                        News could not be loaded right now.
                        Please try again.
                    </div>
                `;


                newsStatus.textContent =
                    "News service unavailable";

            }

        }


        // ====================================================
        // RENDER NEWS
        // ====================================================

        function renderNews(
            items
        ) {

            newsList.innerHTML =
                "";


            if (
                !Array.isArray(items)
                ||
                items.length === 0
            ) {

                newsList.innerHTML = `
                    <div class="news-error">
                        No recent stories were found
                        for this category.
                    </div>
                `;

                return;

            }


            items.forEach(
                function(item) {

                    const card =
                        document.createElement(
                            "article"
                        );

                    card.className =
                        "news-card";


                    const title =
                        item.title
                        ||
                        "Untitled story";


                    const url =
                        item.url
                        ||
                        "#";


                    const snippet =
                        item.snippet
                        ||
                        "No description available.";


                    const source =
                        item.source
                        ||
                        "web";


                    const published =
                        formatDate(
                            item.published
                        );


                    card.innerHTML = `

                        <div class="news-meta">

                            <span class="news-source">
                                ${escapeHTML(source)}
                            </span>

                            ${
                                published
                                ?
                                `
                                <span class="news-dot">
                                    •
                                </span>

                                <span>
                                    ${escapeHTML(published)}
                                </span>
                                `
                                :
                                ""
                            }

                        </div>


                        <h3>

                            <a
                                href="${escapeHTML(url)}"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                ${escapeHTML(title)}
                            </a>

                        </h3>


                        <p>
                            ${escapeHTML(snippet)}
                        </p>


                        <a
                            class="news-read"
                            href="${escapeHTML(url)}"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            Read story →
                        </a>

                    `;


                    newsList.appendChild(
                        card
                    );

                }
            );

        }


        // ====================================================
        // DATE
        // ====================================================

        function formatDate(
            value
        ) {

            if (!value) {
                return "";
            }


            const date =
                new Date(
                    value
                );


            if (
                Number.isNaN(
                    date.getTime()
                )
            ) {

                return "";

            }


            return date.toLocaleDateString(
                undefined,
                {
                    month:
                        "short",

                    day:
                        "numeric",

                    year:
                        "numeric"
                }
            );

        }


        // ====================================================
        // CATEGORY NAME
        // ====================================================

        function formatCategory(
            category
        ) {

            const names = {

                all:
                    "All News",

                india:
                    "India",

                politics:
                    "Politics",

                geopolitics:
                    "Geopolitics",

                business:
                    "Business & Trade",

                sports:
                    "Sports",

                technology:
                    "Technology & AI",

                entertainment:
                    "Entertainment",

                science:
                    "Science & Space"

            };


            return (
                names[category]
                ||
                "News"
            );

        }


        // ====================================================
        // CATEGORY BUTTONS
        // ====================================================

        categoryButtons.forEach(
            function(button) {

                button.addEventListener(
                    "click",
                    function() {

                        categoryButtons.forEach(
                            function(item) {

                                item.classList.remove(
                                    "active"
                                );

                            }
                        );


                        button.classList.add(
                            "active"
                        );


                        const category =
                            button.getAttribute(
                                "data-category"
                            )
                            ||
                            "all";


                        loadNews(
                            category
                        );

                    }
                );

            }
        );


        // ====================================================
        // REFRESH BUTTON
        // ====================================================

        if (newsRefresh) {

            newsRefresh.addEventListener(
                "click",
                function() {

                    const active =
                        document.querySelector(
                            ".news-category.active"
                        );


                    const category =
                        active
                        ?
                        active.getAttribute(
                            "data-category"
                        )
                        :
                        "all";


                    loadNews(
                        category
                    );

                }
            );

        }


        // ====================================================
        // INITIAL NEWS LOAD
        // ====================================================

        loadNews(
            "all"
        );

    }
);
