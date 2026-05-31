const TabMealLog = (() => {
  let _searchResults = [];
  let _selectedFood = null;
  let _todayData = null;

  async function init() {
    _bindSearch();
    _bindAddForm();
    document.getElementById('btn-clear-food').addEventListener('click', _clearSelected);
    await refresh();
  }

  function _clearSelected() {
    _selectedFood = null;
    document.getElementById('log-search').value = '';
    document.getElementById('log-search-results').innerHTML = '';
    document.getElementById('log-search-results').classList.add('hidden');
    document.getElementById('log-add-section').classList.add('hidden');
    document.getElementById('log-portion-preview').innerHTML = '';
  }

  async function refresh() {
    try {
      _todayData = await API.getTodayLog();
      _renderSummary(_todayData);
      _renderEntries(_todayData.entries);
    } catch (e) {
      showToast('Failed to load today\'s log: ' + e.message, 'error');
    }
  }

  // ── Search ────────────────────────────────────────────────────

  function _bindSearch() {
    const input = document.getElementById('log-search');
    const results = document.getElementById('log-search-results');

    input.addEventListener('input', debounce(async e => {
      const q = e.target.value.trim();
      if (q.length < 2) { results.innerHTML = ''; results.classList.add('hidden'); return; }
      let foods = [];
      try {
        foods = await API.searchFoods(q);
      } catch (err) {
        showToast('Search failed — is the backend running? ' + err.message, 'error');
        return;
      }
      _searchResults = foods;
      if (!foods.length) {
        results.innerHTML = '<div class="search-item">No results</div>';
      } else {
        results.innerHTML = foods.slice(0, 8).map((f, i) => `
          <div class="search-item" data-idx="${i}">
            <span class="food-tag ${tagClass(f.tag)}">${f.tag}</span>
            <span>${f.name}</span>
            <span class="search-cal">${fmtInt(f.calories)} kcal/100g</span>
          </div>
        `).join('');
      }
      results.classList.remove('hidden');

      results.querySelectorAll('.search-item').forEach(el => {
        el.addEventListener('mousedown', (e) => {
          e.preventDefault(); // prevent input blur before selection registers
          const idx = parseInt(el.dataset.idx);
          if (isNaN(idx)) return;
          _selectFood(foods[idx]);
          results.innerHTML = '';
          results.classList.add('hidden');
        });
      });
    }, 300));

    document.addEventListener('click', e => {
      if (!e.target.closest('#log-search-wrapper')) {
        results.classList.add('hidden');
      }
    });
  }

  function _selectFood(food) {
    _selectedFood = food;
    document.getElementById('log-search').value = food.name;
    document.getElementById('log-selected-food').textContent = food.name;
    document.getElementById('log-add-section').classList.remove('hidden');

    // Only show 'piece' option for foods that have a defined piece weight
    const unitSelect = document.getElementById('log-unit');
    unitSelect.innerHTML = food.piece_weight_g
      ? '<option value="g">g</option><option value="piece">piece</option>'
      : '<option value="g">g</option>';

    // Map 'ml' → 'g'; also fall back to 'g' if default is 'piece' but no piece weight
    const unit = (food.default_portion_unit === 'ml' ||
                  (food.default_portion_unit === 'piece' && !food.piece_weight_g))
      ? 'g' : food.default_portion_unit;
    unitSelect.value = unit;
    document.getElementById('log-amount').value = food.default_portion_amount;
    _updatePortionPreview();
  }

  function _bindAddForm() {
    document.getElementById('log-amount').addEventListener('input', _updatePortionPreview);
    document.getElementById('log-unit').addEventListener('change', _updatePortionPreview);
    document.getElementById('btn-add-to-log').addEventListener('click', _addToLog);
  }

  function _updatePortionPreview() {
    if (!_selectedFood) return;
    const amount = parseFloat(document.getElementById('log-amount').value) || 0;
    const unit = document.getElementById('log-unit').value;
    const n = portionNutrition(_selectedFood, amount, unit);
    document.getElementById('log-portion-preview').innerHTML = `
      <span>${fmtInt(n.calories)} kcal</span>
      <span>P: ${fmt(n.protein_g)}g</span>
      <span>C: ${fmt(n.net_carbs_g)}g</span>
      <span>F: ${fmt(n.fat_g)}g</span>
    `;
  }

  async function _addToLog() {
    if (!_selectedFood) { showToast('Select a food first.', 'error'); return; }
    const amount = parseFloat(document.getElementById('log-amount').value);
    const unit = document.getElementById('log-unit').value;
    const meal_type = document.getElementById('log-meal-type').value;
    if (!amount || amount <= 0) { showToast('Enter a valid amount.', 'error'); return; }

    const btn = document.getElementById('btn-add-to-log');
    btn.disabled = true; btn.textContent = 'Adding…';
    try {
      await API.addLog({
        food_item_id: _selectedFood.id,
        meal_type,
        portion_amount: amount,
        portion_unit: unit,
      });
      // Reset form
      _clearSelected();
      showToast('Added to log!', 'success');
      await refresh();
    } catch (e) {
      showToast('Failed: ' + e.message, 'error');
    } finally {
      btn.disabled = false; btn.textContent = 'Add to Log';
    }
  }

  // ── Render summary ────────────────────────────────────────────

  function _renderSummary(data) {
    const t = data.totals;
    const g = data.target;
    _renderSection1(t, g);
    _renderSection2(t, g);
  }

  function _renderSection1(t, g) {
    const el = document.getElementById('log-summary-macros');
    const rows = [
      { label: 'Calories', cur: fmtInt(t.calories), tar: g ? fmtInt(g.calories) : '—', unit: 'kcal', cur_n: t.calories,    tar_n: g?.calories    },
      { label: 'Protein',  cur: fmt(t.protein_g),   tar: g ? fmt(g.protein_g)   : '—', unit: 'g',    cur_n: t.protein_g,   tar_n: g?.protein_g   },
      { label: 'Net Carbs',cur: fmt(t.net_carbs_g), tar: g ? fmt(g.net_carbs_g) : '—', unit: 'g',    cur_n: t.net_carbs_g, tar_n: g?.net_carbs_g },
      { label: 'Fat',      cur: fmt(t.fat_g),       tar: g ? fmt(g.fat_g)       : '—', unit: 'g',    cur_n: t.fat_g,       tar_n: g?.fat_g       },
      { label: 'Fiber',    cur: fmt(t.fiber_g),     tar: g ? fmt(g.fiber_g)     : '—', unit: 'g',    cur_n: t.fiber_g,     tar_n: g?.fiber_g     },
    ];

    const glLabel = g ? `${fmtInt(t.glycemic_load)} / ${g.gl_min}` : fmtInt(t.glycemic_load);

    el.innerHTML = `
      ${rows.map(r => `
        <div class="macro-row">
          <div class="macro-label">${r.label}</div>
          <div class="macro-values">${r.cur} / ${r.tar} ${r.unit}</div>
          ${r.tar_n ? progressBar(r.cur_n, r.tar_n) : '<div class="progress-track"><div class="progress-fill" style="width:0%"></div></div>'}
        </div>
      `).join('')}
      <div class="macro-row">
        <div class="macro-label">GL</div>
        <div class="macro-values">${glLabel}</div>
        ${g ? `
          <div class="progress-track">
            <div class="progress-fill ${t.glycemic_load > g.gl_max ? 'over' : ''}"
                 style="width:${Math.min((t.glycemic_load / g.gl_max) * 100, 100)}%"></div>
          </div>` : '<div class="progress-track"><div class="progress-fill" style="width:0%"></div></div>'}
      </div>
    `;
  }

  function _renderSection2(t, g) {
    const el = document.getElementById('log-summary-fats');
    const rows = [
      { label: 'MUFA',      cur: t.mufa_g,      tar: g?.mufa_g      },
      { label: 'PUFA',      cur: t.pufa_g,      tar: g?.pufa_g      },
      { label: 'Omega-3',   cur: t.omega3_g,    tar: g?.omega3_g,    indent: true },
      { label: 'Omega-6',   cur: t.omega6_g,    tar: g?.omega6_g,    indent: true },
      { label: 'SFA',       cur: t.sfa_g,       tar: g?.sfa_g       },
      { label: 'Trans Fat', cur: t.trans_fat_g, tar: g?.trans_fat_g },
    ];
    el.innerHTML = rows.map(r => `
      <div class="macro-row${r.indent ? ' macro-row-indent' : ''}">
        <div class="macro-label">${r.indent ? '↳ ' : ''}${r.label}</div>
        <div class="macro-values">${fmt(r.cur)} / ${r.tar ? fmt(r.tar) : '—'} g</div>
        ${r.tar ? progressBar(r.cur, r.tar) : '<div class="progress-track"><div class="progress-fill" style="width:0%"></div></div>'}
      </div>
    `).join('');
  }

  // ── Render entry list ─────────────────────────────────────────

  function _renderEntries(entries) {
    const el = document.getElementById('log-entries');
    if (!entries || !entries.length) {
      el.innerHTML = emptyState('No meals logged today.');
      return;
    }

    const grouped = {};
    entries.forEach(e => {
      grouped[e.meal_type] = grouped[e.meal_type] || [];
      grouped[e.meal_type].push(e);
    });

    const order = ['breakfast', 'lunch', 'dinner', 'snack', 'extra'];
    el.innerHTML = order
      .filter(t => grouped[t])
      .map(mt => `
        <div class="meal-group">
          <div class="meal-group-header">${mealLabel(mt)}</div>
          ${grouped[mt].map(entry => _entryHTML(entry)).join('')}
        </div>
      `).join('');
  }

  function _entryHTML(e) {
    return `
      <div class="log-entry" id="log-entry-${e.id}">
        <div class="log-entry-top">
          <span class="log-entry-name">${e.food_name}</span>
          <span class="log-entry-portion">${e.portion_amount}${e.portion_unit}</span>
        </div>
        <div class="log-entry-macros">
          ${chip('#FF5722', `${fmtInt(e.calories)} kcal`)}
          ${chip('#2196F3', `P: ${fmt(e.protein_g)}g`)}
          ${chip('#FF9800', `NC: ${fmt(e.net_carbs_g)}g`)}
          ${chip('#9C27B0', `Fat: ${fmt(e.fat_g)}g`)}
          ${chip('#4CAF50', `Fi: ${fmt(e.fiber_g)}g`)}
          ${chip('#FFC107', `GL: ${fmt(e.glycemic_load, 1)}`)}
        </div>
        <div class="log-entry-actions">
          <button class="btn-text btn-sm" onclick="TabMealLog._editEntry('${e.id}')">Edit</button>
          <button class="btn-text btn-sm" onclick="TabMealLog._reassignEntry('${e.id}')">Reassign</button>
          <button class="btn-text btn-danger btn-sm" onclick="TabMealLog._deleteEntry('${e.id}')">Remove</button>
        </div>
        <div class="log-edit-form hidden" id="edit-${e.id}">
          <input type="number" id="edit-amount-${e.id}" value="${e.portion_amount}" min="1" step="0.5" style="width:80px">
          <select id="edit-unit-${e.id}">
            <option value="g" ${e.portion_unit !== 'piece' ? 'selected' : ''}>g</option>
            <option value="piece" ${e.portion_unit === 'piece' ? 'selected' : ''}>piece</option>
          </select>
          <button class="btn-sm btn-primary" onclick="TabMealLog._saveEdit('${e.id}')">Save</button>
          <button class="btn-sm" onclick="TabMealLog._cancelEdit('${e.id}')">Cancel</button>
        </div>
        <div class="log-reassign-form hidden" id="reassign-${e.id}">
          <select id="reassign-type-${e.id}">
            ${['breakfast','lunch','dinner','snack','extra'].map(mt =>
              `<option value="${mt}" ${e.meal_type === mt ? 'selected' : ''}>${mealLabel(mt)}</option>`
            ).join('')}
          </select>
          <button class="btn-sm btn-primary" onclick="TabMealLog._saveReassign('${e.id}')">Save</button>
          <button class="btn-sm" onclick="TabMealLog._cancelReassign('${e.id}')">Cancel</button>
        </div>
      </div>
    `;
  }

  function _editEntry(id) {
    document.getElementById(`edit-${id}`).classList.toggle('hidden');
    document.getElementById(`reassign-${id}`).classList.add('hidden');
  }

  function _cancelEdit(id) {
    document.getElementById(`edit-${id}`).classList.add('hidden');
  }

  function _reassignEntry(id) {
    document.getElementById(`reassign-${id}`).classList.toggle('hidden');
    document.getElementById(`edit-${id}`).classList.add('hidden');
  }

  function _cancelReassign(id) {
    document.getElementById(`reassign-${id}`).classList.add('hidden');
  }

  async function _saveEdit(id) {
    const amount = parseFloat(document.getElementById(`edit-amount-${id}`).value);
    const unit = document.getElementById(`edit-unit-${id}`).value;
    if (!amount || amount <= 0) { showToast('Invalid amount.', 'error'); return; }
    try {
      await API.updateLog(id, { portion_amount: amount, portion_unit: unit });
      showToast('Updated!', 'success');
      await refresh();
    } catch (e) {
      showToast('Update failed: ' + e.message, 'error');
    }
  }

  async function _saveReassign(id) {
    const meal_type = document.getElementById(`reassign-type-${id}`).value;
    try {
      await API.updateLog(id, { meal_type });
      showToast('Reassigned!', 'success');
      await refresh();
    } catch (e) {
      showToast('Reassign failed: ' + e.message, 'error');
    }
  }

  async function _deleteEntry(id) {
    if (!confirmAction('Remove this entry?')) return;
    try {
      await API.deleteLog(id);
      showToast('Entry removed.', 'info');
      await refresh();
    } catch (e) {
      showToast('Delete failed: ' + e.message, 'error');
    }
  }

  return {
    init, refresh,
    _editEntry, _cancelEdit, _saveEdit,
    _reassignEntry, _cancelReassign, _saveReassign,
    _deleteEntry,
  };
})();
