// Thin wrapper around fetch that injects the Supabase auth token
// and handles JSON parsing + error raising.

const API = (() => {
  async function _getToken() {
    const { data } = await window._supabase.auth.getSession();
    return data?.session?.access_token || null;
  }

  async function request(method, path, body = null, params = null) {
    const token = await _getToken();
    if (!token) throw new Error('Not authenticated');

    let url = `${CONFIG.API_BASE}${path}`;
    if (params) {
      const qs = new URLSearchParams(
        Object.entries(params).filter(([, v]) => v != null)
      ).toString();
      if (qs) url += `?${qs}`;
    }

    const opts = {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    };
    if (body != null) opts.body = JSON.stringify(body);

    const res = await fetch(url, opts);
    if (res.status === 204) return null;

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.detail || `HTTP ${res.status}`);
    }
    return data;
  }

  return {
    get:    (path, params) => request('GET',    path, null,  params),
    post:   (path, body)   => request('POST',   path, body),
    put:    (path, body)   => request('PUT',    path, body),
    delete: (path)         => request('DELETE', path),

    // ── Foods ──
    searchFoods: (q, tag, sortBy, sortDir) =>
      request('GET', '/api/foods', null, { q, tag, sort_by: sortBy, sort_dir: sortDir }),
    addFood: (food) => request('POST', '/api/foods', food),
    updateFood: (id, updates) => request('PUT', `/api/foods/${id}`, updates),
    deleteFood: (id) => request('DELETE', `/api/foods/${id}`),

    // ── Meal Log ──
    getTodayLog: () => request('GET', '/api/meals/today'),
    getLogByDate: (d) => request('GET', `/api/meals/date/${d}`),
    addLog: (entry) => request('POST', '/api/meals', entry),
    updateLog: (id, updates) => request('PUT', `/api/meals/${id}`, updates),
    deleteLog: (id) => request('DELETE', `/api/meals/${id}`),

    // ── Meal Plan ──
    getPlan: () => request('GET', '/api/plan'),
    addPlanItem: (item) => request('POST', '/api/plan', item),
    deletePlanItem: (id) => request('DELETE', `/api/plan/${id}`),
    clearPlan: () => request('DELETE', '/api/plan'),

    // ── Targets ──
    getTargets: () => request('GET', '/api/targets'),
    calculateTargets: (inputs) => request('POST', '/api/targets/calculate', inputs),
    saveTargets: (data) => request('PUT', '/api/targets', data),
    calculateAndSave: (inputs) => request('POST', '/api/targets/calculate-and-save', inputs),

    // ── Nutrition Summary ──
    getSummary: (params) => request('GET', '/api/nutrition/summary', null, params),

  };
})();
