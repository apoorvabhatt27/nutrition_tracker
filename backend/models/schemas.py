from pydantic import BaseModel, Field
from typing import Optional, Literal
from datetime import date, datetime
from uuid import UUID


MealType = Literal["breakfast", "lunch", "dinner", "snack", "extra"]
PortionUnit = Literal["g", "ml", "piece"]
FoodTag = Literal["R", "MR", "OR", "NR"]
Goal = Literal["fat_loss", "maintenance", "muscle_gain"]   # kept for DB compat
Sex = Literal["male", "female"]


# ──────────────────────────────────────────────────────────────
# Food Items
# ──────────────────────────────────────────────────────────────

class FoodItemBase(BaseModel):
    name: str
    tag: FoodTag = "MR"
    calories: float = 0
    protein_g: float = 0
    fat_g: float = 0
    mufa_g: float = 0
    pufa_g: float = 0
    omega3_g: float = 0
    omega6_g: float = 0
    sfa_g: float = 0
    trans_fat_g: float = 0
    fiber_g: float = 0
    net_carbs_g: float = 0
    glycemic_index: int = 0
    default_portion_unit: PortionUnit = "g"
    default_portion_amount: float = 100
    piece_weight_g: Optional[float] = None
    cooking_assumptions: Optional[str] = None


class FoodItemCreate(FoodItemBase):
    pass


class FoodItemUpdate(BaseModel):
    name: Optional[str] = None
    tag: Optional[FoodTag] = None
    calories: Optional[float] = None
    protein_g: Optional[float] = None
    fat_g: Optional[float] = None
    mufa_g: Optional[float] = None
    pufa_g: Optional[float] = None
    omega3_g: Optional[float] = None
    omega6_g: Optional[float] = None
    sfa_g: Optional[float] = None
    trans_fat_g: Optional[float] = None
    fiber_g: Optional[float] = None
    net_carbs_g: Optional[float] = None
    glycemic_index: Optional[int] = None
    default_portion_unit: Optional[PortionUnit] = None
    default_portion_amount: Optional[float] = None
    piece_weight_g: Optional[float] = None
    cooking_assumptions: Optional[str] = None


class FoodItem(FoodItemBase):
    id: UUID
    user_id: Optional[UUID] = None
    is_custom: bool = False
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ──────────────────────────────────────────────────────────────
# Meal Logs
# ──────────────────────────────────────────────────────────────

class MealLogCreate(BaseModel):
    food_item_id: UUID
    meal_type: MealType
    portion_amount: float = Field(gt=0)
    portion_unit: PortionUnit
    log_date: Optional[date] = None


class MealLogUpdate(BaseModel):
    meal_type: Optional[MealType] = None
    portion_amount: Optional[float] = Field(default=None, gt=0)
    portion_unit: Optional[PortionUnit] = None


class MealLog(BaseModel):
    id: UUID
    user_id: UUID
    food_item_id: UUID
    food_name: str
    meal_type: MealType
    portion_amount: float
    portion_unit: PortionUnit
    calories: float
    protein_g: float
    fat_g: float
    mufa_g: float
    pufa_g: float
    omega3_g: float
    omega6_g: float
    sfa_g: float
    trans_fat_g: float
    fiber_g: float
    net_carbs_g: float
    glycemic_load: float
    log_date: date
    logged_at: datetime

    class Config:
        from_attributes = True


# ──────────────────────────────────────────────────────────────
# Meal Plan
# ──────────────────────────────────────────────────────────────

class MealPlanItemCreate(BaseModel):
    food_item_id: UUID
    meal_type: MealType
    portion_amount: float = Field(gt=0)
    portion_unit: PortionUnit


class MealPlanItem(BaseModel):
    id: UUID
    user_id: UUID
    food_item_id: UUID
    food_name: str
    meal_type: MealType
    portion_amount: float
    portion_unit: PortionUnit
    calories: float
    protein_g: float
    fat_g: float
    mufa_g: float = 0
    pufa_g: float = 0
    omega3_g: float = 0
    omega6_g: float = 0
    sfa_g: float = 0
    trans_fat_g: float = 0
    fiber_g: float
    net_carbs_g: float
    glycemic_load: float
    created_at: datetime

    class Config:
        from_attributes = True


# ──────────────────────────────────────────────────────────────
# Nutrition Targets
# ──────────────────────────────────────────────────────────────

class TargetInputs(BaseModel):
    age: int = Field(ge=10, le=100)
    sex: Sex
    height_cm: float = Field(ge=100, le=250)
    weight_kg: float = Field(ge=30, le=300)         # current weight
    target_weight_kg: float = Field(ge=30, le=300)  # goal weight
    target_duration_weeks: int = Field(ge=1, le=104)
    activity_level: float = Field(ge=1.0, le=2.0)
    is_vegetarian: bool = False
    diabetes: bool = False
    pcos: bool = False


class NutritionTargetUpdate(BaseModel):
    age: Optional[int] = None
    sex: Optional[Sex] = None
    height_cm: Optional[float] = None
    weight_kg: Optional[float] = None
    activity_level: Optional[float] = None
    goal: Optional[Goal] = None
    is_vegetarian: Optional[bool] = None
    calories: Optional[int] = None
    protein_g: Optional[float] = None
    fat_g: Optional[float] = None
    fiber_g: Optional[float] = None
    net_carbs_g: Optional[float] = None
    gl_min: Optional[int] = None
    gl_max: Optional[int] = None
    mufa_g: Optional[float] = None
    pufa_g: Optional[float] = None
    omega3_g: Optional[float] = None
    omega6_g: Optional[float] = None
    sfa_g: Optional[float] = None
    trans_fat_g: Optional[float] = None


class NutritionTarget(BaseModel):
    id: UUID
    user_id: UUID
    age: Optional[int] = None
    sex: Optional[str] = None
    height_cm: Optional[float] = None
    weight_kg: Optional[float] = None
    activity_level: Optional[float] = None
    goal: Optional[str] = None
    is_vegetarian: bool = False
    calories: int
    protein_g: float
    fat_g: float
    fiber_g: float
    net_carbs_g: float
    gl_min: int
    gl_max: int
    mufa_g: float
    pufa_g: float
    omega3_g: float
    omega6_g: float
    sfa_g: float
    trans_fat_g: float
    updated_at: datetime

    class Config:
        from_attributes = True


# ──────────────────────────────────────────────────────────────
# Nutrition Summary
# ──────────────────────────────────────────────────────────────

class MacroTotals(BaseModel):
    calories: float = 0
    protein_g: float = 0
    fat_g: float = 0
    mufa_g: float = 0
    pufa_g: float = 0
    omega3_g: float = 0
    omega6_g: float = 0
    sfa_g: float = 0
    trans_fat_g: float = 0
    fiber_g: float = 0
    net_carbs_g: float = 0
    glycemic_load: float = 0


class DailySummary(BaseModel):
    date: date
    totals: MacroTotals
    target: Optional[NutritionTarget] = None
    entries: list[MealLog] = []


class DateRangeSummary(BaseModel):
    start_date: date
    end_date: date
    days_with_data: int
    avg: MacroTotals
    target: Optional[NutritionTarget] = None
    daily: list[dict] = []


