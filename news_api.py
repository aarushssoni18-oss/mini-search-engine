
import os
from urllib.parse import urlparse

import requests

from flask import Blueprint, jsonify, request


news_api = Blueprint(
    "news_api",
    __name__
)


# ============================================================
# NEWS CATEGORIES
# ============================================================

CATEGORY_QUERIES = {

    "all":
        "latest major news politics geopolitics business trade sports technology entertainment science world",

    "india":
        "latest India news politics business economy technology sports",

    "politics":
        "latest political news elections governments policy world politics",

    "geopolitics":
        "latest geopolitics international relations conflicts diplomacy foreign policy",

    "business":
        "latest business markets companies finance economy trade",

    "sports":
        "latest sports news cricket football basketball tennis major sports",

    "technology":
        "latest technology artificial intelligence AI cybersecurity startups technology companies",

    "entertainment":
        "latest entertainment movies actors actresses music television streaming celebrities",

    "science":
        "latest science space NASA research health science climate discoveries"

}


# ============================================================
# TAVILY NEWS SEARCH
# ============================================================

def fetch_news(
    query,
    max_results=8
):

    api_key = os.environ.get(
        "TAVILY_API_KEY"
    )


    if not api_key:

        raise RuntimeError(
            "TAVILY_API_KEY is not configured."
        )


    response = requests.post(

        "https://api.tavily.com/search",

        json={

            "query":
                query,

            "topic":
                "news",

            "search_depth":
                "basic",

            "time_range":
                "day",

            "max_results":
                max_results,

            "include_answer":
                False,

            "include_raw_content":
                False

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


    news_items = []


    for item in data.get(
        "results",
        []
    ):

        url = str(
            item.get(
                "url",
                ""
            )
        ).strip()


        if not url:
            continue


        parsed = urlparse(url)


        source = (
            parsed.netloc
            .replace(
                "www.",
                ""
            )
            if parsed.netloc
            else "web"
        )


        news_items.append({

            "title":
                item.get(
                    "title",
                    "Untitled story"
                ),

            "url":
                url,

            "snippet":
                item.get(
                    "content",
                    ""
                ),

            "published":
                item.get(
                    "published_date",
                    ""
                ),

            "source":
                source,

            "score":
                item.get(
                    "score",
                    None
                )

        })


    return news_items


# ============================================================
# NEWS ROUTE
# ============================================================

@news_api.get(
    "/news"
)
def news():

    category = request.args.get(
        "category",
        "all"
    ).strip().lower()


    if category not in CATEGORY_QUERIES:

        category = "all"


    query = CATEGORY_QUERIES[
        category
    ]


    try:

        results = fetch_news(
            query,
            max_results=8
        )


        return jsonify({

            "status":
                "ok",

            "category":
                category,

            "results":
                results,

            "total_results":
                len(results)

        })


    except Exception as error:

        print(
            "News API error:",
            error
        )


        return jsonify({

            "status":
                "error",

            "category":
                category,

            "results":
                [],

            "total_results":
                0,

            "message":
                str(error)

        }), 500
