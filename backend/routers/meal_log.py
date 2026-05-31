from fastapi import APIRouter, Depends, HTTPException
from datetime import date, datetime, timezone
from database import get_supabase
from auth import get_current_user
from models.schemas import MealLogCreate, MealLogUpdate, MealLog, DailySummary, MacroTotals
from services.nutrition_calculator import calculate_log_nutrition

router = APIRouter()


def _sum_logs(logs: list[dict]) -> MacroTotals:
    totals = MacroTotals()
    for log in logs:
        totals.calories += log.get("calories", 0) or 0
        totals.protein_g += log.get("protein_g", 0) or 0
        totals.fat_g += log.get("fat_g", 0) or 0
        totals.mufa_g += log.get("mufa_g", 0) or 0
        totals.pufa_g += log.get("pufa_g", 0) or 0
        totals.omega3_g += log.get("omega3_g", 0) or 0
        totals.omega6_g += log.get("omega6_g", 0) or 0
        totals.sfa_g += log.get("sfa_g", 0) or 0
        totals.trans_fat_g += log.get("trans_fat_g", 0) or 0
        totals.fiber_g += log.get("fiber_g", 0) or 0
        totals.net_carbs_g += log.get("net_carbs_g", 0) or 0
        totals.glycemic_load += log.get("glycemic_load", 0) or 0
    for field in totals.model_fields:
        val = getattr(totals, field)
        setattr(totals, field, round(val, 2))
    return totals


@router.get("/today", response_model=DailySummary)
async def get_today(user=Depends(get_current_user)):
    return await get_by_date(str(date.today()), user)


@router.get("/date/{log_date}", response_model=DailySummary)
async def get_by_date(log_date: str, user=Depends(get_current_user)):
    sb = get_supabase()
    user_id = user["user_id"]

    logs = (
        sb.table("meal_logs")
        .select("*")
        .eq("user_id", user_id)
        .eq("log_date", log_date)
        .order("logged_at")
        .execute()
    ).data

    target_row = (
        sb.table("nutrition_targets")
        .select("*")
        .eq("user_id", user_id)
        .execute()
    ).data

    return DailySummary(
        date=log_date,
        totals=_sum_logs(logs),
        target=target_row[0] if target_row else None,
        entries=logs,
    )


@router.post("", response_model=MealLog, status_code=201)
async def add_log(
    entry: MealLogCreate,
    user=Depends(get_current_user),
):
    sb = get_supabase()
    user_id = user["user_id"]

    food = (
        sb.table("food_items")
        .select("*")
        .eq("id", str(entry.food_item_id))
        .execute()
    ).data
    if not food:
        raise HTTPException(status_code=404, detail="Food item not found")
    food = food[0]

    nutrition = calculate_log_nutrition(food, entry.portion_amount, entry.portion_unit)
    payload = {
        "user_id": user_id,
        "food_item_id": str(entry.food_item_id),
        "food_name": food["name"],
        "meal_type": entry.meal_type,
        "portion_amount": entry.portion_amount,
        "portion_unit": entry.portion_unit,
        "log_date": str(entry.log_date or date.today()),
        "logged_at": datetime.now(timezone.utc).isoformat(),
        **nutrition,
    }
    result = sb.table("meal_logs").insert(payload).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Insert failed")
    return result.data[0]


@router.put("/{log_id}", response_model=MealLog)
async def update_log(
    log_id: str,
    updates: MealLogUpdate,
    user=Depends(get_current_user),
):
    sb = get_supabase()
    user_id = user["user_id"]

    existing = (
        sb.table("meal_logs")
        .select("*, food_items(*)")
        .eq("id", log_id)
        .eq("user_id", user_id)
        .execute()
    ).data
    if not existing:
        raise HTTPException(status_code=404, detail="Log entry not found")

    log = existing[0]
    food = log.get("food_items") or {}

    new_amount = updates.portion_amount if updates.portion_amount is not None else log["portion_amount"]
    new_unit = updates.portion_unit if updates.portion_unit is not None else log["portion_unit"]

    nutrition = calculate_log_nutrition(food, new_amount, new_unit)
    payload = {k: v for k, v in updates.model_dump(exclude_none=True).items()}
    payload.update(nutrition)
    payload["portion_amount"] = new_amount
    payload["portion_unit"] = new_unit

    result = (
        sb.table("meal_logs")
        .update(payload)
        .eq("id", log_id)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=500, detail="Update failed")
    return result.data[0]


@router.delete("/{log_id}", status_code=204)
async def delete_log(
    log_id: str,
    user=Depends(get_current_user),
):
    sb = get_supabase()
    user_id = user["user_id"]
    existing = (
        sb.table("meal_logs")
        .select("id")
        .eq("id", log_id)
        .eq("user_id", user_id)
        .execute()
    )
    if not existing.data:
        raise HTTPException(status_code=404, detail="Log entry not found")
    sb.table("meal_logs").delete().eq("id", log_id).execute()
