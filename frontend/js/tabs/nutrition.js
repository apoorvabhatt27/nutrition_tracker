const TabNutrition = (() => {
  let _pieChart   = null;
  let _lineCharts = [];

  // Metrics for the 8 separate line charts
  const LINE_METRICS = [
    { id: 'calories', label: 'Calories',  unit: 'kcal', key: 'calories',      color: '#FF5722' },
    { id: 'protein',  label: 'Protein',   unit: 'g',    key: 'protein_g',     color: '#2196F3' },
    { id: 'fiber',    label: 'Fiber',     unit: 'g',    key: 'fiber_g',       color: '#4CAF50' },
    { id: 'netcarbs', label: 'Net Carbs', unit: 'g',    key: 'net_carbs_g',   color: '#FF9800' },
    { id: 'mufa',     label: 'MUFA',      unit: 'g',    key: 'mufa_g',        color: '#9C27B0' },
    { id: 'pufa',     label: 'PUFA',      unit: 'g',    key: 'pufa_g',        color: '#009688' },
    { id: 'omega3',   label: 'Omega-3',   unit: 'g',    key: 'omega3_g',      color: '#00BCD4' },
    { id: 'omega6',   label: 'Omega-6',   unit: 'g',    key: 'omega6_g',      color: '#E91E63' },
    { id: 'sfa',      label: 'SFA',       unit: 'g',    key: 'sfa_g',         color: '#F44336' },
    { id: 'transfat', label: 'Trans Fat', unit: 'g',    key: 'trans_fat_g',   color: '#795548' },
    { id: 'gl',       label: 'GL',        unit: '',     key: 'glycemic_load', color: '#FFC107' },
  ];

  async function init() {
    const today = todayStr();
    const week  = new Date(Date.now() - 6 * 86400000).toISOString().split('T')[0];
    document.getElementById('nutr-start').value = week;
    document.getElementById('nutr-end').value   = today;

    document.getElementById('btn-nutr-load').addEventListener('click', _load);
    await _load();
  }

  async function _load() {
    const start_date = document.getElementById('nutr-start').value;
    const end_date   = document.getElementById('nutr-end').value;
    if (!start_date || !end_date) { showToast('Select a date range.', 'error'); return; }

    const el = document.getElementById('nutr-content');
    el.innerHTML = spinnerHTML();

    try {
      const data = await API.getSummary({ start_date, end_date });
      _render(data);
    } catch (e) {
      el.innerHTML = emptyState('Failed to load data.');
      showToast(e.message, 'error');
    }
  }

  // ── Render ──────────────────────────────────────────────────

  function _render(data) {
    const el = document.getElementById('nutr-content');

    if (data.days_with_data === 0) {
      el.innerHTML = emptyState('No data for this period.');
      return;
    }

    el.innerHTML = `
      <p class="nutr-meta">
        ${friendlyDate(data.start_date)} – ${friendlyDate(data.end_date)}
        &nbsp;·&nbsp; ${data.days_with_data} day(s) with data
      </p>

      <div class="nutr-averages-card">
        <h3 class="section-title">Daily Averages vs Targets</h3>
        <div id="nutr-averages"></div>
      </div>

      <h3 class="section-title">Macronutrient Distribution</h3>
      <div class="chart-container chart-pie-wrap">
        <canvas id="chart-pie"></canvas>
      </div>

      <details class="trend-details" id="trend-details-all">
        <summary class="section-title trend-summary">Daily Trends ▸</summary>
        <div id="trend-charts-inner"></div>
      </details>
    `;

    _renderAverages(data.avg, data.target);
    _drawPie(data.avg);

    // Lazily draw line charts when section is opened
    const trendDetails = document.getElementById('trend-details-all');
    trendDetails.addEventListener('toggle', () => {
      if (trendDetails.open) {
        _renderAllLineCharts(data.daily);
      } else {
        _destroyLineCharts();
        document.getElementById('trend-charts-inner').innerHTML = '';
      }
    });
  }

  // ── Averages table ───────────────────────────────────────────

  function _renderAverages(avg, t) {
    const rows = [
      { label: 'Calories',  val: fmtInt(avg.calories),      tar: t ? fmtInt(t.calories)       : '—', unit: 'kcal', n: avg.calories,      tn: t?.calories },
      { label: 'Protein',   val: fmt(avg.protein_g),        tar: t ? fmt(t.protein_g)         : '—', unit: 'g',    n: avg.protein_g,     tn: t?.protein_g },
      { label: 'Net Carbs', val: fmt(avg.net_carbs_g),      tar: t ? fmt(t.net_carbs_g)       : '—', unit: 'g',    n: avg.net_carbs_g,   tn: t?.net_carbs_g },
      { label: 'Fat',       val: fmt(avg.fat_g),            tar: t ? fmt(t.fat_g)             : '—', unit: 'g',    n: avg.fat_g,         tn: t?.fat_g },
      { label: 'MUFA',      val: fmt(avg.mufa_g),           tar: t ? fmt(t.mufa_g)            : '—', unit: 'g',    n: avg.mufa_g,        tn: t?.mufa_g },
      { label: 'PUFA',      val: fmt(avg.pufa_g),           tar: t ? fmt(t.pufa_g)            : '—', unit: 'g',    n: avg.pufa_g,        tn: t?.pufa_g },
      { label: 'Omega-3',   val: fmt(avg.omega3_g),         tar: t ? fmt(t.omega3_g)          : '—', unit: 'g',    n: avg.omega3_g,      tn: t?.omega3_g,      indent: true },
      { label: 'Omega-6',   val: fmt(avg.omega6_g),         tar: t ? fmt(t.omega6_g)          : '—', unit: 'g',    n: avg.omega6_g,      tn: t?.omega6_g,      indent: true },
      { label: 'SFA',       val: fmt(avg.sfa_g),            tar: t ? fmt(t.sfa_g)             : '—', unit: 'g',    n: avg.sfa_g,         tn: t?.sfa_g },
      { label: 'Trans Fat', val: fmt(avg.trans_fat_g),      tar: t ? fmt(t.trans_fat_g)       : '—', unit: 'g',    n: avg.trans_fat_g,   tn: t?.trans_fat_g },
      { label: 'Fiber',     val: fmt(avg.fiber_g),          tar: t ? fmt(t.fiber_g)           : '—', unit: 'g',    n: avg.fiber_g,       tn: t?.fiber_g },
      { label: 'GL',        val: fmtInt(avg.glycemic_load), tar: t ? `${t.gl_min}`            : '—', unit: '',     n: avg.glycemic_load, tn: t?.gl_max },
    ];

    document.getElementById('nutr-averages').innerHTML = rows.map(r => `
      <div class="macro-row${r.indent ? ' macro-row-indent' : ''}">
        <div class="macro-label">${r.indent ? '↳ ' : ''}${r.label}</div>
        <div class="macro-values">${r.val} / ${r.tar} ${r.unit}</div>
        ${r.tn ? progressBar(r.n, r.tn) : '<div class="progress-track"><div class="progress-fill" style="width:0%"></div></div>'}
      </div>
    `).join('');
  }

  // ── Pie chart ────────────────────────────────────────────────

  function _drawPie(avg) {
    const segments = [
      { label: 'Protein',   value: avg.protein_g   || 0, color: '#2196F3' },
      { label: 'Fiber',     value: avg.fiber_g     || 0, color: '#4CAF50' },
      { label: 'Net Carbs', value: avg.net_carbs_g || 0, color: '#FF9800' },
      { label: 'MUFA',      value: avg.mufa_g      || 0, color: '#9C27B0' },
      { label: 'PUFA',      value: avg.pufa_g      || 0, color: '#009688' },
      { label: 'SFA',       value: avg.sfa_g       || 0, color: '#F44336' },
      { label: 'Trans Fat', value: avg.trans_fat_g || 0, color: '#795548' },
    ];

    const total = segments.reduce((s, seg) => s + seg.value, 0) || 1;
    const pcts  = segments.map(seg => +(seg.value / total * 100).toFixed(1));

    if (_pieChart) _pieChart.destroy();
    const ctx = document.getElementById('chart-pie').getContext('2d');
    _pieChart = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: segments.map((s, i) => `${s.label} ${pcts[i]}%`),
        datasets: [{
          data: pcts,
          backgroundColor: segments.map(s => s.color),
          borderWidth: 2,
          borderColor: '#fff',
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { font: { size: 11 }, boxWidth: 14, padding: 10 },
          },
          tooltip: {
            callbacks: {
              label: ctx => {
                const seg = segments[ctx.dataIndex];
                return ` ${seg.label}: ${seg.value.toFixed(1)}g (${ctx.parsed}%)`;
              },
            },
          },
        },
      },
    });
  }

  // ── Line charts ──────────────────────────────────────────────

  function _renderAllLineCharts(daily) {
    const inner = document.getElementById('trend-charts-inner');
    inner.innerHTML = LINE_METRICS.map(m => `
      <div class="trend-chart-group">
        <div class="trend-chart-label">${m.label} <span class="trend-unit">(${m.unit})</span></div>
        <div class="chart-container chart-sm">
          <canvas id="chart-line-${m.id}"></canvas>
        </div>
      </div>
    `).join('');

    _destroyLineCharts();

    const labels = daily.map(d => d.date.slice(5)); // MM-DD

    LINE_METRICS.forEach(m => {
      const canvas = document.getElementById(`chart-line-${m.id}`);
      if (!canvas) return;
      const chart = new Chart(canvas.getContext('2d'), {
        type: 'line',
        data: {
          labels,
          datasets: [{
            label: `${m.label} (${m.unit})`,
            data: daily.map(d => +(d[m.key] || 0).toFixed(1)),
            borderColor: m.color,
            backgroundColor: m.color + '28',
            fill: true,
            tension: 0.35,
            pointRadius: daily.length > 14 ? 2 : 4,
            pointHoverRadius: 6,
            borderWidth: 2,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode: 'index', intersect: false },
          plugins: { legend: { display: false } },
          scales: {
            x: { ticks: { font: { size: 10 }, maxRotation: 45 } },
            y: { beginAtZero: true, ticks: { font: { size: 10 } } },
          },
        },
      });
      _lineCharts.push(chart);
    });
  }

  function _destroyLineCharts() {
    _lineCharts.forEach(c => c.destroy());
    _lineCharts = [];
  }

  return { init };
})();
