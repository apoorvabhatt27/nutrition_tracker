from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os
from dotenv import load_dotenv

load_dotenv()

from routers import meal_log, meal_plan, food_database, nutrition, targets


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield


app = FastAPI(title="Nutrition Tracker API", version="1.0.0", lifespan=lifespan)

# FRONTEND_URL can be a comma-separated list of allowed origins,
# e.g. "https://your-app.netlify.app,http://localhost:5700"
_raw = os.getenv("FRONTEND_URL", "http://localhost:5700")
allowed_origins = [o.strip() for o in _raw.split(",") if o.strip()]
# Always include local dev origins
for _dev in ["http://localhost:5700", "http://localhost:5500", "http://127.0.0.1:5700"]:
    if _dev not in allowed_origins:
        allowed_origins.append(_dev)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"https://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(meal_log.router, prefix="/api/meals", tags=["meals"])
app.include_router(meal_plan.router, prefix="/api/plan", tags=["plan"])
app.include_router(food_database.router, prefix="/api/foods", tags=["foods"])
app.include_router(nutrition.router, prefix="/api/nutrition", tags=["nutrition"])
app.include_router(targets.router, prefix="/api/targets", tags=["targets"])



@app.get("/health")
def health():
    return {"status": "ok", "version": "1.0.0"}
