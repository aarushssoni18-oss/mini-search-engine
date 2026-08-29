
# ============================================================
# MINI SEARCH AI — FREIGHT & SHIPPING ENGINE
# ============================================================

import math
import re
from decimal import Decimal, ROUND_HALF_UP


MONEY_QUANT = Decimal("0.01")


# ============================================================
# BASIC HELPERS
# ============================================================

def money(value, symbol=""):
    value = Decimal(
        str(value)
    ).quantize(
        MONEY_QUANT,
        rounding=ROUND_HALF_UP
    )

    return f"{symbol}{value:,.2f}"


def number(value):
    value = float(value)

    if abs(value - round(value)) < 1e-9:
        return f"{int(round(value)):,}"

    return (
        f"{value:,.6f}"
        .rstrip("0")
        .rstrip(".")
    )


def clean_number(value):
    return float(
        str(value)
        .replace(",", "")
        .strip()
    )


def currency_symbol(text):
    lower = text.lower()

    if (
        "₹" in text
        or "inr" in lower
        or "rupee" in lower
        or "rupees" in lower
    ):
        return "₹"

    if (
        "$" in text
        or "usd" in lower
        or "dollar" in lower
        or "dollars" in lower
    ):
        return "$"

    if (
        "€" in text
        or "eur" in lower
        or "euro" in lower
        or "euros" in lower
    ):
        return "€"

    if (
        "£" in text
        or "gbp" in lower
        or "pound" in lower
        or "pounds" in lower
    ):
        return "£"

    return ""



def extract_current_question(query):

    text = str(
        query or ""
    )

    marker = "current user question:"

    position = text.lower().rfind(
        marker
    )

    if position >= 0:

        return text[
            position + len(marker):
        ].strip()

    return text.strip()


# ============================================================
# PACKAGE QUANTITY
# ============================================================

def extract_quantity(text):

    match = re.search(
        r"(\d+(?:\.\d+)?)\s*"
        r"(?:cartons?|boxes?|crates?|pallets?|"
        r"pieces?|pcs|packages?)",
        text,
        re.IGNORECASE
    )

    if match:
        return int(
            float(
                match.group(1)
            )
        )

    return 1


# ============================================================
# DIMENSIONS
# ============================================================

def extract_dimensions(text):

    pattern = (
        r"(\d+(?:\.\d+)?)\s*"
        r"[x×]\s*"
        r"(\d+(?:\.\d+)?)\s*"
        r"[x×]\s*"
        r"(\d+(?:\.\d+)?)"
        r"\s*(cm|mm|m|ft|in)?"
    )

    match = re.search(
        pattern,
        text,
        re.IGNORECASE
    )

    if not match:
        return None


    length = clean_number(
        match.group(1)
    )

    width = clean_number(
        match.group(2)
    )

    height = clean_number(
        match.group(3)
    )

    unit = (
        match.group(4)
        or "cm"
    ).lower()


    if unit == "mm":
        factor = 0.001

    elif unit == "cm":
        factor = 0.01

    elif unit == "m":
        factor = 1.0

    elif unit == "ft":
        factor = 0.3048

    elif unit == "in":
        factor = 0.0254

    else:
        factor = 0.01


    return (
        length * factor,
        width * factor,
        height * factor
    )


# ============================================================
# CBM
# ============================================================

def extract_cbm(text):

    match = re.search(
        r"(\d+(?:\.\d+)?)\s*"
        r"(?:cbm|m3|m³|cubic\s+met(?:er|re)s?)",
        text,
        re.IGNORECASE
    )

    if match:
        return clean_number(
            match.group(1)
        )

    return None


def cbm_answer(text):

    dimensions = extract_dimensions(
        text
    )

    if dimensions:

        length, width, height = dimensions

        quantity = extract_quantity(
            text
        )

        cbm_per_package = (
            length
            * width
            * height
        )

        total_cbm = (
            cbm_per_package
            * quantity
        )

        return (
            "Freight Volume (CBM)\n\n"
            f"Packages = {number(quantity)}\n"
            f"Dimensions = "
            f"{number(length)} × "
            f"{number(width)} × "
            f"{number(height)} m\n\n"
            f"CBM per package = "
            f"{number(cbm_per_package)} CBM\n\n"
            f"Total CBM = "
            f"{number(cbm_per_package)} × "
            f"{number(quantity)}\n"
            f"= {number(total_cbm)} CBM\n\n"
            f"Answer: {number(total_cbm)} CBM"
        )


    explicit = extract_cbm(
        text
    )

    if explicit is not None:

        return (
            "Freight Volume (CBM)\n\n"
            f"Shipment Volume = "
            f"{number(explicit)} CBM\n\n"
            f"Answer: {number(explicit)} CBM"
        )


    return None


# ============================================================
# WEIGHT
# ============================================================

def extract_weight(text):

    patterns = [

        r"(?:total|gross|actual)\s+weight"
        r"\s*(?:is|=|:)?\s*"
        r"(\d+(?:,\d{3})*(?:\.\d+)?)\s*kg",

        r"weight"
        r"\s*(?:is|=|:)?\s*"
        r"(\d+(?:,\d{3})*(?:\.\d+)?)\s*kg",

        r"weighing"
        r"\s*(?:about|approximately|around)?\s*"
        r"(\d+(?:,\d{3})*(?:\.\d+)?)\s*kg"

    ]


    for pattern in patterns:

        match = re.search(
            pattern,
            text,
            re.IGNORECASE
        )

        if not match:
            continue


        value = clean_number(
            match.group(1)
        )


        nearby = text[
            max(
                0,
                match.start() - 25
            ):
            min(
                len(text),
                match.end() + 25
            )
        ].lower()


        if "each" in nearby:

            quantity = extract_quantity(
                text
            )

            return (
                value * quantity,
                value
            )


        return (
            value,
            value
        )


    return (
        None,
        None
    )


# ============================================================
# DIMENSIONAL DIVISOR
# ============================================================

def extract_dim_factor(text):

    match = re.search(
        r"(?:divisor|dimensional\s+factor|"
        r"dimensional\s+weight\s+factor|factor)"
        r"\s*(?:is|=|:)?\s*"
        r"(\d+(?:\.\d+)?)",
        text,
        re.IGNORECASE
    )

    if match:

        return float(
            match.group(1)
        )


    match = re.search(
        r"(\d+(?:\.\d+)?)\s*"
        r"(?:cm3|cm³)\s*/\s*kg",
        text,
        re.IGNORECASE
    )

    if match:

        return float(
            match.group(1)
        )


    return None


# ============================================================
# RATE
# ============================================================

def extract_rate(text, basis):

    basis_pattern = re.escape(
        basis
    )


    pattern = (
        r"(?:rate|price|freight)"
        r"\s*(?:is|=|:)?\s*"
        r"(?:₹|\$|€|£)?\s*"
        r"(\d+(?:,\d{3})*(?:\.\d+)?)"
        r"\s*(?:usd|inr|eur|gbp)?"
        r"\s*(?:per|/)\s*"
        + basis_pattern
    )


    match = re.search(
        pattern,
        text,
        re.IGNORECASE
    )


    if match:

        return clean_number(
            match.group(1)
        )


    # Also support:
    # "$90 per CBM"
    pattern = (
        r"(?:₹|\$|€|£)?\s*"
        r"(\d+(?:,\d{3})*(?:\.\d+)?)"
        r"\s*(?:usd|inr|eur|gbp)?"
        r"\s*(?:per|/)\s*"
        + basis_pattern
    )


    match = re.search(
        pattern,
        text,
        re.IGNORECASE
    )


    if match:

        return clean_number(
            match.group(1)
        )


    return None


# ============================================================
# AIR FREIGHT — CHARGEABLE WEIGHT
# ============================================================

def air_chargeable_weight_answer(text):

    lower = text.lower()


    if not any(
        term in lower
        for term in [
            "air freight",
            "airfreight",
            "air cargo",
            "air shipment"
        ]
    ):

        return None


    dimensions = extract_dimensions(
        text
    )


    total_weight, _ = extract_weight(
        text
    )


    if (
        not dimensions
        or
        total_weight is None
    ):

        return None


    length, width, height = dimensions


    quantity = extract_quantity(
        text
    )


    total_cbm = (
        length
        * width
        * height
        * quantity
    )


    divisor = extract_dim_factor(
        text
    )


    # Common air-freight planning divisor.
    # Carrier/service rules may differ.
    if divisor is None:

        divisor = 6000


    volume_cm3 = (
        total_cbm
        * 1_000_000
    )


    volumetric_weight = (
        volume_cm3
        /
        divisor
    )


    chargeable_weight = max(
        total_weight,
        volumetric_weight
    )


    basis = (
        "actual weight"
        if total_weight >= volumetric_weight
        else "volumetric weight"
    )


    result = (
        "Air Freight Chargeable Weight\n\n"
        f"Packages = {number(quantity)}\n"
        f"Total CBM = {number(total_cbm)} CBM\n"
        f"Actual Weight = {number(total_weight)} kg\n"
        f"Dimensional Factor = "
        f"{number(divisor)} cm³/kg\n\n"
        f"Volumetric Weight = "
        f"{number(volume_cm3)} ÷ "
        f"{number(divisor)}\n"
        f"= {number(volumetric_weight)} kg\n\n"
        f"Chargeable Weight = higher of "
        f"actual and volumetric weight\n"
        f"= {number(chargeable_weight)} kg\n\n"
        f"Pricing basis = {basis}"
    )


    rate = extract_rate(
        text,
        "kg"
    )


    if rate is not None:

        symbol = currency_symbol(
            text
        )

        cost = (
            chargeable_weight
            * rate
        )

        result += (
            "\n\n"
            f"Rate = {money(rate, symbol)} / kg\n"
            f"Estimated Freight = "
            f"{money(cost, symbol)}"
        )


    result += (
        "\n\n"
        "Note: Verify the applicable carrier "
        "divisor, rounding and tariff."
    )


    return result


# ============================================================
# LCL OCEAN FREIGHT
# ============================================================

def lcl_answer(text):

    lower = text.lower()


    if not any(
        term in lower
        for term in [
            "lcl",
            "less than container load",
            "less-than-container-load"
        ]
    ):

        return None


    # --------------------------------------------------------
    # VOLUME
    # --------------------------------------------------------

    cbm = extract_cbm(
        text
    )


    if cbm is None:

        dimensions = extract_dimensions(
            text
        )

        if dimensions:

            length, width, height = dimensions

            quantity = extract_quantity(
                text
            )

            cbm = (
                length
                * width
                * height
                * quantity
            )


    # --------------------------------------------------------
    # WEIGHT
    #
    # Important:
    # LCL questions commonly use natural wording such as:
    #
    # "15 CBM and 8000 kg"
    #
    # The generic extract_weight() expects "weight 8000 kg",
    # so we explicitly support a standalone kg value here.
    # --------------------------------------------------------

    total_weight, _ = extract_weight(
        text
    )


    if total_weight is None:

        standalone_weight = re.search(
            r"(\d+(?:,\d{3})*(?:\.\d+)?)\s*kg\b",
            text,
            re.IGNORECASE
        )


        if standalone_weight:

            total_weight = clean_number(
                standalone_weight.group(1)
            )


    if (
        cbm is None
        or
        total_weight is None
    ):

        return None


    # --------------------------------------------------------
    # W/M
    #
    # Common planning convention:
    # 1 CBM = 1 W/M
    # 1000 kg = 1 W/M
    #
    # Actual carrier/forwarder rules can differ.
    # --------------------------------------------------------

    weight_wm = (
        total_weight
        / 1000.0
    )


    chargeable_wm = max(
        cbm,
        weight_wm
    )


    basis = (
        "volume"
        if cbm >= weight_wm
        else "weight"
    )


    # --------------------------------------------------------
    # FREIGHT RATE
    # --------------------------------------------------------

    rate = (
        extract_rate(
            text,
            "cbm"
        )
        or
        extract_rate(
            text,
            "W/M"
        )
        or
        extract_rate(
            text,
            "WM"
        )
    )


    result = (
        "LCL Ocean Freight\n\n"
        f"Volume = {number(cbm)} CBM\n"
        f"Actual Weight = {number(total_weight)} kg\n"
        f"Weight equivalent = "
        f"{number(weight_wm)} W/M\n\n"
        "Chargeable W/M = higher of "
        "volume and weight equivalent\n"
        f"= {number(chargeable_wm)} W/M\n\n"
        f"Pricing basis = {basis}"
    )


    if rate is not None:

        symbol = currency_symbol(
            text
        )


        cost = (
            chargeable_wm
            * rate
        )


        result += (
            "\n\n"
            f"Rate = {money(rate, symbol)} / W/M\n"
            f"Estimated Freight = "
            f"{money(cost, symbol)}"
        )


    result += (
        "\n\n"
        "Note: Verify the applicable "
        "forwarder/carrier W/M rule, "
        "minimum charge and tariff."
    )


    return result


# ============================================================
# CONTAINER PLANNING
# ============================================================

CONTAINER_DATA = {

    "20ft": {
        "name": "20' Standard Dry",
        "cbm": 33.2,
        "payload_kg": 28300
    },

    "40ft": {
        "name": "40' Standard Dry",
        "cbm": 67.7,
        "payload_kg": 28870
    },

    "40hc": {
        "name": "40' High Cube Dry",
        "cbm": 76.4,
        "payload_kg": 28690
    },

    "45hc": {
        "name": "45' High Cube Dry",
        "cbm": 86.0,
        "payload_kg": 27650
    }

}


def detect_container(text):

    lower = text.lower()


    if (
        "40 high cube" in lower
        or
        "40hc" in lower
        or
        "40 hc" in lower
        or
        "40' high cube" in lower
    ):

        return "40hc"


    if (
        "45 high cube" in lower
        or
        "45hc" in lower
        or
        "45 hc" in lower
        or
        "45' high cube" in lower
    ):

        return "45hc"


    if (
        "40ft" in lower
        or
        "40 ft" in lower
        or
        "40-foot" in lower
        or
        "40 foot" in lower
        or
        "40'" in lower
    ):

        return "40ft"


    if (
        "20ft" in lower
        or
        "20 ft" in lower
        or
        "20-foot" in lower
        or
        "20 foot" in lower
        or
        "20'" in lower
    ):

        return "20ft"


    return None


def container_answer(text):

    container = detect_container(
        text
    )


    if container is None:

        return None


    cbm = extract_cbm(
        text
    )


    total_weight, _ = extract_weight(
        text
    )


    # Allow standalone "60 CBM"
    # and "50000 kg".
    if total_weight is None:

        standalone_weight = re.search(
            r"(\d+(?:,\d{3})*(?:\.\d+)?)\s*kg\b",
            text,
            re.IGNORECASE
        )

        if standalone_weight:

            total_weight = clean_number(
                standalone_weight.group(1)
            )


    if (
        cbm is None
        and
        total_weight is None
    ):

        return None


    data = CONTAINER_DATA[
        container
    ]


    by_volume = (
        math.ceil(
            cbm / data["cbm"]
        )
        if cbm is not None
        else 0
    )


    by_weight = (
        math.ceil(
            total_weight
            /
            data["payload_kg"]
        )
        if total_weight is not None
        else 0
    )


    containers = max(
        by_volume,
        by_weight,
        1
    )


    result = (
        "Container Planning\n\n"
        f"Container = {data['name']}\n"
        f"Reference volume capacity = "
        f"{number(data['cbm'])} CBM\n"
        f"Reference payload = "
        f"{number(data['payload_kg'])} kg\n\n"
    )


    if cbm is not None:

        result += (
            f"Shipment Volume = "
            f"{number(cbm)} CBM\n"
            f"Containers by volume = "
            f"{number(by_volume)}\n\n"
        )


    if total_weight is not None:

        result += (
            f"Shipment Weight = "
            f"{number(total_weight)} kg\n"
            f"Containers by payload = "
            f"{number(by_weight)}\n\n"
        )


    result += (
        f"Planning Estimate = "
        f"{number(containers)} container(s)\n\n"
        "Note: actual loadability depends on "
        "cargo dimensions, stowage, packaging, "
        "container specifications and local limits."
    )


    return result


# ============================================================
# OCEAN FREIGHT COST
# ============================================================

def ocean_cost_answer(text):

    lower = text.lower()


    if not any(
        term in lower
        for term in [
            "ocean freight",
            "sea freight",
            "ocean shipping",
            "sea shipping"
        ]
    ):

        return None


    cbm = extract_cbm(
        text
    )


    if cbm is None:

        dimensions = extract_dimensions(
            text
        )

        if dimensions:

            length, width, height = dimensions

            quantity = extract_quantity(
                text
            )

            cbm = (
                length
                * width
                * height
                * quantity
            )


    if cbm is None:

        return None


    rate = extract_rate(
        text,
        "cbm"
    )


    if rate is None:

        return None


    symbol = currency_symbol(
        text
    )


    cost = (
        cbm
        * rate
    )


    return (
        "Ocean Freight Cost\n\n"
        f"Volume = {number(cbm)} CBM\n"
        f"Rate = {money(rate, symbol)} / CBM\n\n"
        "Freight Cost = Volume × Rate\n"
        f"= {number(cbm)} × "
        f"{money(rate, symbol)}\n"
        f"= {money(cost, symbol)}\n\n"
        f"Answer: Estimated ocean freight = "
        f"{money(cost, symbol)}"
    )


# ============================================================
# MASTER FREIGHT DETECTOR
# ============================================================

def solve_freight_query(query):

    # IMPORTANT:
    # The AI Chat sends previous conversation messages
    # together with the current question.
    #
    # We must calculate only the CURRENT user question.
    text = extract_current_question(
        query
    )


    if not text:

        return None


    lower = text.lower()


    signals = [

        "freight",
        "shipping",
        "shipment",
        "cargo",
        "cbm",
        "container",
        "carton",
        "cartons",
        "pallet",
        "pallets",
        "chargeable weight",
        "volumetric weight",
        "dimensional weight",
        "lcl",
        "air cargo",
        "air freight",
        "ocean freight",
        "sea freight"

    ]


    if not any(
        signal in lower
        for signal in signals
    ):

        return None


    # LCL must be evaluated before generic CBM.
    calculators = [

        air_chargeable_weight_answer,

        lcl_answer,

        container_answer,

        ocean_cost_answer,

        cbm_answer

    ]


    for calculator in calculators:

        try:

            result = calculator(
                text
            )

            if result:

                return result

        except Exception:

            continue


    return None
