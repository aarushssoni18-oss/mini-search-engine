
import os
from urllib.parse import urlparse

import requests

from ai_identity import get_identity_response

from math_engine import solve_math_query
from freight_engine import solve_freight_query

from flask import (
    Blueprint,
    jsonify,
    request
)


ai_answer = Blueprint(
    "ai_answer",
    __name__
)


# ============================================================
# TAVILY AI ANSWER
# ============================================================

def generate_ai_answer(
    query,
    max_results=6
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

            "search_depth":
                "basic",

            "topic":
                "general",

            "max_results":
                max_results,

            "include_answer":
                "basic",

            "include_raw_content":
                False,

            "include_images":
                False,

            "include_favicon":
                True

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


    answer = str(
        data.get(
            "answer",
            ""
        )
    ).strip()


    sources = []


    for item in data.get(
        "results",
        []
    )[:6]:

        url = str(
            item.get(
                "url",
                ""
            )
        ).strip()


        if not url:
            continue


        parsed = urlparse(
            url
        )


        domain = (
            parsed.netloc.replace(
                "www.",
                ""
            )
            if parsed.netloc
            else "web"
        )


        sources.append({

            "title":
                str(
                    item.get(
                        "title",
                        domain
                    )
                ),

            "url":
                url,

            "source":
                domain,

            "favicon":
                str(
                    item.get(
                        "favicon",
                        ""
                    )
                )

        })


    return {

        "answer":
            answer,

        "sources":
            sources

    }


# ============================================================
# AI ANSWER ROUTE
# ============================================================

@ai_answer.get(
    "/ai-answer"
)
def get_ai_answer():

    query = request.args.get(
        "q",
        ""
    ).strip()


    freight_answer = solve_freight_query(
        query
    )

    if freight_answer:

        return jsonify({

            "status":
                "ok",

            "query":
                query,

            "answer":
                freight_answer,

            "sources":
                []

        })

    math_answer = solve_math_query(
        query
    )

    if math_answer:

        return jsonify({

            "status":
                "ok",

            "query":
                query,

            "answer":
                math_answer,

            "sources":
                []

        })

    identity_answer = get_identity_response(
        query
    )

    if identity_answer:

        return jsonify({

            "status":
                "ok",

            "query":
                query,

            "answer":
                identity_answer,

            "sources":
                []

        })


    if not query:

        return jsonify({

            "status":
                "empty",

            "query":
                "",

            "answer":
                "",

            "sources":
                []

        })


    try:

        result = generate_ai_answer(
            query,
            max_results=6
        )


        return jsonify({

            "status":
                "ok",

            "query":
                query,

            "answer":
                result["answer"],

            "sources":
                result["sources"]

        })


    except Exception as error:

        print(
            "AI Answer error:",
            error
        )


        return jsonify({

            "status":
                "error",

            "query":
                query,

            "answer":
                "",

            "sources":
                [],

            "message":
                str(error)

        }), 500
