
import re


# ============================================================
# MINI SEARCH AI — IDENTITY
# ============================================================

IDENTITY_STATEMENT = (
    "I’m Mini Search AI, the AI assistant built into "
    "the Mini Search project. I’m not ChatGPT, Amazon’s "
    "assistant, or Google’s assistant. My current web-answer "
    "system uses Tavily to retrieve web information and "
    "provide answers with sources."
)


def extract_current_question(
    query
):
    """
    The chatbot sends conversation context together
    with the current question.

    Extract only the current user question so an older
    conversation message does not accidentally trigger
    an identity response.
    """

    text = str(
        query or ""
    )

    marker = (
        "current user question:"
    )

    lower_text = text.lower()

    position = lower_text.rfind(
        marker
    )

    if position >= 0:

        return text[
            position + len(marker):
        ].strip()

    return text.strip()


def get_identity_response(
    query
):
    """
    Return a fixed identity answer when the user is asking
    about Mini Search AI itself.

    Return None for normal questions so Tavily handles them.
    """

    question = extract_current_question(
        query
    )


    normalized = re.sub(
        r"\s+",
        " ",
        question.lower()
    ).strip()


    identity_patterns = [

        r"\bwho are you\b",

        r"\bwhat are you\b",

        r"\bwhat is your name\b",

        r"\bwhat's your name\b",

        r"\bwho created you\b",

        r"\bwho made you\b",

        r"\bwho built you\b",

        r"\bwho developed you\b",

        r"\bwho designed you\b",

        r"\bwho owns you\b",

        r"\bwhat company created you\b",

        r"\bwhat company made you\b",

        r"\bwhat company built you\b",

        r"\bwhat company developed you\b",

        r"\bare you chatgpt\b",

        r"\bare you amazon\b",

        r"\bare you google\b",

        r"\bare you openai\b",

        r"\bare you an ai\b",

        r"\bare you artificial intelligence\b",

        r"\bwhere are you from\b",

        r"\bwhat can you do\b"

    ]


    for pattern in identity_patterns:

        if re.search(
            pattern,
            normalized
        ):

            return IDENTITY_STATEMENT


    return None
