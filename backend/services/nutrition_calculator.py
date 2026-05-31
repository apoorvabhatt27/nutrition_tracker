from typing import Literal


def calculate_targets(
    age: int,
    sex: Literal["male", "female"],
    height_cm: float,
    weight_kg: float,           # current weight
    target_weight_kg: float,
    target_duration_weeks: int,
    activity_level: float,
    is_vegetarian: bool = False,
    diabetes: bool = False,
    pcos: bool = False,
) -> dict:
    warnings: list[str] = []

    # ── Step 1: BMR (Mifflin-St Jeor) ─────────────────────────
    if sex == "male":
        bmr = 10 * weight_kg + 6.25 * height_cm - 5 * age + 5
    else:
        bmr = 10 * weight_kg + 6.25 * height_cm - 5 * age - 161

    # ── Step 2: TDEE ──────────────────────────────────────────
    tdee = bmr * activity_level

    # ── Step 3: Weight change rate ────────────────────────────
    weight_change_kg = target_weight_kg - weight_kg
    weekly_change_kg = abs(weight_change_kg) / target_duration_weeks

    # ── Step 4: Safety validation ─────────────────────────────
    if target_weight_kg < weight_kg:
        if weekly_change_kg > weight_kg * 0.01:
            warnings.append(
                "Your target weight loss rate may be too aggressive and difficult to sustain."
            )
    elif target_weight_kg > weight_kg:
        if weekly_change_kg > weight_kg * 0.005:
            warnings.append(
                "Your target weight gain rate may lead to excessive fat gain."
            )

    # ── Step 5: Daily calorie adjustment ─────────────────────
    daily_calorie_adjustment = (weight_change_kg * 7700) / (target_duration_weeks * 7)

    # ── Step 6: Target calories ───────────────────────────────
    raw_calories = tdee + daily_calorie_adjustment
    min_calories = 1200 if sex == "female" else 1500
    if raw_calories < min_calories:
        raw_calories = min_calories
        warnings.append(
            "Calorie target was increased to the minimum recommended level."
        )
    calories = round(raw_calories / 25) * 25

    # Derive direction for subsequent steps
    if weight_change_kg < -0.1:
        direction = "losing"
    elif weight_change_kg > 0.1:
        direction = "gaining"
    else:
        direction = "maintaining"

    # ── Step 7: Protein ───────────────────────────────────────
    if direction == "losing":
        protein_g = 2.0 * weight_kg
    elif direction == "maintaining":
        protein_g = 1.6 * weight_kg
    else:  # gaining
        protein_g = 1.8 * weight_kg

    if is_vegetarian:
        protein_g = max(protein_g, 1.8 * weight_kg)

    protein_g = round(protein_g)

    # ── Step 8: Fat ───────────────────────────────────────────
    fat_g = 0.8 * weight_kg
    min_fat = 45 if sex == "female" else 50
    fat_g = round(max(fat_g, min_fat))

    # ── Step 9: Fiber ─────────────────────────────────────────
    fiber_g = round(max(25, min(40, (calories / 1000) * 14)))

    # ── Step 10: Net carbs ────────────────────────────────────
    remaining = calories - protein_g * 4 - fat_g * 9
    net_carbs_g = round(max(75, remaining / 4))

    # ── Step 11: Glycemic load target ─────────────────────────
    if direction == "losing":
        gl_target = 70
    elif direction == "maintaining":
        gl_target = 90
    else:  # gaining
        gl_target = 110

    if diabetes or pcos:
        gl_target = min(gl_target, 80)

    # ── Fat breakdown (evidence-based proportions) ────────────
    mufa_g     = round(fat_g * 0.40, 1)
    pufa_g     = round(fat_g * 0.30, 1)
    omega3_g   = round(max(fat_g * 0.08, 1.5), 1)
    omega6_g   = round(max(pufa_g - omega3_g, 0), 1)
    sfa_g      = round(fat_g * 0.25, 1)
    trans_fat_g = 2.0

    # ── Step 12: Return ───────────────────────────────────────
    return {
        "calories":        calories,
        "protein_g":       float(protein_g),
        "fat_g":           float(fat_g),
        "fiber_g":         float(fiber_g),
        "net_carbs_g":     float(net_carbs_g),
        # Store single GL target as both gl_min and gl_max for DB compatibility
        "gl_min":          gl_target,
        "gl_max":          gl_target,
        "mufa_g":          mufa_g,
        "pufa_g":          pufa_g,
        "omega3_g":        omega3_g,
        "omega6_g":        omega6_g,
        "sfa_g":           sfa_g,
        "trans_fat_g":     trans_fat_g,
        # Meta — returned to UI but not persisted
        "warnings":        warnings,
        "weekly_change_kg": round(weekly_change_kg, 2),
        "direction":       direction,
    }


def calculate_log_nutrition(food: dict, portion_amount: float, portion_unit: str) -> dict:
    """Return per-entry nutrition values given a food item and portion."""
    if portion_unit in ("g", "ml"):
        grams = portion_amount
    else:  # piece
        piece_weight = food.get("piece_weight_g") or food.get("default_portion_amount", 100)
        grams = portion_amount * piece_weight

    m = grams / 100
    gi = food.get("glycemic_index", 0) or 0
    net_carbs_per_100 = food.get("net_carbs_g", 0) or 0
    gl = round(gi * net_carbs_per_100 / 100 * m, 2)

    return {
        "calories":    round((food.get("calories",    0) or 0) * m, 2),
        "protein_g":   round((food.get("protein_g",   0) or 0) * m, 2),
        "fat_g":       round((food.get("fat_g",       0) or 0) * m, 2),
        "mufa_g":      round((food.get("mufa_g",      0) or 0) * m, 2),
        "pufa_g":      round((food.get("pufa_g",      0) or 0) * m, 2),
        "omega3_g":    round((food.get("omega3_g",    0) or 0) * m, 2),
        "omega6_g":    round((food.get("omega6_g",    0) or 0) * m, 2),
        "sfa_g":       round((food.get("sfa_g",       0) or 0) * m, 2),
        "trans_fat_g": round((food.get("trans_fat_g", 0) or 0) * m, 2),
        "fiber_g":     round((food.get("fiber_g",     0) or 0) * m, 2),
        "net_carbs_g": round(net_carbs_per_100 * m, 2),
        "glycemic_load": gl,
    }
