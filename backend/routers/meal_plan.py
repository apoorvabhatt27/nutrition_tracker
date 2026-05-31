from fastapi import APIRouter, Depends, HTTPException
from database import get_supabase
from auth import get_current_user
from models.schemas import MealPlanItemCreate, MealPlanItem
from services.nutrition_calculator import calculate_log_nutrition

router = APIRouter()


@router.get("", response_model=list[MealPlanItem])
async def get_plan(user=Depends(get_current_user)):
    sb = get_supabase()
    rows = (
        sb.table("meal_plan_items")
        .select("*, food_items(*)")
        .eq("user_id", user["user_id"])
        .order("meal_type")
        .execute()
    ).data

    enriched = []
    for row in rows:
        food = row.pop("food_items", None) or {}
        fat  = calculate_log_nutrition(food, row["portion_amount"], row["portion_unit"])
        enriched.append({
            **row,
            "mufa_g":      fat["mufa_g"],
            "pufa_g":      fat["pufa_g"],
            "omega3_g":    fat["omega3_g"],
            "omega6_g":    fat["omega6_g"],
            "sfa_g":       fat["sfa_g"],
            "trans_fat_g": fat["trans_fat_g"],
        })
    return enriched


@router.post("", response_model=MealPlanItem, status_code=201)
async def add_plan_item(item: MealPlanItemCreate, user=Depends(get_current_user)):
    sb = get_supabase()
    user_id = user["user_id"]

    food = (
        sb.table("food_items")
        .select("*")
        .eq("id", str(item.food_item_id))
        .execute()
    ).data
    if not food:
        raise HTTPException(status_code=404, detail="Food item not found")
    food = food[0]

    nutrition = calculate_log_nutrition(food, item.portion_amount, item.portion_unit)
    payload = {
        "user_id": user_id,
        "food_item_id": str(item.food_item_id),
        "food_name": food["name"],
        "meal_type": item.meal_type,
        "portion_amount": item.portion_amount,
        "portion_unit": item.portion_unit,
        "calories": nutrition["calories"],
        "protein_g": nutrition["protein_g"],
        "fat_g": nutrition["fat_g"],
        "fiber_g": nutrition["fiber_g"],
        "net_carbs_g": nutrition["net_carbs_g"],
        "glycemic_load": nutrition["glycemic_load"],
    }
    result = sb.table("meal_plan_items").insert(payload).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Insert failed")
    return result.data[0]


@router.delete("/{item_id}", status_code=204)
async def delete_plan_item(item_id: str, user=Depends(get_current_user)):
    sb = get_supabase()
    user_id = user["user_id"]
    existing = (
        sb.table("meal_plan_items")
        .select("id")
        .eq("id", item_id)
        .eq("user_id", user_id)
        .execute()
    )
    if not existing.data:
        raise HTTPException(status_code=404, detail="Plan item not found")
    sb.table("meal_plan_items").delete().eq("id", item_id).execute()


@router.delete("", status_code=204)
async def clear_plan(user=Depends(get_current_user)):
    sb = get_supabase()
    sb.table("meal_plan_items").delete().eq("user_id", user["user_id"]).execute()
