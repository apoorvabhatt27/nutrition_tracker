const TabTargets = (() => {
  const ACTIVITY = [
    { value: 1.2,   label: 'Sedentary (little/no exercise)' },
    { value: 1.375, label: 'Lightly Active (1–3 days/week)' },
    { value: 1.55,  label: 'Moderately Active (3–5 days/week)' },
    { value: 1.725, label: 'Very Active (6–7 days/week)' },
    { value: 1.9,   label: 'Extra Active (physical job + exercise)' },
  ];

  let _calculated = null;
  let _current    = null;

  async function init() {
    _buildActivityOptions();
    document.getElementById('btn-calculate-targets').addEventListener('click', _calculate);
    document.getElementById('btn-save-targets').addEventListener('click', _save);
    await _load();
  }

  function _buildActivityOptions() {
    const sel = document.getElementById('target-activity');
    ACTIVITY.forEach(a => {
      const opt = document.createElement('option');
      opt.value = a.value;
      opt.textContent = a.label;
      sel.appendChild(opt);
    });
  }

  // ── Load & pre-populate ──────────────────────────────────────

  async function _load() {
    try {
      _current = await API.getTargets();
      if (_current) _populateForm(_current);
      _renderCurrentTargets(_current);
    } catch (e) {
      console.error('Failed to load targets', e);
    }
  }

  function _populateForm(t) {
    if (t.age)            document.getElementById('target-age').value      = t.age;
    if (t.sex)            document.getElementById('target-sex').value      = t.sex;
    if (t.height_cm)      document.getElementById('target-height').value   = t.height_cm;
    if (t.weight_kg)      document.getElementById('target-weight').value   = t.weight_kg;
    if (t.activity_level) document.getElementById('target-activity').value = t.activity_level;
    if (t.is_vegetarian)  document.getElementById('target-vegetarian').checked = t.is_vegetarian;
  }

  // ── Calculate ────────────────────────────────────────────────

  async function _calculate() {
    const inputs = _readInputs();
    if (!inputs) return;

    const btn = document.getElementById('btn-calculate-targets');
    btn.disabled = true; btn.textContent = 'Calculating…';
    try {
      _calculated = await API.calculateTargets(inputs);
      _fillCalcResults(_calculated);
      document.getElementById('targets-result-section').classList.remove('hidden');
      showToast('Targets calculated — edit if needed, then save.', 'info');
    } catch (e) {
      showToast('Calculation failed: ' + e.message, 'error');
    } finally {
      btn.disabled = false; btn.textContent = 'Calculate Targets';
    }
  }

  // ── Save ─────────────────────────────────────────────────────

  async function _save() {
    const payload = _readResultFields();
    if (!payload) { showToast('Please calculate targets first.', 'error'); return; }
    const inputs = _readInputs();
    if (!inputs) return;

    const btn = document.getElementById('btn-save-targets');
    btn.disabled = true; btn.textContent = 'Saving…';
    try {
      _current = await API.saveTargets({ ...inputs, ...payload });
      showToast('Targets saved!', 'success');
      _renderCurrentTargets(_current);
    } catch (e) {
      showToast('Save failed: ' + e.message, 'error');
    } finally {
      btn.disabled = false; btn.textContent = 'Save Targets';
    }
  }

  // ── Read form inputs ─────────────────────────────────────────

  function _readInputs() {
    const age                  = parseInt(document.getElementById('target-age').value);
    const sex                  = document.getElementById('target-sex').value;
    const height_cm            = parseFloat(document.getElementById('target-height').value);
    const weight_kg            = parseFloat(document.getElementById('target-weight').value);
    const target_weight_kg     = parseFloat(document.getElementById('target-weight-goal').value);
    const target_duration_weeks = parseInt(document.getElementById('target-duration').value);
    const activity_level       = parseFloat(document.getElementById('target-activity').value);
    const is_vegetarian        = document.getElementById('target-vegetarian').checked;
    const diabetes             = document.getElementById('target-diabetes').checked;
    const pcos                 = document.getElementById('target-pcos').checked;

    if (!age || !sex || !height_cm || !weight_kg || !target_weight_kg || !target_duration_weeks || !activity_level) {
      showToast('Please fill in all required fields (age, sex, height, current weight, target weight, duration, activity).', 'error');
      return null;
    }
    return {
      age, sex, height_cm, weight_kg,
      target_weight_kg, target_duration_weeks,
      activity_level, is_vegetarian, diabetes, pcos,
    };
  }

  // ── Fill calculated result fields ────────────────────────────

  function _fillCalcResults(t) {
    document.getElementById('res-calories').value   = t.calories;
    document.getElementById('res-protein').value    = t.protein_g;
    document.getElementById('res-fat').value        = t.fat_g;
    document.getElementById('res-fiber').value      = t.fiber_g;
    document.getElementById('res-net-carbs').value  = t.net_carbs_g;
    document.getElementById('res-gl-target').value  = t.gl_min;  // gl_min === gl_max
    document.getElementById('res-mufa').value       = t.mufa_g;
    document.getElementById('res-pufa').value       = t.pufa_g;
    document.getElementById('res-omega3').value     = t.omega3_g;
    document.getElementById('res-omega6').value     = t.omega6_g;
    document.getElementById('res-sfa').value        = t.sfa_g;
    document.getElementById('res-trans').value      = t.trans_fat_g;

    // Weekly change summary
    const rateEl = document.getElementById('target-rate-info');
    if (t.weekly_change_kg !== undefined) {
      const dir   = t.direction === 'losing' ? '▼ losing' : t.direction === 'gaining' ? '▲ gaining' : '→ maintaining';
      const rate  = t.direction === 'maintaining'
        ? 'No weight change expected.'
        : `${dir} ~${t.weekly_change_kg} kg/week`;
      rateEl.textContent = rate;
      rateEl.className = 'target-rate-info ' + (t.direction === 'losing' ? 'rate-loss' : t.direction === 'gaining' ? 'rate-gain' : 'rate-maintain');
    }

    // Warnings
    const warnEl = document.getElementById('target-warnings');
    if (t.warnings && t.warnings.length) {
      warnEl.innerHTML = t.warnings.map(w => `<div class="warn-item">⚠️ ${w}</div>`).join('');
      warnEl.classList.remove('hidden');
    } else {
      warnEl.innerHTML = '';
      warnEl.classList.add('hidden');
    }
  }

  // ── Read editable result fields ──────────────────────────────

  function _readResultFields() {
    const get  = (id) => parseFloat(document.getElementById(id).value);
    const getI = (id) => parseInt(document.getElementById(id).value);
    const glTarget = getI('res-gl-target');
    return {
      calories:    getI('res-calories'),
      protein_g:   get('res-protein'),
      fat_g:       get('res-fat'),
      fiber_g:     get('res-fiber'),
      net_carbs_g: get('res-net-carbs'),
      gl_min:      glTarget,
      gl_max:      glTarget,
      mufa_g:      get('res-mufa'),
      pufa_g:      get('res-pufa'),
      omega3_g:    get('res-omega3'),
      omega6_g:    get('res-omega6'),
      sfa_g:       get('res-sfa'),
      trans_fat_g: get('res-trans'),
    };
  }

  // ── Render current saved targets ─────────────────────────────

  function _renderCurrentTargets(t) {
    const el = document.getElementById('current-targets-display');
    if (!t) {
      el.innerHTML = '<p class="text-muted">No targets set yet.</p>';
      return;
    }

    const glLabel = t.gl_min === t.gl_max ? `${t.gl_min}` : `${t.gl_min}–${t.gl_max}`;

    el.innerHTML = `
      <div class="target-grid">
        <div class="target-card"><span class="target-val">${fmtInt(t.calories)}</span><span class="target-lbl">kcal</span></div>
        <div class="target-card"><span class="target-val">${fmt(t.protein_g)}</span><span class="target-lbl">Protein (g)</span></div>
        <div class="target-card"><span class="target-val">${fmt(t.net_carbs_g)}</span><span class="target-lbl">Net Carbs (g)</span></div>
        <div class="target-card"><span class="target-val">${fmt(t.fat_g)}</span><span class="target-lbl">Fat (g)</span></div>
        <div class="target-card"><span class="target-val">${fmt(t.fiber_g)}</span><span class="target-lbl">Fiber (g)</span></div>
        <div class="target-card"><span class="target-val">${glLabel}</span><span class="target-lbl">GL</span></div>
      </div>
      <div class="fat-breakdown-grid mt-2">
        <span class="fat-lbl">MUFA: <b>${fmt(t.mufa_g)}g</b></span>
        <span class="fat-lbl">PUFA: <b>${fmt(t.pufa_g)}g</b> (Ω-3: ${fmt(t.omega3_g)}g, Ω-6: ${fmt(t.omega6_g)}g)</span>
        <span class="fat-lbl">SFA: <b>${fmt(t.sfa_g)}g</b></span>
        <span class="fat-lbl">Trans Fat max: <b>${fmt(t.trans_fat_g)}g</b></span>
      </div>
    `;
  }

  return { init };
})();
