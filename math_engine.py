
import ast
import math
import operator
import re

from decimal import Decimal, ROUND_HALF_UP

import sympy as sp


# ============================================================
# CONSTANTS
# ============================================================

MONEY_QUANT = Decimal("0.01")


# ============================================================
# FORMATTING
# ============================================================

def money(value, symbol=""):
    value = Decimal(str(value)).quantize(
        MONEY_QUANT,
        rounding=ROUND_HALF_UP
    )

    text = f"{value:,.2f}"

    if text.endswith(".00"):
        text = text[:-3]

    return f"{symbol}{text}"


def number(value):
    value = float(value)

    if abs(value - round(value)) < 1e-10:
        return f"{int(round(value)):,}"

    return f"{value:,.6f}".rstrip("0").rstrip(",")


def extract_current_question(query):
    text = str(query or "")

    marker = "current user question:"

    position = text.lower().rfind(marker)

    if position >= 0:
        return text[position + len(marker):].strip()

    return text.strip()


# ============================================================
# NUMBER HELPERS
# ============================================================

NUMBER = r"-?\d+(?:,\d{3})*(?:\.\d+)?"

PERCENT = r"(\d+(?:\.\d+)?)\s*%"

TIME = (
    r"(\d+(?:\.\d+)?)\s*"
    r"(years?|yrs?|months?|mos?|quarters?|days?)"
)


def clean_number(value):
    return Decimal(
        str(value).replace(",", "").strip()
    )


def first_number(pattern, text):
    match = re.search(
        pattern,
        text,
        re.IGNORECASE
    )

    if not match:
        return None

    return clean_number(
        match.group(1)
    )


def detect_currency_symbol(text):
    lower = text.lower()

    if "₹" in text or "inr" in lower or "rupee" in lower:
        return "₹"

    if "$" in text or "usd" in lower or "dollar" in lower:
        return "$"

    if "€" in text or "eur" in lower or "euro" in lower:
        return "€"

    if "£" in text or "gbp" in lower or "pound" in lower:
        return "£"

    return ""


def extract_time(text):
    match = re.search(
        TIME,
        text,
        re.IGNORECASE
    )

    if not match:
        return None

    value = float(match.group(1))
    unit = match.group(2).lower()

    if unit.startswith("month") or unit.startswith("mos"):
        value = value / 12

    elif unit.startswith("quarter"):
        value = value / 4

    elif unit.startswith("day"):
        value = value / 365

    return value


# ============================================================
# SAFE BASIC ARITHMETIC
# ============================================================

SAFE_MATH_NAMES = {
    "pi": math.pi,
    "e": math.e,
    "sqrt": math.sqrt,
    "abs": abs,
    "sin": math.sin,
    "cos": math.cos,
    "tan": math.tan,
    "log": math.log10,
    "ln": math.log,
    "exp": math.exp,
}


SAFE_BINOPS = {
    ast.Add: operator.add,
    ast.Sub: operator.sub,
    ast.Mult: operator.mul,
    ast.Div: operator.truediv,
    ast.Pow: operator.pow,
    ast.Mod: operator.mod,
}


SAFE_UNARYOPS = {
    ast.UAdd: operator.pos,
    ast.USub: operator.neg,
}


def safe_math_eval(expression):

    expression = (
        expression
        .replace("×", "*")
        .replace("÷", "/")
        .replace("^", "**")
    )

    if len(expression) > 200:
        raise ValueError("Expression is too long.")

    if "__" in expression:
        raise ValueError("Invalid expression.")

    tree = ast.parse(
        expression,
        mode="eval"
    )

    def evaluate(node):

        if isinstance(
            node,
            ast.Expression
        ):
            return evaluate(node.body)

        if isinstance(
            node,
            ast.Constant
        ):

            if isinstance(
                node.value,
                (int, float)
            ):
                return node.value

            raise ValueError(
                "Only numbers are allowed."
            )

        if isinstance(
            node,
            ast.BinOp
        ):

            operation = SAFE_BINOPS.get(
                type(node.op)
            )

            if operation is None:
                raise ValueError(
                    "Unsupported operation."
                )

            left = evaluate(
                node.left
            )

            right = evaluate(
                node.right
            )

            return operation(
                left,
                right
            )

        if isinstance(
            node,
            ast.UnaryOp
        ):

            operation = SAFE_UNARYOPS.get(
                type(node.op)
            )

            if operation is None:
                raise ValueError(
                    "Unsupported operation."
                )

            return operation(
                evaluate(
                    node.operand
                )
            )

        if isinstance(
            node,
            ast.Name
        ):

            if node.id not in SAFE_MATH_NAMES:
                raise ValueError(
                    "Unknown mathematical name."
                )

            return SAFE_MATH_NAMES[
                node.id
            ]

        if isinstance(
            node,
            ast.Call
        ):

            if not isinstance(
                node.func,
                ast.Name
            ):
                raise ValueError(
                    "Invalid function."
                )

            function = SAFE_MATH_NAMES.get(
                node.func.id
            )

            if not callable(function):
                raise ValueError(
                    "Unknown function."
                )

            arguments = [
                evaluate(argument)
                for argument in node.args
            ]

            return function(
                *arguments
            )

        raise ValueError(
            "Unsupported expression."
        )

    return evaluate(tree)


# ============================================================
# PERCENTAGE
# ============================================================

def percentage_answer(text):

    pattern = (
        rf"(?:what\s+is|calculate|find)\s+"
        rf"{PERCENT}\s+of\s+({NUMBER})"
    )

    match = re.search(
        pattern,
        text,
        re.IGNORECASE
    )

    if not match:
        return None

    rate = Decimal(
        match.group(1)
    )

    base = clean_number(
        match.group(2)
    )

    result = (
        base
        * rate
        / Decimal("100")
    )

    return (
        "Percentage Calculation\n\n"
        f"{rate}% of {number(base)}\n\n"
        f"= {number(base)} × {rate} ÷ 100\n"
        f"= {money(result)}\n\n"
        f"Answer: {money(result)}"
    )


# ============================================================
# SIMPLE INTEREST
# ============================================================

def simple_interest_answer(text):

    if "simple interest" not in text.lower():
        return None


    # Prefer an explicitly currency-marked amount.
    currency_match = re.search(
        rf"(?:₹|\$|€|£)\s*({NUMBER})",
        text,
        re.IGNORECASE
    )


    principal = None


    if currency_match:

        principal = clean_number(
            currency_match.group(1)
        )

    else:

        # Natural wording:
        # "simple interest on 20,000"
        amount_match = re.search(
            rf"(?:on|of|principal|sum|invested|deposit)"
            rf"\s*(?:is|=|:|of)?\s*"
            rf"({NUMBER})",
            text,
            re.IGNORECASE
        )

        if amount_match:

            principal = clean_number(
                amount_match.group(1)
            )


    rate_match = re.search(
        PERCENT,
        text
    )


    time = extract_time(
        text
    )


    if (
        principal is None
        or
        not rate_match
        or
        time is None
    ):
        return None


    rate = Decimal(
        rate_match.group(1)
    )


    interest = (
        principal
        * rate
        * Decimal(str(time))
        / Decimal("100")
    )


    amount = (
        principal
        + interest
    )


    symbol = detect_currency_symbol(
        text
    )


    return (
        "Simple Interest\n\n"
        f"Principal = {money(principal, symbol)}\n"
        f"Rate = {rate}% per year\n"
        f"Time = {number(time)} years\n\n"
        "Interest = P × R × T ÷ 100\n"
        f"= {money(interest, symbol)}\n\n"
        "Total Amount = P + Interest\n"
        f"= {money(amount, symbol)}\n\n"
        f"Answer: Simple interest = "
        f"{money(interest, symbol)}\n"
        f"Total amount = {money(amount, symbol)}"
    )


# ============================================================
# COMPOUND INTEREST
# ============================================================

def compound_interest_answer(text):

    lower = text.lower()

    if (
        "compound interest" not in lower
        and
        not re.search(
            r"\bcompounded\b",
            lower
        )
    ):
        return None

    principal_match = re.search(
        rf"(?:principal|invested|invest|deposit|sum).*?({NUMBER})",
        text,
        re.IGNORECASE
    )

    if principal_match:

        principal = clean_number(
            principal_match.group(1)
        )

    else:

        number_match = re.search(
            NUMBER,
            text
        )

        if not number_match:
            return None

        principal = clean_number(
            number_match.group(0)
        )


    rate_match = re.search(
        PERCENT,
        text
    )

    if not rate_match:
        return None

    rate = Decimal(
        rate_match.group(1)
    )


    time = extract_time(
        text
    )

    if time is None:
        return None


    frequency = 1

    if "monthly" in lower or "per month" in lower:
        frequency = 12

    elif "quarterly" in lower:
        frequency = 4

    elif "half-yearly" in lower or "half yearly" in lower:
        frequency = 2

    elif "daily" in lower:
        frequency = 365


    # Use high precision Decimal arithmetic when the
    # number of compounding periods is an integer.
    periods_float = (
        frequency * time
    )


    if abs(
        periods_float
        -
        round(periods_float)
    ) < 1e-10:

        periods = int(
            round(periods_float)
        )

        rate_period = (
            rate
            /
            Decimal("100")
            /
            Decimal(str(frequency))
        )

        amount = (
            principal
            *
            (
                Decimal("1")
                + rate_period
            )
            ** periods
        )

    else:

        base = (
            float(rate)
            /
            100
            /
            frequency
        )

        amount = Decimal(
            str(
                float(principal)
                *
                (
                    1 + base
                )
                ** periods_float
            )
        )


    interest = (
        amount
        -
        principal
    )


    symbol = detect_currency_symbol(
        text
    )


    frequency_text = {
        1: "annually",
        2: "half-yearly",
        4: "quarterly",
        12: "monthly",
        365: "daily",
    }.get(
        frequency,
        "per period"
    )


    return (
        "Compound Interest\n\n"
        f"Principal = {money(principal, symbol)}\n"
        f"Rate = {rate}% per year\n"
        f"Time = {number(time)} years\n"
        f"Compounding = {frequency_text}\n\n"
        "Formula:\n"
        "A = P(1 + r/n)^(nt)\n\n"
        f"Amount = {money(amount, symbol)}\n"
        f"Compound Interest = A - P\n"
        f"= {money(interest, symbol)}\n\n"
        f"Answer: Compound interest = "
        f"{money(interest, symbol)}\n"
        f"Total amount = {money(amount, symbol)}"
    )


# ============================================================
# PROFIT / LOSS
# ============================================================

def profit_loss_answer(text):

    lower = text.lower()

    if (
        "profit" not in lower
        and
        "loss" not in lower
    ):
        return None


    cost_patterns = [
        rf"(?:cost\s+price|cp)\s*(?:is|=|:)?\s*({NUMBER})",
        rf"(?:bought|buy|cost).*?({NUMBER})",
    ]


    selling_patterns = [
        rf"(?:selling\s+price|sp)\s*(?:is|=|:)?\s*({NUMBER})",
        rf"(?:sold|selling).*?({NUMBER})",
    ]


    cost = None
    selling = None


    for pattern in cost_patterns:

        match = re.search(
            pattern,
            text,
            re.IGNORECASE
        )

        if match:

            cost = clean_number(
                match.group(1)
            )

            break


    for pattern in selling_patterns:

        match = re.search(
            pattern,
            text,
            re.IGNORECASE
        )

        if match:

            selling = clean_number(
                match.group(1)
            )

            break


    if (
        cost is None
        or
        selling is None
        or
        cost == 0
    ):
        return None


    difference = (
        selling
        - cost
    )


    percentage = (
        abs(difference)
        /
        cost
        *
        Decimal("100")
    )


    symbol = detect_currency_symbol(
        text
    )


    if difference > 0:

        result_word = "Profit"

    elif difference < 0:

        result_word = "Loss"

    else:

        result_word = "No profit or loss"


    return (
        "Profit & Loss\n\n"
        f"Cost Price = {money(cost, symbol)}\n"
        f"Selling Price = {money(selling, symbol)}\n\n"
        f"{result_word} = "
        f"{money(abs(difference), symbol)}\n\n"
        f"Percentage = "
        f"{money(percentage)}%\n\n"
        f"Answer: {result_word} = "
        f"{money(abs(difference), symbol)} "
        f"({money(percentage)}%)"
    )


# ============================================================
# DISCOUNT
# ============================================================

def discount_answer(text):

    lower = text.lower()

    if "discount" not in lower:
        return None


    marked_match = re.search(
        rf"(?:marked\s+price|list\s+price|mrp)"
        rf"\s*(?:is|=|:)?\s*"
        rf"(?:₹|\$|€|£)?\s*"
        rf"({NUMBER})",
        text,
        re.IGNORECASE
    )


    if not marked_match:

        # Fallback to a currency amount.
        currency_match = re.search(
            rf"(?:₹|\$|€|£)\s*({NUMBER})",
            text,
            re.IGNORECASE
        )

        if not currency_match:
            return None

        marked = clean_number(
            currency_match.group(1)
        )

    else:

        marked = clean_number(
            marked_match.group(1)
        )


    discount_match = re.search(
        PERCENT,
        text
    )


    if not discount_match:
        return None


    rate = Decimal(
        discount_match.group(1)
    )


    discount = (
        marked
        * rate
        / Decimal("100")
    )


    selling = (
        marked
        - discount
    )


    symbol = detect_currency_symbol(
        text
    )


    return (
        "Discount Calculation\n\n"
        f"Marked Price = {money(marked, symbol)}\n"
        f"Discount = {rate}%\n\n"
        f"Discount Amount = "
        f"{money(discount, symbol)}\n\n"
        f"Final Price = "
        f"{money(selling, symbol)}\n\n"
        f"Answer: Final price = "
        f"{money(selling, symbol)}"
    )


# ============================================================
# GST
# ============================================================

def gst_answer(text):

    lower = text.lower()

    if "gst" not in lower:
        return None


    # Prefer currency amounts so that a GST rate such as
    # 18% cannot be mistaken for the taxable amount.
    currency_match = re.search(
        rf"(?:₹|\$|€|£)\s*({NUMBER})",
        text,
        re.IGNORECASE
    )


    if currency_match:

        amount = clean_number(
            currency_match.group(1)
        )

    else:

        amount_match = re.search(
            rf"(?:on|of|amount|price|value|cost)"
            rf"\s*(?:is|=|:)?\s*"
            rf"({NUMBER})",
            text,
            re.IGNORECASE
        )

        if not amount_match:
            return None

        amount = clean_number(
            amount_match.group(1)
        )


    rate_match = re.search(
        PERCENT,
        text
    )


    if not rate_match:
        return None


    rate = Decimal(
        rate_match.group(1)
    )


    gst = (
        amount
        * rate
        / Decimal("100")
    )


    total = (
        amount
        + gst
    )


    symbol = detect_currency_symbol(
        text
    )


    return (
        "GST Calculation\n\n"
        f"Original Amount = {money(amount, symbol)}\n"
        f"GST Rate = {rate}%\n\n"
        f"GST Amount = "
        f"{money(gst, symbol)}\n\n"
        f"Total Amount Including GST = "
        f"{money(total, symbol)}\n\n"
        f"Answer: GST = "
        f"{money(gst, symbol)}\n"
        f"Final amount = "
        f"{money(total, symbol)}"
    )


# ============================================================
# EMI
# ============================================================

def emi_answer(text):

    lower = text.lower()

    if (
        "emi" not in lower
        and
        "monthly payment" not in lower
        and
        "loan payment" not in lower
        and
        "loan" not in lower
    ):
        return None


    # Prefer a currency-denominated loan amount.
    currency_match = re.search(
        rf"(?:₹|\$|€|£)\s*({NUMBER})",
        text,
        re.IGNORECASE
    )


    if currency_match:

        principal = float(
            clean_number(
                currency_match.group(1)
            )
        )

    else:

        principal_match = re.search(
            rf"(?:loan\s+amount|principal|borrowed\s+amount)"
            rf"\s*(?:is|=|:)?\s*"
            rf"({NUMBER})",
            text,
            re.IGNORECASE
        )


        if not principal_match:
            return None


        principal = float(
            clean_number(
                principal_match.group(1)
            )
        )


    rate_match = re.search(
        PERCENT,
        text
    )


    time = extract_time(
        text
    )


    if (
        not rate_match
        or
        time is None
    ):
        return None


    annual_rate = float(
        rate_match.group(1)
    )


    months = round(
        time * 12
    )


    if months <= 0:
        return None


    monthly_rate = (
        annual_rate
        / 12
        / 100
    )


    if monthly_rate == 0:

        emi = (
            principal
            /
            months
        )

    else:

        factor = (
            1
            +
            monthly_rate
        ) ** months

        emi = (
            principal
            * monthly_rate
            * factor
            /
            (factor - 1)
        )


    total_payment = (
        emi
        * months
    )


    total_interest = (
        total_payment
        -
        principal
    )


    symbol = detect_currency_symbol(
        text
    )


    return (
        "Loan EMI Calculation\n\n"
        f"Loan Amount = "
        f"{money(principal, symbol)}\n"
        f"Annual Interest Rate = {annual_rate}%\n"
        f"Tenure = {months} months\n\n"
        f"Monthly EMI = "
        f"{money(emi, symbol)}\n\n"
        f"Total Payment = "
        f"{money(total_payment, symbol)}\n\n"
        f"Total Interest = "
        f"{money(total_interest, symbol)}\n\n"
        f"Answer: Monthly EMI = "
        f"{money(emi, symbol)}"
    )


# ============================================================
# CAGR
# ============================================================

def cagr_answer(text):

    lower = text.lower()

    if "cagr" not in lower:
        return None


    numbers = re.findall(
        NUMBER,
        text
    )


    if len(numbers) < 3:
        return None


    initial = float(
        clean_number(
            numbers[0]
        )
    )

    final = float(
        clean_number(
            numbers[1]
        )
    )

    years = float(
        clean_number(
            numbers[2]
        )
    )


    if initial <= 0 or years <= 0:
        return None


    cagr = (
        (
            final / initial
        )
        ** (
            1 / years
        )
        - 1
    ) * 100


    return (
        "CAGR Calculation\n\n"
        f"Initial Value = {number(initial)}\n"
        f"Final Value = {number(final)}\n"
        f"Time = {number(years)} years\n\n"
        "CAGR = [(Final / Initial)^(1/n) - 1] × 100\n\n"
        f"CAGR = {number(cagr)}%\n\n"
        f"Answer: CAGR = {number(cagr)}%"
    )


# ============================================================
# DEPRECIATION
# ============================================================

def depreciation_answer(text):

    lower = text.lower()

    if "depreciation" not in lower:
        return None


    numbers = re.findall(
        NUMBER,
        text
    )


    rate_match = re.search(
        PERCENT,
        text
    )


    time = extract_time(
        text
    )


    if (
        len(numbers) < 1
        or
        not rate_match
        or
        time is None
    ):
        return None


    original = float(
        clean_number(
            numbers[0]
        )
    )


    rate = float(
        rate_match.group(1)
    )


    years = time


    book_value = (
        original
        *
        (
            1 - rate / 100
        )
        ** years
    )


    depreciation = (
        original
        -
        book_value
    )


    symbol = detect_currency_symbol(
        text
    )


    return (
        "Depreciation Calculation\n\n"
        f"Original Value = "
        f"{money(original, symbol)}\n"
        f"Depreciation Rate = {rate}% per year\n"
        f"Period = {number(years)} years\n\n"
        f"Book Value = "
        f"{money(book_value, symbol)}\n\n"
        f"Total Depreciation = "
        f"{money(depreciation, symbol)}\n\n"
        f"Answer: Book value = "
        f"{money(book_value, symbol)}"
    )


# ============================================================
# BREAK-EVEN
# ============================================================

def break_even_answer(text):

    lower = text.lower()

    if "break-even" not in lower and "break even" not in lower:
        return None


    fixed_match = re.search(
        rf"(?:fixed\s+costs?|fixed\s+cost)\s*(?:are|is|=|:)?\s*({NUMBER})",
        text,
        re.IGNORECASE
    )


    price_match = re.search(
        rf"(?:selling\s+price|price\s+per\s+unit|selling\s+price\s+per\s+unit)\s*(?:is|=|:)?\s*({NUMBER})",
        text,
        re.IGNORECASE
    )


    variable_match = re.search(
        rf"(?:variable\s+cost|variable\s+cost\s+per\s+unit)\s*(?:is|=|:)?\s*({NUMBER})",
        text,
        re.IGNORECASE
    )


    if (
        not fixed_match
        or
        not price_match
        or
        not variable_match
    ):
        return None


    fixed = float(
        clean_number(
            fixed_match.group(1)
        )
    )

    price = float(
        clean_number(
            price_match.group(1)
        )
    )

    variable = float(
        clean_number(
            variable_match.group(1)
        )
    )


    contribution = (
        price
        -
        variable
    )


    if contribution <= 0:
        return None


    units = (
        fixed
        /
        contribution
    )


    return (
        "Break-even Analysis\n\n"
        f"Fixed Costs = {number(fixed)}\n"
        f"Selling Price / Unit = {number(price)}\n"
        f"Variable Cost / Unit = {number(variable)}\n\n"
        "Contribution / Unit = Selling Price - Variable Cost\n"
        f"= {number(contribution)}\n\n"
        "Break-even Units = Fixed Costs / Contribution\n"
        f"= {number(units)} units\n\n"
        f"Answer: Break-even point = "
        f"{number(math.ceil(units))} units"
    )


# ============================================================
# AVERAGE
# ============================================================

def average_answer(text):

    if "average of" not in text.lower():
        return None


    after = re.split(
        r"average\s+of",
        text,
        flags=re.IGNORECASE
    )


    if len(after) < 2:
        return None


    numbers = re.findall(
        NUMBER,
        after[-1]
    )


    if len(numbers) < 2:
        return None


    values = [
        float(
            clean_number(
                item
            )
        )
        for item in numbers
    ]


    result = (
        sum(values)
        /
        len(values)
    )


    return (
        "Average Calculation\n\n"
        f"Values = {', '.join(number(v) for v in values)}\n"
        f"Count = {len(values)}\n\n"
        "Average = Sum / Count\n"
        f"= {number(result)}\n\n"
        f"Answer: {number(result)}"
    )


# ============================================================
# RATIO
# ============================================================

def ratio_answer(text):

    match = re.search(
        rf"ratio.*?({NUMBER})\s*[:/]\s*({NUMBER})",
        text,
        re.IGNORECASE
    )


    if not match:
        return None


    a = int(
        clean_number(
            match.group(1)
        )
    )

    b = int(
        clean_number(
            match.group(2)
        )
    )


    gcd = math.gcd(
        a,
        b
    )


    result_a = a // gcd
    result_b = b // gcd


    return (
        "Ratio Calculation\n\n"
        f"Original Ratio = {a}:{b}\n"
        f"GCD = {gcd}\n\n"
        f"Simplified Ratio = "
        f"{result_a}:{result_b}\n\n"
        f"Answer: {result_a}:{result_b}"
    )


# ============================================================
# SPEED / DISTANCE / TIME
# ============================================================

def speed_distance_time_answer(text):

    lower = text.lower()

    if not any(
        phrase in lower
        for phrase in [
            "speed",
            "average speed",
            "distance",
            "travels",
            "travel",
        ]
    ):
        return None


    # --------------------------------------------------------
    # Natural sentence:
    # "A train travels 360 km in 4.5 hours"
    # --------------------------------------------------------

    natural_match = re.search(
        rf"(?:travels?|covers?|goes?)\s+({NUMBER})\s*"
        rf"(km|kilometers?|m|meters?)\s+in\s+"
        rf"({NUMBER})\s*"
        rf"(hours?|hrs?|minutes?|mins?|seconds?|sec)",
        text,
        re.IGNORECASE
    )


    # --------------------------------------------------------
    # Explicit:
    # "distance 360 km ... time 4.5 hours"
    # --------------------------------------------------------

    distance_match = re.search(
        rf"(?:distance)\s*(?:is|=|:)?\s*({NUMBER})\s*"
        rf"(km|kilometers?|m|meters?)",
        text,
        re.IGNORECASE
    )


    time_match = re.search(
        rf"(?:time)\s*(?:is|=|:)?\s*({NUMBER})\s*"
        rf"(hours?|hrs?|minutes?|mins?|seconds?|sec)",
        text,
        re.IGNORECASE
    )


    if natural_match:

        distance = float(
            clean_number(
                natural_match.group(1)
            )
        )

        distance_unit = (
            natural_match.group(2).lower()
        )

        time_value = float(
            clean_number(
                natural_match.group(3)
            )
        )

        time_unit = (
            natural_match.group(4).lower()
        )

    elif distance_match and time_match:

        distance = float(
            clean_number(
                distance_match.group(1)
            )
        )

        distance_unit = (
            distance_match.group(2).lower()
        )

        time_value = float(
            clean_number(
                time_match.group(1)
            )
        )

        time_unit = (
            time_match.group(2).lower()
        )

    else:

        return None


    # --------------------------------------------------------
    # Distance → kilometres
    # --------------------------------------------------------

    if distance_unit.startswith("m"):

        distance_km = (
            distance / 1000.0
        )

    else:

        distance_km = distance


    # --------------------------------------------------------
    # Time → hours
    # --------------------------------------------------------

    if time_unit.startswith("min"):

        hours = (
            time_value / 60.0
        )

    elif time_unit.startswith("sec"):

        hours = (
            time_value / 3600.0
        )

    else:

        hours = time_value


    if hours <= 0:

        return None


    speed = (
        distance_km / hours
    )


    return (
        "Speed Calculation\n\n"
        f"Distance = {number(distance_km)} km\n"
        f"Time = {number(hours)} hours\n\n"
        "Speed = Distance / Time\n"
        f"= {number(distance_km)} / {number(hours)}\n"
        f"= {number(speed)} km/h\n\n"
        f"Answer: {number(speed)} km/h"
    )


# ============================================================
# PHYSICS
# ============================================================

def physics_answer(text):

    lower = text.lower()


    # --------------------------------------------------------
    # FORCE
    # --------------------------------------------------------

    if "force" in lower:

        mass_match = re.search(
            rf"mass\s*(?:is|=|:)?\s*({NUMBER})\s*kg",
            text,
            re.IGNORECASE
        )


        acceleration_match = re.search(
            rf"acceleration\s*(?:is|=|:)?\s*({NUMBER})\s*"
            rf"(?:m/s2|m/s\^2|m/s²)?",
            text,
            re.IGNORECASE
        )


        if (
            mass_match
            and
            acceleration_match
        ):

            mass = float(
                clean_number(
                    mass_match.group(1)
                )
            )


            acceleration = float(
                clean_number(
                    acceleration_match.group(1)
                )
            )


            result = (
                mass
                *
                acceleration
            )


            return (
                "Force Calculation\n\n"
                f"Mass = {number(mass)} kg\n"
                f"Acceleration = {number(acceleration)} m/s²\n\n"
                "F = m × a\n"
                f"= {number(mass)} × {number(acceleration)}\n"
                f"= {number(result)} N\n\n"
                f"Answer: {number(result)} N"
            )


    # --------------------------------------------------------
    # KINETIC ENERGY
    # --------------------------------------------------------

    if (
        "kinetic energy" in lower
        or
        "kinetic" in lower
    ):

        mass_match = re.search(
            rf"mass\s*(?:is|=|:)?\s*({NUMBER})\s*kg",
            text,
            re.IGNORECASE
        )


        velocity_match = re.search(
            rf"(?:velocity|speed)\s*(?:is|=|:)?\s*"
            rf"({NUMBER})\s*(?:m/s|mps)?",
            text,
            re.IGNORECASE
        )


        if (
            mass_match
            and
            velocity_match
        ):

            mass = float(
                clean_number(
                    mass_match.group(1)
                )
            )


            velocity = float(
                clean_number(
                    velocity_match.group(1)
                )
            )


            energy = (
                0.5
                *
                mass
                *
                velocity
                *
                velocity
            )


            return (
                "Kinetic Energy\n\n"
                f"Mass = {number(mass)} kg\n"
                f"Velocity = {number(velocity)} m/s\n\n"
                "KE = ½mv²\n"
                f"= {number(energy)} J\n\n"
                f"Answer: {number(energy)} J"
            )


    # --------------------------------------------------------
    # POTENTIAL ENERGY
    # --------------------------------------------------------

    if (
        "potential energy" in lower
        or
        "gravitational potential" in lower
    ):

        mass_match = re.search(
            rf"mass\s*(?:is|=|:)?\s*({NUMBER})\s*kg",
            text,
            re.IGNORECASE
        )


        height_match = re.search(
            rf"(?:height|h)\s*(?:is|=|:)?\s*"
            rf"({NUMBER})\s*m\b",
            text,
            re.IGNORECASE
        )


        # Only use a gravity value when gravity is explicitly
        # mentioned. Otherwise use standard Earth gravity.
        gravity_match = re.search(
            rf"(?:gravity|acceleration\s+due\s+to\s+gravity)"
            rf"\s*(?:is|=|:)?\s*"
            rf"({NUMBER})\s*(?:m/s2|m/s\^2|m/s²)?",
            text,
            re.IGNORECASE
        )


        if (
            mass_match
            and
            height_match
        ):

            mass = float(
                clean_number(
                    mass_match.group(1)
                )
            )


            height = float(
                clean_number(
                    height_match.group(1)
                )
            )


            if gravity_match:

                gravity = float(
                    clean_number(
                        gravity_match.group(1)
                    )
                )

            else:

                gravity = 9.81


            energy = (
                mass
                *
                gravity
                *
                height
            )


            return (
                "Gravitational Potential Energy\n\n"
                f"Mass = {number(mass)} kg\n"
                f"Gravity = {number(gravity)} m/s²\n"
                f"Height = {number(height)} m\n\n"
                "PE = mgh\n"
                f"= {number(energy)} J\n\n"
                f"Answer: {number(energy)} J"
            )


    # --------------------------------------------------------
    # OHM'S LAW
    # --------------------------------------------------------

    if (
        "ohm" in lower
        or
        "resistance" in lower
    ):

        voltage_match = re.search(
            rf"voltage\s*(?:is|=|:)?\s*"
            rf"({NUMBER})\s*V",
            text,
            re.IGNORECASE
        )


        current_match = re.search(
            rf"current\s*(?:is|=|:)?\s*"
            rf"({NUMBER})\s*A",
            text,
            re.IGNORECASE
        )


        resistance_match = re.search(
            rf"resistance\s*(?:is|=|:)?\s*"
            rf"({NUMBER})\s*Ω?",
            text,
            re.IGNORECASE
        )


        if (
            voltage_match
            and
            current_match
            and
            not resistance_match
        ):

            voltage = float(
                clean_number(
                    voltage_match.group(1)
                )
            )


            current = float(
                clean_number(
                    current_match.group(1)
                )
            )


            if current == 0:

                return None


            resistance = (
                voltage / current
            )


            return (
                "Ohm's Law\n\n"
                f"Voltage = {number(voltage)} V\n"
                f"Current = {number(current)} A\n\n"
                "R = V / I\n"
                f"= {number(voltage)} / {number(current)}\n"
                f"= {number(resistance)} Ω\n\n"
                f"Answer: {number(resistance)} Ω"
            )


    return None


# ============================================================
# SAFE SYMPY PARSING
# ============================================================

SYMBOLS = {
    name: sp.Symbol(name)
    for name in [
        "x",
        "y",
        "z",
        "t",
    ]
}


SYMPY_NAMES = {

    **SYMBOLS,

    "sin":
        sp.sin,

    "cos":
        sp.cos,

    "tan":
        sp.tan,

    "sqrt":
        sp.sqrt,

    "log":
        sp.log,

    "ln":
        sp.log,

    "exp":
        sp.exp,

    "pi":
        sp.pi,

    "E":
        sp.E,

}


ALLOWED_IDENTIFIERS = set(
    SYMPY_NAMES.keys()
)


def safe_sympy(expression):

    expression = (
        expression
        .replace("^", "**")
        .replace("×", "*")
        .strip()
    )


    if len(expression) > 250:
        raise ValueError(
            "Expression is too long."
        )


    if "__" in expression:
        raise ValueError(
            "Invalid expression."
        )


    if re.search(
        r"[^0-9A-Za-z_+\-*/().,= ]",
        expression
    ):
        raise ValueError(
            "Expression contains unsupported characters."
        )


    identifiers = re.findall(
        r"[A-Za-z_]\w*",
        expression
    )


    for identifier in identifiers:

        if identifier not in ALLOWED_IDENTIFIERS:

            raise ValueError(
                "Unsupported identifier: "
                + identifier
            )


    return sp.sympify(
        expression,
        locals=SYMPY_NAMES
    )


# ============================================================
# EQUATION SOLVING
# ============================================================

def equation_answer(text):

    lower = text.lower()


    if not (
        "solve" in lower
        and "=" in text
    ):
        return None


    equation_match = re.search(
        r"solve\s+(.*)",
        text,
        re.IGNORECASE
    )


    if not equation_match:
        return None


    equation = (
        equation_match.group(1)
        .strip()
    )


    if " for " in equation.lower():

        equation = re.split(
            r"\s+for\s+",
            equation,
            flags=re.IGNORECASE
        )[0]


    if "=" not in equation:
        return None


    left_text, right_text = equation.split(
        "=",
        1
    )


    try:

        left = safe_sympy(
            left_text
        )

        right = safe_sympy(
            right_text
        )


        variables = sorted(
            (
                left.free_symbols
                |
                right.free_symbols
            ),
            key=lambda item: item.name
        )


        if not variables:
            return None


        variable = variables[0]


        solutions = sp.solve(
            sp.Eq(
                left,
                right
            ),
            variable
        )


        if not solutions:

            return (
                "Equation Solving\n\n"
                f"Equation: {left} = {right}\n\n"
                "Answer: No solution found."
            )


        solution_text = ", ".join(
            str(solution)
            for solution in solutions
        )


        return (
            "Equation Solving\n\n"
            f"Equation: {left} = {right}\n\n"
            f"Solving for {variable}:\n"
            f"{variable} = {solution_text}\n\n"
            f"Answer: {variable} = {solution_text}"
        )


    except Exception:

        return None


# ============================================================
# DERIVATIVE
# ============================================================

def derivative_answer(text):

    lower = text.lower()


    if (
        "derivative" not in lower
        and
        "differentiate" not in lower
    ):

        return None


    # --------------------------------------------------------
    # Extract expression after "of" or "differentiate".
    # --------------------------------------------------------

    match = re.search(
        r"(?:derivative\s+of|differentiate)\s+(.+)",
        text,
        re.IGNORECASE
    )


    if not match:

        return None


    expression_text = (
        match.group(1)
        .strip()
    )


    # Remove optional trailing punctuation.
    expression_text = (
        expression_text
        .rstrip(" \t\r\n.!?;:")
    )


    # --------------------------------------------------------
    # Optional variable
    # --------------------------------------------------------

    variable_match = re.search(
        r"\b(?:with\s+respect\s+to|wrt)\s+"
        r"(x|y|z|t)\b",
        expression_text,
        re.IGNORECASE
    )


    if variable_match:

        variable_name = (
            variable_match.group(1)
            .lower()
        )


        expression_text = re.sub(
            r"\s+(?:with\s+respect\s+to|wrt)\s+"
            r"(?:x|y|z|t)\b",
            "",
            expression_text,
            flags=re.IGNORECASE
        )

    else:

        variable_name = "x"


    # Remove whitespace around expression.
    expression_text = (
        expression_text
        .strip()
    )


    if not expression_text:

        return None


    try:

        expression = safe_sympy(
            expression_text
        )


        variable = SYMBOLS.get(
            variable_name,
            SYMBOLS["x"]
        )


        result = sp.diff(
            expression,
            variable
        )


        return (
            "Derivative\n\n"
            f"Function = {expression}\n"
            f"Variable = {variable}\n\n"
            f"d/d{variable} = {result}\n\n"
            f"Answer: {result}"
        )


    except Exception:

        return None


# ============================================================
# INTEGRAL
# ============================================================

def integral_answer(text):

    lower = text.lower()


    if (
        "integral" not in lower
        and
        "integrate" not in lower
    ):

        return None


    # --------------------------------------------------------
    # Extract expression.
    # --------------------------------------------------------

    match = re.search(
        r"(?:integral\s+of|integrate)\s+(.+)",
        text,
        re.IGNORECASE
    )


    if not match:

        return None


    expression_text = (
        match.group(1)
        .strip()
    )


    # Remove trailing punctuation.
    expression_text = (
        expression_text
        .rstrip(" \t\r\n.!?;:")
    )


    # --------------------------------------------------------
    # Optional variable
    # --------------------------------------------------------

    variable_match = re.search(
        r"\b(?:with\s+respect\s+to|wrt)\s+"
        r"(x|y|z|t)\b",
        expression_text,
        re.IGNORECASE
    )


    if variable_match:

        variable_name = (
            variable_match.group(1)
            .lower()
        )


        expression_text = re.sub(
            r"\s+(?:with\s+respect\s+to|wrt)\s+"
            r"(?:x|y|z|t)\b",
            "",
            expression_text,
            flags=re.IGNORECASE
        )

    else:

        variable_name = "x"


    expression_text = (
        expression_text
        .strip()
    )


    if not expression_text:

        return None


    try:

        expression = safe_sympy(
            expression_text
        )


        variable = SYMBOLS.get(
            variable_name,
            SYMBOLS["x"]
        )


        result = sp.integrate(
            expression,
            variable
        )


        return (
            "Integral\n\n"
            f"Function = {expression}\n"
            f"Variable = {variable}\n\n"
            f"∫ {expression} d{variable}\n"
            f"= {result} + C\n\n"
            f"Answer: {result} + C"
        )


    except Exception:

        return None


# ============================================================
# BASIC ARITHMETIC
# ============================================================

def arithmetic_answer(text):

    cleaned = text.strip()


    # Remove common natural-language prefixes
    cleaned = re.sub(
        r"^(calculate|compute|solve|what\s+is|find)\s+",
        "",
        cleaned,
        flags=re.IGNORECASE
    )


    # Convert common symbols
    cleaned = (
        cleaned
        .replace("×", "*")
        .replace("÷", "/")
        .replace("^", "**")
    )


    # Only attempt if the expression looks mathematical.
    if not re.search(
        r"\d.*[\+\-\*/\^]",
        cleaned
    ):
        return None


    try:

        result = safe_math_eval(
            cleaned
        )


        return (
            "Calculation\n\n"
            f"{cleaned}\n"
            f"= {number(result)}\n\n"
            f"Answer: {number(result)}"
        )


    except Exception:

        return None


# ============================================================
# MAIN DETECTOR
# ============================================================

CALCULATORS = [

    compound_interest_answer,
    simple_interest_answer,
    emi_answer,
    gst_answer,
    profit_loss_answer,
    discount_answer,
    cagr_answer,
    depreciation_answer,
    break_even_answer,
    percentage_answer,
    ratio_answer,
    average_answer,
    speed_distance_time_answer,
    physics_answer,
    equation_answer,
    derivative_answer,
    integral_answer,
    arithmetic_answer,

]


def solve_math_query(query):

    question = extract_current_question(
        query
    )


    if not question:
        return None


    # --------------------------------------------------------
    # Prevent ordinary questions from being treated
    # as calculations.
    # --------------------------------------------------------

    lower = question.lower()


    math_signal = any(
        signal in lower
        for signal in [
            "calculate",
            "compute",
            "solve",
            "what is",
            "how much",
            "how many",
            "interest",
            "profit",
            "loss",
            "discount",
            "gst",
            "emi",
            "cagr",
            "depreciation",
            "break-even",
            "break even",
            "percentage",
            "ratio",
            "average",
            "speed",
            "distance",
            "force",
            "energy",
            "voltage",
            "current",
            "resistance",
            "derivative",
            "differentiate",
            "integral",
            "integrate",
        ]
    )


    if not math_signal:
        return None


    for calculator in CALCULATORS:

        try:

            result = calculator(
                question
            )

            if result:
                return result

        except Exception:

            continue


    return None
