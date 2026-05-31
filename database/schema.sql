-- ============================================================
-- Nutrition Tracker - Database Schema
-- Run this in Supabase SQL Editor
-- ============================================================

-- Enable UUID extension (already enabled in Supabase)
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- FOOD ITEMS
-- user_id NULL = global item; non-null = user custom item
-- ============================================================
CREATE TABLE IF NOT EXISTS food_items (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name                  TEXT NOT NULL,
  tag                   TEXT NOT NULL DEFAULT 'MR' CHECK (tag IN ('R', 'MR', 'OR', 'NR')),
  -- Per 100g / 100ml values
  calories              NUMERIC NOT NULL DEFAULT 0,
  protein_g             NUMERIC NOT NULL DEFAULT 0,
  fat_g                 NUMERIC NOT NULL DEFAULT 0,
  mufa_g                NUMERIC NOT NULL DEFAULT 0,
  pufa_g                NUMERIC NOT NULL DEFAULT 0,
  omega3_g              NUMERIC NOT NULL DEFAULT 0,
  omega6_g              NUMERIC NOT NULL DEFAULT 0,
  sfa_g                 NUMERIC NOT NULL DEFAULT 0,
  trans_fat_g           NUMERIC NOT NULL DEFAULT 0,
  fiber_g               NUMERIC NOT NULL DEFAULT 0,
  net_carbs_g           NUMERIC NOT NULL DEFAULT 0,
  glycemic_index        INTEGER NOT NULL DEFAULT 0,
  -- Portion defaults
  default_portion_unit  TEXT NOT NULL DEFAULT 'g' CHECK (default_portion_unit IN ('g', 'ml', 'piece')),
  default_portion_amount NUMERIC NOT NULL DEFAULT 100,
  piece_weight_g        NUMERIC,           -- grams per piece (for piece-based foods)
  cooking_assumptions   TEXT,
  is_custom             BOOLEAN NOT NULL DEFAULT FALSE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Unique name per global food (user_id IS NULL)
CREATE UNIQUE INDEX IF NOT EXISTS food_items_global_name_idx
  ON food_items (name) WHERE user_id IS NULL;

-- ============================================================
-- NUTRITION TARGETS
-- One row per user; updated in-place.
-- ============================================================
CREATE TABLE IF NOT EXISTS nutrition_targets (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  -- Inputs stored for recalculation
  age             INTEGER,
  sex             TEXT CHECK (sex IN ('male', 'female')),
  height_cm       NUMERIC,
  weight_kg       NUMERIC,
  activity_level  NUMERIC,
  goal            TEXT CHECK (goal IN ('fat_loss', 'maintenance', 'muscle_gain')),
  is_vegetarian   BOOLEAN NOT NULL DEFAULT FALSE,
  -- Macro targets (editable by user after calculation)
  calories        INTEGER NOT NULL DEFAULT 2000,
  protein_g       NUMERIC NOT NULL DEFAULT 150,
  fat_g           NUMERIC NOT NULL DEFAULT 67,
  fiber_g         NUMERIC NOT NULL DEFAULT 28,
  net_carbs_g     NUMERIC NOT NULL DEFAULT 200,
  gl_min          INTEGER NOT NULL DEFAULT 80,
  gl_max          INTEGER NOT NULL DEFAULT 100,
  -- Fat breakdown targets
  mufa_g          NUMERIC NOT NULL DEFAULT 27,
  pufa_g          NUMERIC NOT NULL DEFAULT 20,
  omega3_g        NUMERIC NOT NULL DEFAULT 2,
  omega6_g        NUMERIC NOT NULL DEFAULT 18,
  sfa_g           NUMERIC NOT NULL DEFAULT 17,
  trans_fat_g     NUMERIC NOT NULL DEFAULT 2,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- MEAL LOGS
-- Nutrition values denormalized at log time for performance.
-- ============================================================
CREATE TABLE IF NOT EXISTS meal_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  food_item_id    UUID NOT NULL REFERENCES food_items(id),
  food_name       TEXT NOT NULL,
  meal_type       TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack', 'extra')),
  portion_amount  NUMERIC NOT NULL,
  portion_unit    TEXT NOT NULL CHECK (portion_unit IN ('g', 'ml', 'piece')),
  -- Calculated nutrition for this log entry
  calories        NUMERIC NOT NULL DEFAULT 0,
  protein_g       NUMERIC NOT NULL DEFAULT 0,
  fat_g           NUMERIC NOT NULL DEFAULT 0,
  mufa_g          NUMERIC NOT NULL DEFAULT 0,
  pufa_g          NUMERIC NOT NULL DEFAULT 0,
  omega3_g        NUMERIC NOT NULL DEFAULT 0,
  omega6_g        NUMERIC NOT NULL DEFAULT 0,
  sfa_g           NUMERIC NOT NULL DEFAULT 0,
  trans_fat_g     NUMERIC NOT NULL DEFAULT 0,
  fiber_g         NUMERIC NOT NULL DEFAULT 0,
  net_carbs_g     NUMERIC NOT NULL DEFAULT 0,
  glycemic_load   NUMERIC NOT NULL DEFAULT 0,
  log_date        DATE NOT NULL DEFAULT CURRENT_DATE,
  logged_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS meal_logs_user_date_idx ON meal_logs (user_id, log_date);

-- ============================================================
-- MEAL PLAN ITEMS
-- ============================================================
CREATE TABLE IF NOT EXISTS meal_plan_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  food_item_id    UUID NOT NULL REFERENCES food_items(id),
  food_name       TEXT NOT NULL,
  meal_type       TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack', 'extra')),
  portion_amount  NUMERIC NOT NULL,
  portion_unit    TEXT NOT NULL CHECK (portion_unit IN ('g', 'ml', 'piece')),
  calories        NUMERIC NOT NULL DEFAULT 0,
  protein_g       NUMERIC NOT NULL DEFAULT 0,
  fat_g           NUMERIC NOT NULL DEFAULT 0,
  fiber_g         NUMERIC NOT NULL DEFAULT 0,
  net_carbs_g     NUMERIC NOT NULL DEFAULT 0,
  glycemic_load   NUMERIC NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- GOOGLE SHEETS CONNECTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS sheets_connections (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  google_email     TEXT,
  access_token     TEXT,
  refresh_token    TEXT NOT NULL,
  token_expiry     TIMESTAMPTZ,
  spreadsheet_id   TEXT,
  spreadsheet_url  TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- updated_at trigger
-- ============================================================
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TRIGGER set_updated_at_food_items
    BEFORE UPDATE ON food_items
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER set_updated_at_nutrition_targets
    BEFORE UPDATE ON nutrition_targets
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER set_updated_at_meal_logs
    BEFORE UPDATE ON meal_logs
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER set_updated_at_meal_plan_items
    BEFORE UPDATE ON meal_plan_items
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER set_updated_at_sheets_connections
    BEFORE UPDATE ON sheets_connections
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- ROW LEVEL SECURITY
-- (Backend uses service role key which bypasses RLS,
--  but policies protect direct client access)
-- ============================================================
ALTER TABLE food_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE nutrition_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plan_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE sheets_connections ENABLE ROW LEVEL SECURITY;

-- food_items: anyone can read global; only owner can read/write custom
CREATE POLICY food_items_select ON food_items FOR SELECT
  USING (user_id IS NULL OR user_id = auth.uid());
CREATE POLICY food_items_insert ON food_items FOR INSERT
  WITH CHECK (user_id = auth.uid());
CREATE POLICY food_items_update ON food_items FOR UPDATE
  USING (user_id = auth.uid());
CREATE POLICY food_items_delete ON food_items FOR DELETE
  USING (user_id = auth.uid());

-- nutrition_targets: owner only
CREATE POLICY nutrition_targets_all ON nutrition_targets
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- meal_logs: owner only
CREATE POLICY meal_logs_all ON meal_logs
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- meal_plan_items: owner only
CREATE POLICY meal_plan_items_all ON meal_plan_items
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- sheets_connections: owner only
CREATE POLICY sheets_connections_all ON sheets_connections
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
