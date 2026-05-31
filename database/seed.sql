-- ============================================================
-- Nutrition Tracker - Global Food Database Seed
-- All values per 100g unless noted. Run after schema.sql.
-- ============================================================

INSERT INTO food_items (name, tag, calories, protein_g, fat_g, mufa_g, pufa_g, omega3_g, omega6_g, sfa_g, trans_fat_g, fiber_g, net_carbs_g, glycemic_index, default_portion_unit, default_portion_amount, piece_weight_g, cooking_assumptions, is_custom)
VALUES

-- ====== GRAINS & CEREALS ======
('White Rice (cooked)', 'OR', 130, 2.7, 0.3, 0.1, 0.1, 0.0, 0.1, 0.1, 0, 0.4, 28.1, 72, 'g', 150, NULL, 'Boiled in water, no salt. 1 cup ≈ 175g cooked.', false),
('Brown Rice (cooked)', 'MR', 123, 2.7, 1.0, 0.3, 0.4, 0.0, 0.4, 0.3, 0, 1.6, 24.0, 55, 'g', 150, NULL, 'Boiled in water, no salt. 1 cup ≈ 175g cooked.', false),
('Rolled Oats (dry)', 'R', 389, 16.9, 6.9, 2.2, 2.5, 0.1, 2.4, 1.2, 0, 10.6, 55.7, 55, 'g', 40, NULL, 'Dry weight. Cook with water or milk; nutrition calculated for dry oats.', false),
('Whole Wheat Roti', 'MR', 297, 10.6, 3.4, 0.5, 1.4, 0.0, 1.4, 0.7, 0, 7.0, 53.4, 62, 'piece', 1, 40, 'Standard medium roti (~40g) made without oil. Add oil/ghee separately if used.', false),
('Multigrain Roti', 'R', 280, 11.0, 4.0, 0.8, 1.6, 0.1, 1.5, 0.8, 0, 8.0, 48.0, 52, 'piece', 1, 40, 'Mix of wheat, jowar, bajra, ragi (standard multigrain atta). ~40g per roti, no oil.', false),
('White Bread (slice)', 'NR', 266, 9.4, 3.9, 0.9, 1.4, 0.1, 1.3, 0.8, 0.1, 2.7, 47.9, 75, 'piece', 1, 30, '1 slice ≈ 30g. Standard store-bought white sandwich bread.', false),
('Whole Wheat Bread (slice)', 'MR', 247, 11.0, 3.4, 0.5, 1.4, 0.0, 1.3, 0.6, 0, 6.9, 37.7, 69, 'piece', 1, 30, '1 slice ≈ 30g. 100% whole wheat bread.', false),
('Quinoa (cooked)', 'R', 120, 4.4, 1.9, 0.5, 1.0, 0.1, 0.8, 0.2, 0, 2.8, 20.0, 53, 'g', 150, NULL, 'Cooked in water, rinsed before cooking. 1 cup ≈ 185g cooked.', false),
('Idli (steamed)', 'MR', 130, 3.7, 0.5, 0.1, 0.2, 0.0, 0.2, 0.1, 0, 1.0, 24.2, 70, 'piece', 2, 60, '1 medium idli ≈ 60g. Made from standard rice-urad dal batter, steamed.', false),
('Poha (cooked)', 'MR', 165, 3.2, 2.5, 0.6, 0.9, 0.0, 0.9, 0.5, 0, 1.5, 31.0, 68, 'g', 150, NULL, 'Cooked with minimal oil (~1 tsp/100g), onion, curry leaves. Thick or medium poha flakes.', false),
('Dosa (plain)', 'MR', 168, 4.0, 3.7, 0.9, 1.5, 0.0, 1.5, 0.7, 0, 1.2, 29.0, 66, 'piece', 1, 80, '1 medium plain dosa ≈ 80g. Made from fermented rice-urad dal batter on tawa with minimal oil.', false),
('Upma', 'MR', 145, 3.8, 4.5, 1.1, 1.8, 0.1, 1.7, 0.8, 0, 2.0, 22.5, 65, 'g', 150, NULL, 'Semolina (sooji) upma with 1 tsp oil/100g, onion, vegetables.', false),

-- ====== PULSES & LEGUMES ======
('Red Lentil Dal (cooked)', 'R', 116, 9.0, 0.4, 0.1, 0.2, 0.0, 0.2, 0.1, 0, 7.9, 12.3, 29, 'g', 150, NULL, 'Masoor dal cooked with water and basic tempering (1 tsp oil/100g), no cream.', false),
('Moong Dal (cooked)', 'R', 105, 7.0, 0.4, 0.1, 0.2, 0.0, 0.2, 0.1, 0, 7.6, 14.5, 31, 'g', 150, NULL, 'Yellow moong dal, pressure cooked, light tempering.', false),
('Chana Dal (cooked)', 'R', 164, 8.9, 2.6, 0.8, 0.9, 0.0, 0.9, 0.4, 0, 7.6, 24.3, 33, 'g', 150, NULL, 'Split Bengal gram, pressure cooked with basic spices. No cream.', false),
('Rajma / Kidney Beans (cooked)', 'R', 127, 8.7, 0.5, 0.1, 0.3, 0.0, 0.3, 0.1, 0, 6.4, 19.9, 24, 'g', 150, NULL, 'Red kidney beans soaked overnight and pressure cooked. Nutrition for beans only; add gravy macros separately.', false),
('Chole / Chickpeas (cooked)', 'R', 164, 8.9, 2.6, 0.6, 1.1, 0.0, 1.1, 0.3, 0, 7.6, 24.3, 28, 'g', 150, NULL, 'Kabuli chana soaked overnight and pressure cooked. Nutrition for chickpeas only.', false),
('Sambar', 'R', 55, 3.5, 1.5, 0.3, 0.7, 0.0, 0.7, 0.3, 0, 3.5, 6.5, 30, 'g', 150, NULL, 'Toor dal sambar with mixed vegetables, 1 tsp oil/100g, tamarind. No coconut.', false),
('Black-eyed Peas (cooked)', 'R', 116, 7.7, 0.5, 0.1, 0.2, 0.0, 0.2, 0.1, 0, 6.5, 15.7, 33, 'g', 150, NULL, 'Lobia, soaked overnight and pressure cooked.', false),

-- ====== DAIRY ======
('Paneer (fresh)', 'MR', 265, 18.3, 20.8, 5.3, 0.7, 0.1, 0.6, 13.3, 0.2, 0.0, 3.4, 0, 'g', 100, NULL, 'Full-fat fresh paneer. Values for raw paneer; no cooking fat added.', false),
('Curd / Dahi (full fat)', 'R', 98, 11.0, 4.3, 1.1, 0.1, 0.0, 0.1, 2.8, 0.1, 0.0, 3.4, 35, 'g', 150, NULL, 'Set curd made from full-fat milk (~3.5% fat).', false),
('Greek Yogurt / Hung Curd', 'R', 59, 10.0, 0.4, 0.1, 0.0, 0.0, 0.0, 0.3, 0, 0.0, 3.6, 11, 'g', 150, NULL, 'Low-fat Greek yogurt or strained hung curd.', false),
('Whole Milk', 'MR', 61, 3.2, 3.3, 0.8, 0.1, 0.0, 0.1, 2.1, 0.1, 0.0, 4.8, 31, 'ml', 200, NULL, '3.5% fat toned whole milk.', false),
('Skim Milk', 'R', 34, 3.4, 0.1, 0.0, 0.0, 0.0, 0.0, 0.1, 0, 0.0, 5.0, 32, 'ml', 200, NULL, '0.1% fat skim / double-toned milk.', false),
('Ghee', 'MR', 900, 0.0, 99.5, 29.0, 3.7, 0.5, 3.2, 64.5, 0.2, 0.0, 0.0, 0, 'ml', 10, NULL, 'Pure clarified butter (cow ghee). 1 tsp ≈ 5ml.', false),

-- ====== EGGS & POULTRY ======
('Whole Egg', 'R', 155, 13.0, 11.0, 4.1, 1.4, 0.0, 1.4, 3.3, 0, 0.0, 1.1, 0, 'piece', 1, 60, '1 large egg ≈ 60g. Boiled or poached; no added fat.', false),
('Egg White', 'R', 52, 10.9, 0.2, 0.0, 0.0, 0.0, 0.0, 0.0, 0, 0.0, 0.7, 0, 'g', 60, NULL, 'Raw egg white. ~30g per large egg white.', false),
('Chicken Breast (cooked, boneless)', 'R', 165, 31.0, 3.6, 1.2, 0.8, 0.1, 0.7, 1.0, 0, 0.0, 0.0, 0, 'g', 150, NULL, 'Grilled or baked boneless skinless breast, no marinades. Values for cooked weight.', false),
('Chicken Thigh (cooked, boneless)', 'MR', 209, 26.0, 10.9, 4.0, 2.3, 0.2, 2.1, 3.0, 0, 0.0, 0.0, 0, 'g', 150, NULL, 'Grilled or baked boneless skinless thigh. Cooked weight.', false),
('Chicken Keema (cooked)', 'MR', 215, 22.0, 13.0, 4.5, 2.2, 0.2, 2.0, 4.5, 0, 0.0, 2.0, 0, 'g', 150, NULL, 'Minced chicken cooked with onion, tomato, 1 tsp oil/100g, standard spices.', false),

-- ====== FISH & SEAFOOD ======
('Salmon (cooked)', 'R', 208, 20.0, 13.4, 3.8, 5.7, 2.2, 3.5, 3.0, 0, 0.0, 0.0, 0, 'g', 120, NULL, 'Baked or grilled. No added oil. Cooked weight.', false),
('Tuna (canned in water)', 'R', 116, 25.5, 1.0, 0.1, 0.4, 0.3, 0.1, 0.2, 0, 0.0, 0.0, 0, 'g', 100, NULL, 'Canned tuna in water, drained. No oil.', false),
('Rohu Fish (cooked)', 'R', 97, 16.6, 2.9, 0.9, 1.0, 0.3, 0.7, 0.6, 0, 0.0, 0.0, 0, 'g', 120, NULL, 'Baked or grilled rohu. Cooked weight, no batter.', false),

-- ====== PLANT PROTEINS ======
('Tofu (firm)', 'R', 76, 8.0, 4.3, 0.9, 2.4, 0.3, 2.1, 0.6, 0, 0.3, 1.7, 15, 'g', 100, NULL, 'Firm tofu, unprepared. Press to remove moisture before cooking.', false),
('Soya Chunks (cooked)', 'R', 153, 17.0, 1.5, 0.3, 0.8, 0.1, 0.7, 0.2, 0, 4.0, 16.0, 30, 'g', 100, NULL, 'Textured soy protein nuggets, boiled and squeezed. Dry weight ~50g becomes 100g cooked.', false),

-- ====== VEGETABLES ======
('Spinach (cooked)', 'R', 23, 2.9, 0.4, 0.0, 0.2, 0.1, 0.1, 0.1, 0, 2.2, 1.4, 15, 'g', 100, NULL, 'Boiled or sautéed with minimal oil. Values for cooked weight.', false),
('Broccoli (cooked)', 'R', 35, 2.4, 0.4, 0.0, 0.2, 0.1, 0.1, 0.1, 0, 3.3, 3.7, 15, 'g', 150, NULL, 'Steamed or blanched broccoli. No added fat.', false),
('Sweet Potato (boiled)', 'MR', 90, 2.0, 0.1, 0.0, 0.0, 0.0, 0.0, 0.0, 0, 3.0, 17.7, 63, 'g', 150, NULL, 'Boiled with skin, then peeled. Values for boiled flesh.', false),
('Potato (boiled)', 'OR', 86, 1.8, 0.1, 0.0, 0.0, 0.0, 0.0, 0.0, 0, 2.1, 17.4, 78, 'g', 150, NULL, 'Boiled peeled potato. GI rises when mashed or fried.', false),
('Onion (raw)', 'R', 40, 1.1, 0.1, 0.0, 0.1, 0.0, 0.0, 0.0, 0, 1.7, 8.6, 10, 'g', 80, NULL, 'Raw onion. Cooking reduces GL slightly.', false),
('Tomato (raw)', 'R', 18, 0.9, 0.2, 0.0, 0.1, 0.0, 0.1, 0.0, 0, 1.2, 2.7, 15, 'g', 100, NULL, 'Raw, ripe tomato.', false),
('Bell Pepper (raw)', 'R', 31, 1.0, 0.3, 0.0, 0.1, 0.0, 0.1, 0.0, 0, 2.1, 4.6, 15, 'g', 100, NULL, 'Raw capsicum, any colour.', false),
('Cauliflower (cooked)', 'R', 25, 1.9, 0.3, 0.0, 0.0, 0.0, 0.0, 0.0, 0, 2.0, 3.0, 15, 'g', 150, NULL, 'Steamed or boiled cauliflower. No added fat.', false),
('Bhindi / Okra (cooked)', 'R', 33, 1.9, 0.2, 0.0, 0.1, 0.0, 0.1, 0.0, 0, 3.2, 3.8, 20, 'g', 100, NULL, 'Cooked with 1 tsp oil/100g and spices. Sliced and sautéed.', false),
('Bottle Gourd / Lauki (cooked)', 'R', 15, 0.6, 0.1, 0.0, 0.0, 0.0, 0.0, 0.0, 0, 0.5, 2.5, 15, 'g', 150, NULL, 'Boiled or cooked with minimal oil.', false),
('Cucumber (raw)', 'R', 15, 0.7, 0.1, 0.0, 0.0, 0.0, 0.0, 0.0, 0, 0.5, 2.5, 15, 'g', 100, NULL, 'Raw, peeled cucumber.', false),
('Mushroom (cooked)', 'R', 28, 3.6, 0.5, 0.1, 0.2, 0.0, 0.2, 0.1, 0, 1.5, 1.5, 15, 'g', 100, NULL, 'Sautéed button mushrooms with minimal oil.', false),

-- ====== FRUITS ======
('Banana', 'MR', 89, 1.1, 0.3, 0.0, 0.1, 0.0, 0.0, 0.1, 0, 2.6, 20.4, 51, 'piece', 1, 120, '1 medium banana ≈ 120g peeled. Ripe.', false),
('Apple', 'R', 52, 0.3, 0.2, 0.0, 0.1, 0.0, 0.0, 0.0, 0, 2.4, 11.6, 36, 'piece', 1, 150, '1 medium apple ≈ 150g. Raw, with or without skin.', false),
('Mango (ripe)', 'OR', 60, 0.8, 0.4, 0.1, 0.1, 0.0, 0.1, 0.1, 0, 1.6, 13.3, 56, 'g', 150, NULL, 'Ripe Alphonso or similar; pulp only.', false),
('Papaya', 'MR', 43, 0.5, 0.3, 0.1, 0.1, 0.0, 0.1, 0.1, 0, 1.7, 9.1, 60, 'g', 150, NULL, 'Ripe papaya, cubed.', false),
('Orange', 'R', 47, 0.9, 0.1, 0.0, 0.0, 0.0, 0.0, 0.0, 0, 2.4, 9.4, 43, 'piece', 1, 130, '1 medium orange ≈ 130g segments. No peel.', false),
('Pomegranate (seeds)', 'R', 83, 1.7, 1.2, 0.1, 0.2, 0.0, 0.2, 0.1, 0, 4.0, 14.5, 35, 'g', 100, NULL, 'Raw arils (seeds with juice sacs) only.', false),
('Guava', 'R', 68, 2.6, 1.0, 0.1, 0.5, 0.0, 0.5, 0.3, 0, 5.4, 9.0, 12, 'piece', 1, 100, '1 medium guava ≈ 100g. Raw.', false),

-- ====== NUTS & SEEDS ======
('Almonds', 'R', 579, 21.2, 49.9, 31.6, 12.4, 0.0, 12.3, 3.8, 0, 12.5, 9.1, 0, 'g', 30, NULL, 'Raw or dry-roasted almonds, unsalted.', false),
('Walnuts', 'R', 654, 15.2, 65.2, 8.9, 47.2, 9.1, 38.1, 6.1, 0, 6.7, 7.0, 15, 'g', 30, NULL, 'Raw walnuts, shelled. Excellent omega-3 source.', false),
('Flaxseeds (ground)', 'R', 534, 18.3, 42.2, 7.5, 28.7, 22.8, 5.9, 3.7, 0, 27.3, 0.0, 35, 'g', 15, NULL, 'Ground flaxseeds (flaxseed meal). Grind before use for better absorption.', false),
('Chia Seeds', 'R', 486, 16.5, 30.7, 2.3, 23.7, 17.8, 5.9, 3.3, 0, 34.4, 2.0, 1, 'g', 20, NULL, 'Whole chia seeds. Soak 15 min in water before consuming.', false),
('Pumpkin Seeds', 'R', 559, 30.2, 49.1, 16.1, 20.3, 0.1, 20.2, 8.8, 0, 6.0, 4.7, 10, 'g', 30, NULL, 'Raw or dry-roasted, unsalted pumpkin seeds.', false),
('Peanuts (roasted)', 'MR', 567, 25.8, 49.2, 24.4, 15.6, 0.0, 15.6, 6.9, 0, 8.5, 9.9, 14, 'g', 30, NULL, 'Dry-roasted, unsalted peanuts.', false),

-- ====== OILS & FATS ======
('Olive Oil', 'R', 884, 0.0, 100.0, 72.9, 10.5, 0.8, 9.7, 13.8, 0, 0.0, 0.0, 0, 'ml', 10, NULL, 'Extra-virgin olive oil. 1 tsp ≈ 5ml, 1 tbsp ≈ 15ml.', false),
('Mustard Oil', 'MR', 884, 0.0, 100.0, 59.2, 21.2, 5.9, 15.3, 11.6, 0, 0.0, 0.0, 0, 'ml', 10, NULL, 'Cold-pressed kachi ghani mustard oil. 1 tsp ≈ 5ml.', false),
('Coconut Oil', 'NR', 892, 0.0, 99.1, 5.8, 1.8, 0.0, 1.8, 86.5, 0, 0.0, 0.0, 0, 'ml', 10, NULL, 'Virgin coconut oil. Very high in SFA. Use sparingly.', false),

-- ====== PEANUT BUTTER & SPREADS ======
('Peanut Butter (natural)', 'MR', 588, 25.1, 50.4, 24.3, 14.0, 0.0, 14.0, 10.3, 0, 6.0, 13.8, 14, 'g', 32, NULL, 'Natural peanut butter, no added sugar or oil. 2 tbsp ≈ 32g.', false),

-- ====== PROTEIN SUPPLEMENTS ======
('Whey Protein Powder', 'R', 396, 80.0, 4.0, 1.1, 0.2, 0.0, 0.2, 2.4, 0, 0.0, 8.0, 0, 'g', 30, NULL, 'Standard whey concentrate/isolate. 1 scoop ≈ 30g. Mix with water.', false),

-- ====== SNACKS & EXTRAS ======
('Dark Chocolate (70%+ cocoa)', 'MR', 546, 4.9, 31.3, 9.9, 1.0, 0.0, 1.0, 18.6, 0.1, 12.7, 42.1, 23, 'g', 30, NULL, '70% or higher cocoa content. 1 small square ≈ 10g.', false),
('Buttermilk (chaas)', 'R', 40, 3.5, 1.0, 0.3, 0.0, 0.0, 0.0, 0.7, 0, 0.0, 4.5, 30, 'ml', 200, NULL, 'Thin buttermilk (1 part curd + 2 parts water), salted with roasted cumin.', false),

-- ====== NUTS — PIECE-COUNTED ======
('Cashews', 'MR', 553, 18.2, 43.9, 23.8, 7.8, 0.1, 7.7, 7.8, 0, 3.3, 26.9, 22, 'piece', 10, 1.8, 'Raw or dry-roasted cashews, unsalted. 1 cashew ≈ 1.8g.', false)

ON CONFLICT DO NOTHING;

-- ============================================================
-- Add piece weights to countable items that were missing them
-- Run these UPDATE statements after the INSERT above.
-- ============================================================

-- Almonds: 1 almond ≈ 1.5g, switch default to "piece" counting
UPDATE food_items
SET piece_weight_g = 1.5, default_portion_unit = 'piece', default_portion_amount = 10
WHERE name = 'Almonds' AND user_id IS NULL;

-- Walnuts: 1 walnut half ≈ 5g
UPDATE food_items
SET piece_weight_g = 5, default_portion_unit = 'piece', default_portion_amount = 4
WHERE name = 'Walnuts' AND user_id IS NULL;

-- Peanuts: 1 peanut ≈ 0.5g (counted by piece when snacking)
UPDATE food_items
SET piece_weight_g = 0.5
WHERE name = 'Peanut (roasted)' AND user_id IS NULL;
