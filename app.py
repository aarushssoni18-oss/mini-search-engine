import os
import json
import requests
import joblib

from flask import Flask, jsonify, request, send_from_directory
from sklearn.metrics.pairwise import cosine_similarity
from news_api import news_api
from ai_answer import ai_answer


# ============================================================
# PATHS
# ============================================================

BASE_DIR = os.path.dirname(
    os.path.abspath(__file__)
)


# ============================================================
# FLASK APP
# ============================================================

app = Flask(
    __name__,
    static_folder=None
)


app.register_blueprint(news_api)
app.register_blueprint(ai_answer)


# ============================================================
# LOAD SEARCH INDEX
# ============================================================

with open(
    os.path.join(BASE_DIR, "pages.json"),
    "r",
    encoding="utf-8"
) as f:
    pages = json.load(f)


vectorizer = joblib.load(
    os.path.join(BASE_DIR, "vectorizer.joblib")
)


tfidf_matrix = joblib.load(
    os.path.join(BASE_DIR, "tfidf_matrix.joblib")
)


print(
    f"Loaded {len(pages)} searchable pages."
)


# ============================================================
# LOCAL TF-IDF SEARCH
# ============================================================

def better_search(query, top_k=10):

    query = str(query).strip()

    if not query:
        return []


    query_vector = vectorizer.transform(
        [query]
    )


    similarities = cosine_similarity(
        query_vector,
        tfidf_matrix
    ).flatten()


    ranked_indexes = similarities.argsort()[::-1]


    results = []


    for index in ranked_indexes:

        score = float(
            similarities[index]
        )


        if score <= 0:
            continue


        if index >= len(pages):
            continue


        page = pages[index]


        text = str(
            page.get(
                "text",
                ""
            )
        )


        lower_text = text.lower()

        words = query.lower().split()

        position = 0


        for word in words:

            found = lower_text.find(
                word
            )

            if found != -1:

                position = found

                break


        start = max(
            0,
            position - 120
        )


        end = min(
            len(text),
            position + 300
        )


        snippet = text[
            start:end
        ]


        url = str(
            page.get(
                "url",
                ""
            )
        ).strip()


        if not url:
            continue


        title = str(
            page.get(
                "title",
                url
            )
        )


        results.append({

            "title": title,

            "url": url,

            "snippet": snippet,

            "score": round(
                score,
                4
            ),

            "source":
                "local_index"

        })


        if len(results) >= top_k:
            break


    return results


# ============================================================
# TAVILY SEARCH
# ============================================================

def tavily_search(
    query,
    max_results=10
):

    api_key = os.environ.get(
        "TAVILY_API_KEY"
    )


    if not api_key:

        print(
            "TAVILY_API_KEY is not configured."
        )

        return []


    response = requests.post(

        "https://api.tavily.com/search",

        json={

            "query": query,

            "search_depth": "basic",

            "topic": "general",

            "max_results": max_results,

            "include_answer": False,

            "include_raw_content": False

        },

        headers={

            "Authorization":
                f"Bearer {api_key}",

            "Content-Type":
                "application/json"

        },

        timeout=30

    )


    response.raise_for_status()


    data = response.json()


    return data.get(
        "results",
        []
    )


# ============================================================
# HYBRID SEARCH
# ============================================================

def hybrid_search(query):

    query = str(query).strip()


    print()
    print(
        "SEARCH REQUEST:",
        query
    )


    if not query:
        return []


    # --------------------------------------------------------
    # LIVE WEB RESULTS
    # --------------------------------------------------------

    web_results = []


    try:

        tavily_results = tavily_search(
            query,
            max_results=10
        )


        for item in tavily_results:

            url = str(
                item.get(
                    "url",
                    ""
                )
            ).strip()


            if not url:
                continue


            web_results.append({

                "title":
                    item.get(
                        "title",
                        ""
                    ),

                "url":
                    url,

                "snippet":
                    item.get(
                        "content",
                        ""
                    ),

                "score":
                    item.get(
                        "score",
                        None
                    ),

                "source":
                    "live_web"

            })


    except Exception as error:

        print(
            "Tavily error:",
            error
        )


    # --------------------------------------------------------
    # LOCAL INDEX RESULTS
    # --------------------------------------------------------

    local_results = []


    try:

        local_results = better_search(
            query,
            top_k=5
        )


    except Exception as error:

        print(
            "Local search error:",
            error
        )


    # --------------------------------------------------------
    # COMBINE AND REMOVE DUPLICATES
    # --------------------------------------------------------

    combined_results = []

    seen_urls = set()


    for result in (
        web_results + local_results
    ):

        url = str(
            result.get(
                "url",
                ""
            )
        ).strip()


        if not url:
            continue


        if url in seen_urls:
            continue


        seen_urls.add(
            url
        )


        combined_results.append(
            result
        )


    return combined_results[:10]


# ============================================================
# HOME PAGE
# ============================================================

@app.route("/")
def home():

    return send_from_directory(
        BASE_DIR,
        "index.html"
    )


# ============================================================
# FRONTEND FILES
# ============================================================

@app.route(
    "/<path:filename>"
)
def frontend_files(filename):

    filepath = os.path.join(
        BASE_DIR,
        filename
    )


    base_path = os.path.abspath(
        BASE_DIR
    )


    file_path = os.path.abspath(
        filepath
    )


    if not file_path.startswith(
        base_path + os.sep
    ):

        return "File not found", 404


    if os.path.isfile(
        file_path
    ):

        return send_from_directory(
            BASE_DIR,
            filename
        )


    return "File not found", 404


# ============================================================
# SEARCH API
# ============================================================

@app.route(
    "/search"
)
def search():

    query = request.args.get(
        "q",
        ""
    ).strip()


    results = hybrid_search(
        query
    )


    return jsonify({

        "query": query,

        "mode": "hybrid",

        "results": results,

        "total_results":
            len(results),

        "local_index_pages":
            len(pages)

    })


# ============================================================
# HEALTH CHECK
# ============================================================

@app.route(
    "/health"
)
def health():

    return jsonify({

        "status": "ok",

        "pages":
            len(pages),

        "tfidf_rows":
            int(
                tfidf_matrix.shape[0]
            ),

        "tfidf_features":
            int(
                tfidf_matrix.shape[1]
            )

    })


# ============================================================
# LOCAL RUN
# ============================================================

if __name__ == "__main__":

    port = int(
        os.environ.get(
            "PORT",
            "5000"
        )
    )


    app.run(
        host="0.0.0.0",
        port=port,
        debug=False
    )
