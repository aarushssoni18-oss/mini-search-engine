
import os
import re
import html as html_module

from urllib.parse import urlparse, urljoin

import requests

from flask import Blueprint, jsonify, request


news_api = Blueprint(
    "news_api",
    __name__
)


# ============================================================
# CATEGORY QUERIES
# ============================================================

CATEGORY_QUERIES = {

    "india":
        "latest India news politics business economy technology sports",

    "politics":
        "latest political news elections governments policy world politics",

    "geopolitics":
        "latest geopolitics international relations diplomacy foreign policy",

    "business":
        "latest business markets companies finance economy trade news",

    "sports":
        "latest sports news cricket football basketball tennis",

    "technology":
        "latest technology artificial intelligence AI cybersecurity startups",

    "entertainment":
        "latest entertainment movies actors actresses music television streaming",

    "science":
        "latest science space NASA research climate discoveries"

}


# ============================================================
# ALL NEWS QUERIES
# ============================================================

ALL_QUERIES = [

    (
        "India & World",
        "latest major India world politics geopolitics news"
    ),

    (
        "Business & Trade",
        "latest business markets economy trade companies finance news"
    ),

    (
        "Sports",
        "latest major sports news cricket football basketball tennis"
    ),

    (
        "Technology & Culture",
        "latest technology AI entertainment science space news"
    )

]


# ============================================================
# IMAGE CACHE
# ============================================================

IMAGE_CACHE = {}


# ============================================================
# SESSION
# ============================================================

SESSION = requests.Session()

SESSION.headers.update({

    "User-Agent":
        (
            "Mozilla/5.0 "
            "(Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 "
            "Chrome/151.0 Safari/537.36"
        ),

    "Accept":
        "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"

})


# ============================================================
# CHECK WHETHER IMAGE IS LIKELY BAD
# ============================================================

def is_bad_image(
    image_url,
    description=""
):

    if not image_url:
        return True


    combined = (
        str(image_url)
        + " "
        + str(description)
    ).lower()


    bad_terms = [

        ".svg",
        "logo",
        "favicon",
        "icon",
        "avatar",
        "placeholder",
        "sprite",
        "default-image",
        "default_image",
        "generic",
        "news-story.jpg",
        "site-header",
        "header-logo"

    ]


    for term in bad_terms:

        if term in combined:
            return True


    parsed = urlparse(
        image_url
    )


    if parsed.scheme not in (
        "http",
        "https"
    ):

        return True


    return False


# ============================================================
# EXTRACT IMAGE FROM TAVILY
# ============================================================

def extract_tavily_image(
    item
):

    images = item.get(
        "images",
        []
    )


    if not isinstance(
        images,
        list
    ):

        return {
            "url": "",
            "description": ""
        }


    for image in images:

        if isinstance(
            image,
            dict
        ):

            image_url = str(
                image.get(
                    "url",
                    ""
                )
            ).strip()


            image_description = str(
                image.get(
                    "description",
                    ""
                )
            ).strip()


            if image_url and not is_bad_image(
                image_url,
                image_description
            ):

                return {

                    "url":
                        image_url,

                    "description":
                        image_description

                }


        elif isinstance(
            image,
            str
        ):

            image_url = image.strip()


            if image_url and not is_bad_image(
                image_url
            ):

                return {

                    "url":
                        image_url,

                    "description":
                        ""

                }


    return {

        "url":
            "",

        "description":
            ""

    }


# ============================================================
# EXTRACT OG IMAGE FROM ARTICLE
# ============================================================

def extract_og_image(
    article_url
):

    if not article_url:
        return ""


    if article_url in IMAGE_CACHE:

        return IMAGE_CACHE[
            article_url
        ]


    try:

        response = SESSION.get(

            article_url,

            timeout=7,

            allow_redirects=True

        )


        if response.status_code >= 400:

            IMAGE_CACHE[
                article_url
            ] = ""

            return ""


        content_type = (
            response.headers
            .get(
                "Content-Type",
                ""
            )
            .lower()
        )


        if "html" not in content_type:

            IMAGE_CACHE[
                article_url
            ] = ""

            return ""


        page_html = response.text[:100000]


        patterns = [

            r'<meta[^>]+property=["\']og:image["\'][^>]+content=["\']([^"\']+)["\']',

            r'<meta[^>]+name=["\']og:image["\'][^>]+content=["\']([^"\']+)["\']',

            r'<meta[^>]+property=["\']og:image:url["\'][^>]+content=["\']([^"\']+)["\']',

            r'<meta[^>]+name=["\']twitter:image["\'][^>]+content=["\']([^"\']+)["\']',

            r'<meta[^>]+property=["\']twitter:image["\'][^>]+content=["\']([^"\']+)["\']'

        ]


        image_url = ""


        for pattern in patterns:

            match = re.search(
                pattern,
                page_html,
                re.IGNORECASE
            )


            if match:

                image_url = html_module.unescape(
                    match.group(1).strip()
                )

                break


        # Handle relative image URL
        if image_url:

            image_url = urljoin(
                response.url,
                image_url
            )


        if image_url and is_bad_image(
            image_url
        ):

            image_url = ""


        IMAGE_CACHE[
            article_url
        ] = image_url


        return image_url


    except Exception as error:

        print(
            "Article image extraction error:",
            error
        )

        IMAGE_CACHE[
            article_url
        ] = ""

        return ""


# ============================================================
# CHOOSE BEST IMAGE
# ============================================================

def choose_image(
    item
):

    tavily_image = extract_tavily_image(
            item
        )


    if tavily_image["url"]:

        return {

            "url":
                tavily_image["url"],

            "description":
                tavily_image["description"],

            "source":
                "tavily"

        }


    article_url = str(
        item.get(
            "url",
            ""
        )
    ).strip()


    og_image = extract_og_image(
            article_url
        )


    if og_image:

        return {

            "url":
                og_image,

            "description":
                "",

            "source":
                "article"

        }


    return {

        "url":
            "",

        "description":
            "",

        "source":
            ""

    }


# ============================================================
# TAVILY NEWS SEARCH
# ============================================================

def search_news_topic(
    query,
    max_results=2
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
                False,

            "include_images":
                True,

            "include_image_descriptions":
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


    return response.json().get(
        "results",
        []
    )


# ============================================================
# FORMAT RESULT
# ============================================================

def format_news_item(
    item,
    topic_label=""
):

    url = str(
        item.get(
            "url",
            ""
        )
    ).strip()


    if not url:

        return None


    parsed = urlparse(
        url
    )


    if parsed.netloc:

        source = parsed.netloc.replace(
            "www.",
            ""
        )

    else:

        source = "web"


    image = choose_image(
        item
    )


    return {

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
            ),

        "image":
            image["url"],

        "image_description":
            image["description"],

        "image_source":
            image["source"],

        "topic":
            topic_label

    }


# ============================================================
# CATEGORY NEWS
# ============================================================

def fetch_category_news(
    query,
    max_results=8
):

    raw_results = search_news_topic(
        query,
        max_results=max_results
    )


    results = []


    for item in raw_results:

        formatted = format_news_item(
                item
            )


        if formatted:

            results.append(
                formatted
            )


    return results


# ============================================================
# ALL NEWS
# ============================================================

def fetch_all_news():

    combined = []

    seen_urls = set()


    for label, query in ALL_QUERIES:

        try:

            raw_results = search_news_topic(
                query,
                max_results=2
            )


            for item in raw_results:

                formatted = format_news_item(
                    item,
                    label
                )


                if not formatted:

                    continue


                url = formatted[
                    "url"
                ]


                if url in seen_urls:

                    continue


                seen_urls.add(
                    url
                )


                combined.append(
                    formatted
                )


        except Exception as error:

            print(
                "All-news topic error:",
                label,
                error
            )


    return combined[:8]


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


    try:

        if category == "all":

            results = fetch_all_news()


        elif category in CATEGORY_QUERIES:

            results = fetch_category_news(
                CATEGORY_QUERIES[
                    category
                ],
                max_results=8
            )


        else:

            category = "all"

            results = fetch_all_news()


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
