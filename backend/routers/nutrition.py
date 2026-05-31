from fastapi import APIRouter, Depends, Query
from datetime import date, timedelta
from database import get_supabase
from auth import get_current_user
from models.schemas import DateRangeSummary, MacroTotals

router = APIRouter()

MACRO_FIELDS = [
    "calories", "protein_g", "fat_g", "mufa_g", "pufa_g",
    "omega3_g", "omega6_g", "sfa_g", "trans_fat_g",
    "fiber_g", "net_carbs_g", "glycemic_load",
]


def _sum_logs(logs: list[dict]) -> dict:
    totals: dict[str, float] = {f: 0.0 for f in MACRO_FIELDS}
    for log in logs:
        for f in MACRO_FIELDS:
            totals[f] += log.get(f, 0) or 0
    return {k: round(v, 2) for k, v in totals.items()}


@router.get("/summary", response_model=DateRangeSummary)
async def get_summary(
    start_date: str = Query(default=None),
    end_date: str = Query(default=None),
    days: int = Query(default=None, ge=1, le=365),
    user=Depends(get_current_user),
):
    sb = get_supabase()
    user_id = user["user_id"]

    if days is not None:
        end = date.today()
        start = end - timedelta(days=days - 1)
        start_date = str(start)
        end_date = str(end)
    elif not start_date:
        end = date.today()
        start = end - timedelta(days=6)
        start_date = str(start)
        end_date = str(end)

    logs = (
        sb.table("meal_logs")
        .select("*")
        .eq("user_id", user_id)
        .gte("log_date", start_date)
        .lte("log_date", end_date)
        .execute()
    ).data

    target = (
        sb.table("nutrition_targets")
        .select("*")
        .eq("user_id", user_id)
        .execute()
    ).data

    # Build daily breakdown
    daily_map: dict[str, list] = {}
    for log in logs:
        d = str(log["log_date"])
        daily_map.setdefault(d, []).append(log)

    daily = []
    cursor = date.fromisoformat(start_date)
    end_dt = date.fromisoformat(end_date)
    while cursor <= end_dt:
        day_str = str(cursor)
        day_logs = daily_map.get(day_str, [])
        daily.append({"date": day_str, **_sum_logs(day_logs)})
        cursor += timedelta(days=1)

    days_with_data = sum(1 for d in daily if d["calories"] > 0)

    # Average over days with data
    avg: dict[str, float] = {f: 0.0 for f in MACRO_FIELDS}
    if days_with_data > 0:
        totals = _sum_logs(logs)
        avg = {k: round(v / days_with_data, 2) for k, v in totals.items()}

    return DateRangeSummary(
        start_date=start_date,
        end_date=end_date,
        days_with_data=days_with_data,
        avg=MacroTotals(**avg),
        target=target[0] if target else None,
        daily=daily,
    )
