from fastapi import APIRouter, Depends, HTTPException
from database import get_supabase
from auth import get_current_user
from models.schemas import TargetInputs, NutritionTargetUpdate, NutritionTarget
from services.nutrition_calculator import calculate_targets

router = APIRouter()


def _get_targets(user_id: str) -> dict | None:
    sb = get_supabase()
    result = sb.table("nutrition_targets").select("*").eq("user_id", user_id).execute()
    return result.data[0] if result.data else None


def _direction_to_goal(direction: str) -> str:
    """Map new direction string to legacy DB goal enum."""
    return {"losing": "fat_loss", "gaining": "muscle_gain"}.get(direction, "maintenance")


@router.get("", response_model=NutritionTarget | None)
async def get_targets(user=Depends(get_current_user)):
    return _get_targets(user["user_id"])


@router.post("/calculate")
async def calculate(inputs: TargetInputs, user=Depends(get_current_user)):
    """Calculate targets and return result + warnings. Nothing is saved here."""
    return calculate_targets(
        age=inputs.age,
        sex=inputs.sex,
        height_cm=inputs.height_cm,
        weight_kg=inputs.weight_kg,
        target_weight_kg=inputs.target_weight_kg,
        target_duration_weeks=inputs.target_duration_weeks,
        activity_level=inputs.activity_level,
        is_vegetarian=inputs.is_vegetarian,
        diabetes=inputs.diabetes,
        pcos=inputs.pcos,
    )


@router.put("", response_model=NutritionTarget)
async def save_targets(data: NutritionTargetUpdate, user=Depends(get_current_user)):
    """Save manually-edited target values."""
    sb = get_supabase()
    user_id = user["user_id"]
    existing = _get_targets(user_id)

    payload = data.model_dump(exclude_none=True)
    payload["user_id"] = user_id

    if existing:
        result = (
            sb.table("nutrition_targets")
            .update(payload)
            .eq("user_id", user_id)
            .execute()
        )
    else:
        result = sb.table("nutrition_targets").insert(payload).execute()

    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to save targets")
    return result.data[0]


@router.post("/calculate-and-save", response_model=NutritionTarget)
async def calculate_and_save(inputs: TargetInputs, user=Depends(get_current_user)):
    """Calculate targets from inputs and persist them in one step."""
    sb = get_supabase()
    user_id = user["user_id"]

    calc = calculate_targets(
        age=inputs.age,
        sex=inputs.sex,
        height_cm=inputs.height_cm,
        weight_kg=inputs.weight_kg,
        target_weight_kg=inputs.target_weight_kg,
        target_duration_weeks=inputs.target_duration_weeks,
        activity_level=inputs.activity_level,
        is_vegetarian=inputs.is_vegetarian,
        diabetes=inputs.diabetes,
        pcos=inputs.pcos,
    )

    # Strip fields that aren't DB columns before persisting
    db_calc = {k: v for k, v in calc.items()
               if k not in ("warnings", "weekly_change_kg", "direction")}

    payload = {
        **db_calc,
        "user_id": user_id,
        "age": inputs.age,
        "sex": inputs.sex,
        "height_cm": inputs.height_cm,
        "weight_kg": inputs.weight_kg,
        "activity_level": inputs.activity_level,
        "goal": _direction_to_goal(calc["direction"]),
        "is_vegetarian": inputs.is_vegetarian,
    }

    existing = _get_targets(user_id)
    if existing:
        result = (
            sb.table("nutrition_targets")
            .update(payload)
            .eq("user_id", user_id)
            .execute()
        )
    else:
        result = sb.table("nutrition_targets").insert(payload).execute()

    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to save targets")
    return result.data[0]
