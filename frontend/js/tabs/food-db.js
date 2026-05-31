const TabFoodDB = (() => {
  let _allFoods = [];
  let _activeTag = '';
  let _sortBy = 'name';
  let _sortDir = 'asc';

  async function init() {
    document.getElementById('food-db-search').addEventListener(
      'input',
      debounce(_search, 300)
    );
    document.getElementById('btn-add-custom-food').addEventListener('click', () => openModal('modal-add-food'));
    document.getElementById('btn-sort-foods').addEventListener('click', _toggleSortPanel);
    document.getElementById('food-tag-filter').addEventListener('change', e => {
      _activeTag = e.target.value;
      _load();
    });
    _bindSortButtons();
    _bindAddFoodModal();
    await _load();
  }

  async function _load() {
    const q = document.getElementById('food-db-search').value.trim() || undefined;
    try {
      _allFoods = await API.searchFoods(q, _activeTag || undefined, _sortBy, _sortDir);
      _render(_allFoods);
    } catch (e) {
      showToast('Failed to load foods: ' + e.message, 'error');
    }
  }

  async function _search(e) {
    _allFoods = await API.searchFoods(
      e.target.value.trim() || undefined,
      _activeTag || undefined,
      _sortBy,
      _sortDir
    ).catch(() => _allFoods);
    _render(_allFoods);
  }

  function _render(foods) {
    const list = document.getElementById('food-db-list');
    if (!foods.length) {
      list.innerHTML = emptyState('No foods found.');
      return;
    }
    list.innerHTML = foods.map(f => {
      // GL for the default portion: GI × net_carbs/100 × (portion_grams/100)
      // e.g. apple GI=54, net_carbs=11.6, 100g → 54 × 11.6/100 × 1 = 6.3
      const defaultGrams = f.default_portion_unit === 'piece'
        ? f.default_portion_amount * (f.piece_weight_g || 1)
        : f.default_portion_amount;
      const defaultGL = fmt((f.glycemic_index || 0) * (f.net_carbs_g || 0) / 100 * defaultGrams / 100, 1);

      return `
        <div class="food-card" data-id="${f.id}">
          <div class="food-card-header" onclick="TabFoodDB._toggleDetail('${f.id}')">
            <div class="food-card-main">
              <span class="food-tag ${tagClass(f.tag)}">${f.tag}</span>
              <span class="food-name">${f.name}</span>
              ${f.is_custom ? '<span class="badge-custom">Custom</span>' : ''}
            </div>
            <div class="food-macros-mini">
              ${(() => {
                const m    = defaultGrams / 100;
                const kcal = fmtInt(f.calories * m);
                const prot = fmt((f.protein_g || 0) * m);
                const nc   = fmt((f.net_carbs_g || 0) * m);
                const fat  = fmt((f.fat_g || 0) * m);
                const fi   = fmt((f.fiber_g || 0) * m);

                const chip = (color, text) =>
                  `<span style="display:inline-block;padding:2px 7px;border-radius:10px;font-size:0.72rem;font-weight:600;background:${color}22;color:${color};border:1px solid ${color}55;margin:2px 2px 2px 0;white-space:nowrap">${text}</span>`;

                const portionChips = f.default_portion_unit === 'piece'
                  ? chip('#607D8B', `${defaultGrams} g`)
                  : chip('#607D8B', `${f.default_portion_amount} ${f.default_portion_unit}`);

                return chip('#FF5722', `${kcal} kcal`)
                     + chip('#2196F3', `P: ${prot}g`)
                     + chip('#FF9800', `NC: ${nc}g`)
                     + chip('#9C27B0', `Fat: ${fat}g`)
                     + chip('#4CAF50', `Fi: ${fi}g`)
                     + portionChips;
              })()}
            </div>
          </div>
          <div class="food-card-detail hidden" id="food-detail-${f.id}">
            <div class="food-detail-grid">
              <div><b>Protein:</b> ${fmt((f.protein_g || 0) * defaultGrams / 100)}g</div>
              <div><b>Fiber:</b> ${fmt((f.fiber_g || 0) * defaultGrams / 100)}g</div>
              <div><b>Net Carbs:</b> ${fmt((f.net_carbs_g || 0) * defaultGrams / 100)}g</div>
              <div><b>Fat:</b> ${fmt((f.fat_g || 0) * defaultGrams / 100)}g</div>
              <div><b>GL:</b> ${defaultGL}</div>
              <div><b>MUFA:</b> ${fmt((f.mufa_g || 0) * defaultGrams / 100)}g</div>
              <div><b>PUFA:</b> ${fmt((f.pufa_g || 0) * defaultGrams / 100)}g</div>
              <div><b>Omega-3:</b> ${fmt((f.omega3_g || 0) * defaultGrams / 100)}g</div>
              <div><b>Omega-6:</b> ${fmt((f.omega6_g || 0) * defaultGrams / 100)}g</div>
              <div><b>SFA:</b> ${fmt((f.sfa_g || 0) * defaultGrams / 100)}g</div>
              <div><b>Trans:</b> ${fmt((f.trans_fat_g || 0) * defaultGrams / 100)}g</div>
              ${f.default_portion_unit === 'piece' ? `<div><b>Default:</b> ${f.default_portion_amount} ${f.default_portion_amount === 1 ? 'piece' : 'pieces'}</div>` : ''}
            </div>
            ${f.cooking_assumptions ? `<p class="cooking-notes"><em>${f.cooking_assumptions}</em></p>` : ''}
            ${f.is_custom ? `
              <div class="food-card-actions">
                <button class="btn-text btn-danger" onclick="TabFoodDB._deleteFood('${f.id}')">Delete</button>
              </div>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');
  }

  function _toggleDetail(id) {
    const el = document.getElementById(`food-detail-${id}`);
    el.classList.toggle('hidden');
  }

  function _toggleSortPanel() {
    document.getElementById('sort-panel').classList.toggle('hidden');
  }

  function _bindSortButtons() {
    document.querySelectorAll('[data-sort]').forEach(btn => {
      btn.addEventListener('click', () => {
        const field = btn.dataset.sort;
        if (_sortBy === field) {
          _sortDir = _sortDir === 'asc' ? 'desc' : 'asc';
        } else {
          _sortBy = field;
          _sortDir = 'asc';
        }
        document.getElementById('sort-panel').classList.add('hidden');
        _load();
      });
    });
  }

  function _bindAddFoodModal() {
    document.getElementById('btn-close-add-food').addEventListener('click', () => closeModal('modal-add-food'));
    document.getElementById('form-add-food').addEventListener('submit', async e => {
      e.preventDefault();
      const f = e.target;
      const payload = {
        name: f.name.value.trim(),
        tag: f.tag.value,
        calories: parseFloat(f.calories.value) || 0,
        protein_g: parseFloat(f.protein_g.value) || 0,
        fat_g: parseFloat(f.fat_g.value) || 0,
        mufa_g: parseFloat(f.mufa_g.value) || 0,
        pufa_g: parseFloat(f.pufa_g.value) || 0,
        omega3_g: parseFloat(f.omega3_g.value) || 0,
        omega6_g: parseFloat(f.omega6_g.value) || 0,
        sfa_g: parseFloat(f.sfa_g.value) || 0,
        trans_fat_g: parseFloat(f.trans_fat_g.value) || 0,
        fiber_g: parseFloat(f.fiber_g.value) || 0,
        net_carbs_g: parseFloat(f.net_carbs_g.value) || 0,
        glycemic_index: parseInt(f.glycemic_index.value) || 0,
        default_portion_unit: f.default_portion_unit.value,
        default_portion_amount: parseFloat(f.default_portion_amount.value) || 100,
        piece_weight_g: parseFloat(f.piece_weight_g.value) || null,
        cooking_assumptions: f.cooking_assumptions.value.trim() || null,
      };
      const btn = e.target.querySelector('button[type=submit]');
      btn.disabled = true; btn.textContent = 'Adding…';
      try {
        await API.addFood(payload);
        closeModal('modal-add-food');
        f.reset();
        showToast('Food added!', 'success');
        _load();
      } catch (err) {
        showToast('Failed: ' + err.message, 'error');
      } finally {
        btn.disabled = false; btn.textContent = 'Add Food';
      }
    });
  }

  async function _deleteFood(id) {
    if (!confirmAction('Delete this food item?')) return;
    try {
      await API.deleteFood(id);
      showToast('Food deleted.', 'info');
      _load();
    } catch (e) {
      showToast('Delete failed: ' + e.message, 'error');
    }
  }

  return { init, _toggleDetail, _deleteFood };
})();
