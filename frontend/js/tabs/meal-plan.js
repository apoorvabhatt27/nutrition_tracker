const TabMealPlan = (() => {
  const MEAL_ORDER = ['breakfast', 'lunch', 'dinner', 'snack', 'extra'];
  let _activeAddMealType = null;
  let _searchResults = [];
  let _selectedPlanFood = null;

  async function init() {
    document.getElementById('btn-clear-plan').addEventListener('click', _clearPlan);
    _bindAddItemModal();
    await _load();
  }

  async function _load() {
    try {
      const [items, targets] = await Promise.all([API.getPlan(), API.getTargets().catch(() => null)]);
      _render(items, targets);
    } catch (e) {
      showToast('Failed to load plan: ' + e.message, 'error');
    }
  }

  // ── Sum all fields across an array of items ───────────────────
  function _sumItems(items) {
    const z = { calories: 0, protein_g: 0, fat_g: 0, mufa_g: 0, pufa_g: 0,
                omega3_g: 0, omega6_g: 0, sfa_g: 0, trans_fat_g: 0,
                fiber_g: 0, net_carbs_g: 0, glycemic_load: 0 };
    items.forEach(i => {
      for (const k in z) z[k] += (i[k] || 0);
    });
    for (const k in z) z[k] = Math.round(z[k] * 100) / 100;
    return z;
  }

  function _render(items, targets) {
    const grouped = {};
    MEAL_ORDER.forEach(mt => (grouped[mt] = []));
    items.forEach(item => {
      if (grouped[item.meal_type]) grouped[item.meal_type].push(item);
    });

    const el = document.getElementById('meal-plan-content');
    el.innerHTML = MEAL_ORDER.map(mt => `
      <div class="plan-section">
        <div class="plan-section-header">
          <span>${mealLabel(mt)}</span>
          <button class="btn-icon" onclick="TabMealPlan._openAdd('${mt}')">+ Add</button>
        </div>
        <div class="plan-items" id="plan-${mt}">
          ${grouped[mt].length
            ? grouped[mt].map(item => _itemHTML(item)).join('')
            : `<div class="plan-empty">Nothing planned</div>`}
        </div>
      </div>
    `).join('');

    // Append summary if there are any items
    if (items.length) _renderPlanSummary(el, _sumItems(items), targets);
  }

  // ── Planned Meal summary ──────────────────────────────────────

  function _renderPlanSummary(container, t, g) {
    const glLabel = g ? `${fmtInt(t.glycemic_load)} / ${g.gl_min}` : fmtInt(t.glycemic_load);
    const glProgress = g
      ? `<div class="progress-track"><div class="progress-fill${t.glycemic_load > g.gl_max ? ' over' : ''}" style="width:${Math.min((t.glycemic_load / g.gl_max) * 100, 100)}%"></div></div>`
      : `<div class="progress-track"><div class="progress-fill" style="width:0%"></div></div>`;

    const macroRows = [
      { label: 'Calories',  cur: fmtInt(t.calories),    tar: g ? fmtInt(g.calories)    : '—', unit: 'kcal', cur_n: t.calories,    tar_n: g?.calories    },
      { label: 'Protein',   cur: fmt(t.protein_g),      tar: g ? fmt(g.protein_g)      : '—', unit: 'g',    cur_n: t.protein_g,   tar_n: g?.protein_g   },
      { label: 'Net Carbs', cur: fmt(t.net_carbs_g),    tar: g ? fmt(g.net_carbs_g)    : '—', unit: 'g',    cur_n: t.net_carbs_g, tar_n: g?.net_carbs_g },
      { label: 'Fat',       cur: fmt(t.fat_g),          tar: g ? fmt(g.fat_g)          : '—', unit: 'g',    cur_n: t.fat_g,       tar_n: g?.fat_g       },
      { label: 'Fiber',     cur: fmt(t.fiber_g),        tar: g ? fmt(g.fiber_g)        : '—', unit: 'g',    cur_n: t.fiber_g,     tar_n: g?.fiber_g     },
    ];

    const fatRows = [
      { label: 'MUFA',      cur: t.mufa_g,      tar: g?.mufa_g      },
      { label: 'PUFA',      cur: t.pufa_g,      tar: g?.pufa_g      },
      { label: 'Omega-3',   cur: t.omega3_g,    tar: g?.omega3_g,    indent: true },
      { label: 'Omega-6',   cur: t.omega6_g,    tar: g?.omega6_g,    indent: true },
      { label: 'SFA',       cur: t.sfa_g,       tar: g?.sfa_g       },
      { label: 'Trans Fat', cur: t.trans_fat_g, tar: g?.trans_fat_g },
    ];

    const macroEl = document.createElement('div');
    macroEl.className = 'summary-card';
    macroEl.innerHTML = `
      <h3>Plan vs Target — Macros</h3>
      ${macroRows.map(r => `
        <div class="macro-row">
          <div class="macro-label">${r.label}</div>
          <div class="macro-values">${r.cur} / ${r.tar} ${r.unit}</div>
          ${r.tar_n ? progressBar(r.cur_n, r.tar_n) : '<div class="progress-track"><div class="progress-fill" style="width:0%"></div></div>'}
        </div>
      `).join('')}
      <div class="macro-row">
        <div class="macro-label">GL</div>
        <div class="macro-values">${glLabel}</div>
        ${glProgress}
      </div>
    `;
    container.appendChild(macroEl);

    const fatEl = document.createElement('div');
    fatEl.className = 'summary-card';
    fatEl.innerHTML = `
      <h3>Plan vs Target — Fat Breakdown</h3>
      ${fatRows.map(r => `
        <div class="macro-row${r.indent ? ' macro-row-indent' : ''}">
          <div class="macro-label">${r.indent ? '↳ ' : ''}${r.label}</div>
          <div class="macro-values">${fmt(r.cur)} / ${r.tar ? fmt(r.tar) : '—'} g</div>
          ${r.tar ? progressBar(r.cur, r.tar) : '<div class="progress-track"><div class="progress-fill" style="width:0%"></div></div>'}
        </div>
      `).join('')}
    `;
    container.appendChild(fatEl);
  }

  function _itemHTML(item) {
    return `
      <div class="plan-item">
        <button class="btn-remove-plan" onclick="TabMealPlan._removeItem('${item.id}')">×</button>
        <div class="plan-item-name">${item.food_name}</div>
        <div class="plan-item-portion">${item.portion_amount}${item.portion_unit}</div>
        <div class="plan-item-macros">
          ${chip('#FF5722', `${fmtInt(item.calories)} kcal`)}
          ${chip('#2196F3', `P: ${fmt(item.protein_g)}g`)}
          ${chip('#FF9800', `NC: ${fmt(item.net_carbs_g)}g`)}
          ${chip('#9C27B0', `Fat: ${fmt(item.fat_g)}g`)}
          ${chip('#4CAF50', `Fi: ${fmt(item.fiber_g)}g`)}
          ${chip('#FFC107', `GL: ${fmt(item.glycemic_load, 1)}`)}
        </div>
      </div>
    `;
  }

  function _openAdd(mealType) {
    _activeAddMealType = mealType;
    _selectedPlanFood = null;
    document.getElementById('plan-add-meal-type-label').textContent = mealLabel(mealType);
    document.getElementById('plan-search').value = '';
    document.getElementById('plan-search-results').innerHTML = '';
    document.getElementById('plan-search-results').classList.add('hidden');
    document.getElementById('plan-add-section').classList.add('hidden');
    document.getElementById('plan-portion-preview').innerHTML = '';
    openModal('modal-add-plan');
  }

  function _updatePlanPreview() {
    const el = document.getElementById('plan-portion-preview');
    if (!_selectedPlanFood) { el.innerHTML = ''; return; }
    const amount = parseFloat(document.getElementById('plan-amount').value) || 0;
    const unit   = document.getElementById('plan-unit').value;
    if (!amount) { el.innerHTML = ''; return; }
    const n = portionNutrition(_selectedPlanFood, amount, unit);
    el.innerHTML = `
      <div class="food-detail-grid" style="margin-top:10px;padding-top:10px;border-top:1px solid var(--border)">
        <div><b>Calories:</b> ${fmtInt(n.calories)} kcal</div>
        <div><b>Protein:</b> ${fmt(n.protein_g)}g</div>
        <div><b>Net Carbs:</b> ${fmt(n.net_carbs_g)}g</div>
        <div><b>Fiber:</b> ${fmt(n.fiber_g)}g</div>
        <div><b>Fat:</b> ${fmt(n.fat_g)}g</div>
        <div><b>GL:</b> ${fmt(n.glycemic_load, 1)}</div>
        <div><b>MUFA:</b> ${fmt(n.mufa_g)}g</div>
        <div><b>PUFA:</b> ${fmt(n.pufa_g)}g</div>
        <div><b>Omega-3:</b> ${fmt(n.omega3_g)}g</div>
        <div><b>Omega-6:</b> ${fmt(n.omega6_g)}g</div>
        <div><b>SFA:</b> ${fmt(n.sfa_g)}g</div>
        <div><b>Trans Fat:</b> ${fmt(n.trans_fat_g)}g</div>
      </div>
    `;
  }

  function _bindAddItemModal() {
    document.getElementById('btn-close-plan-modal').addEventListener('click', () => closeModal('modal-add-plan'));

    const input = document.getElementById('plan-search');
    const results = document.getElementById('plan-search-results');

    input.addEventListener('input', debounce(async e => {
      const q = e.target.value.trim();
      if (q.length < 2) { results.innerHTML = ''; results.classList.add('hidden'); return; }
      const foods = await API.searchFoods(q).catch(() => []);
      _searchResults = foods;
      results.innerHTML = foods.slice(0, 8).map((f, i) => `
        <div class="search-item" data-idx="${i}">
          <span class="food-tag ${tagClass(f.tag)}">${f.tag}</span>
          <span>${f.name}</span>
          <span class="search-cal">${fmtInt(f.calories)} kcal/100g</span>
        </div>
      `).join('') || '<div class="search-item">No results</div>';
      results.classList.remove('hidden');

      results.querySelectorAll('.search-item[data-idx]').forEach(el => {
        el.addEventListener('click', () => {
          const f = foods[parseInt(el.dataset.idx)];
          if (!f) return;
          document.getElementById('plan-search').value = f.name;
          document.getElementById('plan-selected-name').textContent = f.name;
          document.getElementById('plan-amount').value = f.default_portion_amount;

          // Only show 'piece' option for foods that have a defined piece weight
          const unitSelect = document.getElementById('plan-unit');
          unitSelect.innerHTML = f.piece_weight_g
            ? '<option value="g">g</option><option value="piece">piece</option>'
            : '<option value="g">g</option>';
          const unit = (f.default_portion_unit === 'ml' ||
                        (f.default_portion_unit === 'piece' && !f.piece_weight_g))
            ? 'g' : f.default_portion_unit;
          unitSelect.value = unit;

          document.getElementById('plan-food-id').value = f.id;
          document.getElementById('plan-add-section').classList.remove('hidden');
          results.classList.add('hidden');
          _selectedPlanFood = f;
          _updatePlanPreview();
        });
      });
    }, 300));

    document.getElementById('plan-amount').addEventListener('input',  _updatePlanPreview);
    document.getElementById('plan-unit').addEventListener('change', _updatePlanPreview);

    document.getElementById('btn-add-plan-item').addEventListener('click', async () => {
      const food_item_id = document.getElementById('plan-food-id').value;
      const amount = parseFloat(document.getElementById('plan-amount').value);
      const unit = document.getElementById('plan-unit').value;
      if (!food_item_id || !amount) { showToast('Select a food and enter amount.', 'error'); return; }
      try {
        await API.addPlanItem({
          food_item_id,
          meal_type: _activeAddMealType,
          portion_amount: amount,
          portion_unit: unit,
        });
        closeModal('modal-add-plan');
        await _load();
      } catch (e) {
        showToast('Failed: ' + e.message, 'error');
      }
    });
  }

  async function _removeItem(id) {
    try {
      await API.deletePlanItem(id);
      await _load();
    } catch (e) {
      showToast('Remove failed: ' + e.message, 'error');
    }
  }

  async function _clearPlan() {
    if (!confirmAction('Clear entire meal plan?')) return;
    try {
      await API.clearPlan();
      await _load();
      showToast('Plan cleared.', 'info');
    } catch (e) {
      showToast('Clear failed: ' + e.message, 'error');
    }
  }

  return { init, _openAdd, _removeItem };
})();
