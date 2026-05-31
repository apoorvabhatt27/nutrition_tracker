// ── Number formatting ──────────────────────────────────────────
function fmt(n, decimals = 1) {
  if (n == null || isNaN(n)) return '0';
  return Number(n).toFixed(decimals);
}

function fmtInt(n) { return Math.round(n || 0); }

// ── Debounce ───────────────────────────────────────────────────
function debounce(fn, ms) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

// ── Toast notification ─────────────────────────────────────────
function showToast(msg, type = 'info') {
  const existing = document.getElementById('toast');
  if (existing) existing.remove();

  const el = document.createElement('div');
  el.id = 'toast';
  el.className = `toast toast-${type}`;
  el.textContent = msg;
  document.body.appendChild(el);
  requestAnimationFrame(() => el.classList.add('toast-visible'));
  setTimeout(() => {
    el.classList.remove('toast-visible');
    setTimeout(() => el.remove(), 300);
  }, 3000);
}

// ── Date helpers ───────────────────────────────────────────────
function todayStr() {
  return new Date().toISOString().split('T')[0];
}

function friendlyDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ── Macro colour chip ──────────────────────────────────────
function chip(color, text) {
  return `<span style="display:inline-block;padding:2px 7px;border-radius:10px;font-size:0.72rem;font-weight:600;background:${color}22;color:${color};border:1px solid ${color}55;margin:2px 2px 2px 0;white-space:nowrap">${text}</span>`;
}

// ── Macro progress bar ─────────────────────────────────────────
function progressBar(current, target, color = null) {
  const pct = target > 0 ? Math.min((current / target) * 100, 100) : 0;
  const over = target > 0 && current > target;
  const colorStyle = color ? `background:${over ? '#f44336' : color};` : '';
  return `
    <div class="progress-track">
      <div class="progress-fill ${over ? 'over' : ''}" style="width:${pct}%;${colorStyle}"></div>
    </div>
  `;
}

// ── Meal type label ────────────────────────────────────────────
const MEAL_LABELS = {
  breakfast: '🌅 Breakfast',
  lunch: '☀️ Lunch',
  dinner: '🌙 Dinner',
  snack: '🍎 Snack',
  extra: '➕ Extra',
};

function mealLabel(type) {
  return MEAL_LABELS[type] || type;
}

// ── Tag colour ─────────────────────────────────────────────────
function tagClass(tag) {
  return { R: 'tag-r', MR: 'tag-mr', OR: 'tag-or', NR: 'tag-nr' }[tag] || '';
}

// ── Loading spinner ────────────────────────────────────────────
function spinnerHTML() {
  return '<div class="spinner"></div>';
}

// ── Empty state ────────────────────────────────────────────────
function emptyState(msg) {
  return `<div class="empty-state"><p>${msg}</p></div>`;
}

// ── Modal helpers ──────────────────────────────────────────────
function openModal(id) {
  document.getElementById(id).classList.add('modal-open');
  document.body.classList.add('modal-active');
}

function closeModal(id) {
  document.getElementById(id).classList.remove('modal-open');
  document.body.classList.remove('modal-active');
}

// ── Confirm dialog ─────────────────────────────────────────────
function confirmAction(msg) {
  return confirm(msg);
}

// ── Copy food nutrition for a portion ─────────────────────────
function portionNutrition(food, amount, unit) {
  let grams = amount;
  if (unit === 'piece') {
    grams = amount * (food.piece_weight_g || food.default_portion_amount || 100);
  }
  const m = grams / 100;
  return {
    calories:      (food.calories      || 0) * m,
    protein_g:     (food.protein_g     || 0) * m,
    fat_g:         (food.fat_g         || 0) * m,
    mufa_g:        (food.mufa_g        || 0) * m,
    pufa_g:        (food.pufa_g        || 0) * m,
    omega3_g:      (food.omega3_g      || 0) * m,
    omega6_g:      (food.omega6_g      || 0) * m,
    sfa_g:         (food.sfa_g         || 0) * m,
    trans_fat_g:   (food.trans_fat_g   || 0) * m,
    net_carbs_g:   (food.net_carbs_g   || 0) * m,
    fiber_g:       (food.fiber_g       || 0) * m,
    glycemic_load: ((food.glycemic_index || 0) * (food.net_carbs_g || 0) * m) / 100,
  };
}
