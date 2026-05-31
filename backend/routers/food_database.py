from fastapi import APIRouter, Depends, HTTPException, Query
from database import get_supabase
from auth import get_current_user, get_current_user_optional
from models.schemas import FoodItemCreate, FoodItemUpdate, FoodItem

router = APIRouter()


@router.get("", response_model=list[FoodItem])
async def list_foods(
    q: str | None = Query(default=None),
    tag: str | None = Query(default=None),
    sort_by: str | None = Query(default=None),
    sort_dir: str = Query(default="asc"),
    user=Depends(get_current_user_optional),  # public: no token = global foods only
):
    sb = get_supabase()
    user_id = user["user_id"] if user else None

    query = sb.table("food_items").select("*")
    if user_id:
        # Logged in: global foods + their custom foods
        query = query.or_(f"user_id.is.null,user_id.eq.{user_id}")
    else:
        # Not logged in: global foods only
        query = query.is_("user_id", "null")

    if q:
        query = query.ilike("name", f"*{q}*")
    if tag:
        query = query.eq("tag", tag)

    valid_sorts = {
        "protein": "protein_g",
        "fat": "fat_g",
        "fiber": "fiber_g",
        "net_carbs": "net_carbs_g",
        "gl": "glycemic_index",
        "name": "name",
        "calories": "calories",
    }
    col = valid_sorts.get(sort_by, "name")
    query = query.order(col, desc=(sort_dir.lower() == "desc"))

    result = query.execute()
    return result.data


@router.post("", response_model=FoodItem, status_code=201)
async def add_food(
    food: FoodItemCreate,
    user=Depends(get_current_user),
):
    sb = get_supabase()
    user_id = user["user_id"]
    payload = {**food.model_dump(), "user_id": user_id, "is_custom": True}
    result = sb.table("food_items").insert(payload).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Insert failed")
    return result.data[0]


@router.put("/{food_id}", response_model=FoodItem)
async def update_food(
    food_id: str,
    updates: FoodItemUpdate,
    user=Depends(get_current_user),
):
    sb = get_supabase()
    user_id = user["user_id"]
    # Ensure the food belongs to this user
    existing = (
        sb.table("food_items")
        .select("id")
        .eq("id", food_id)
        .eq("user_id", user_id)
        .execute()
    )
    if not existing.data:
        raise HTTPException(status_code=404, detail="Food not found")

    payload = updates.model_dump(exclude_none=True)
    result = (
        sb.table("food_items")
        .update(payload)
        .eq("id", food_id)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=500, detail="Update failed")
    return result.data[0]


@router.delete("/{food_id}", status_code=204)
async def delete_food(
    food_id: str,
    user=Depends(get_current_user),
):
    sb = get_supabase()
    user_id = user["user_id"]
    existing = (
        sb.table("food_items")
        .select("id")
        .eq("id", food_id)
        .eq("user_id", user_id)
        .execute()
    )
    if not existing.data:
        raise HTTPException(status_code=404, detail="Food not found")
    sb.table("food_items").delete().eq("id", food_id).execute()
