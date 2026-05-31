// ── Supabase client ────────────────────────────────────────────
window._supabase = supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);

// ── Global app state ───────────────────────────────────────────
const App = {
  state: {
    user: null,
    session: null,
    activeTab: 'meal-log',
  },
  _tabInited: {},
  _loginInProgress: false,

  async init() {
    Auth.init();
    _bindNavigation();

    // Show the app immediately if we already have a stored session — this
    // eliminates the auth-screen flash on every normal-tab reload.
    // We do NOT call _onLogin() here; that waits for onAuthStateChange to
    // fire with a guaranteed-fresh (possibly just-refreshed) token.
    const { data: stored } = await window._supabase.auth.getSession();
    if (stored.session) {
      App.state.session = stored.session;
      App.state.user = stored.session.user;
      _showApp();
    }

    window._supabase.auth.onAuthStateChange(async (event, session) => {
      App.state.session = session;
      App.state.user = session?.user || null;

      if (event === 'SIGNED_OUT') {
        _showAuth();
        return;
      }

      if ((event === 'INITIAL_SESSION' || event === 'SIGNED_IN') && session) {
        _showApp();
        await _onLogin();
        return;
      }

      // TOKEN_REFRESHED fires every ~55 min as Supabase silently rotates the
      // access token, AND fires right after startup when an expired stored token
      // gets refreshed.  In the latter case the initial data load may have
      // failed with a 401 (empty tabs) — silently retry now that the token is fresh.
      if (event === 'TOKEN_REFRESHED' && session) {
        if (App._tabInited['meal-log']) {
          TabMealLog.refresh().catch(() => {});
        }
      }
    });
  },
};

function _showApp() {
  document.getElementById('auth-screen').classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');
}

function _showAuth() {
  document.getElementById('auth-screen').classList.remove('hidden');
  document.getElementById('app').classList.add('hidden');
  App._tabInited = {};
  App._loginInProgress = false;
}

async function _onLogin() {
  // Guard: skip if a login-init is already running (rapid event re-fire).
  if (App._loginInProgress) return;
  App._loginInProgress = true;
  try {
    await _switchTab(App.state.activeTab, true);
  } finally {
    App._loginInProgress = false;
  }
}

// ── Navigation ─────────────────────────────────────────────────

function _bindNavigation() {
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => _switchTab(btn.dataset.tab));
  });
}

async function _switchTab(tabName, force = false) {
  if (!force && App.state.activeTab === tabName) return;
  App.state.activeTab = tabName;

  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(btn =>
    btn.classList.toggle('active', btn.dataset.tab === tabName)
  );
  const content = document.getElementById(`tab-${tabName}`);
  if (content) content.classList.add('active');

  // Lazy-init each tab on first visit
  if (!App._tabInited[tabName]) {
    App._tabInited[tabName] = true;
    try {
      switch (tabName) {
        case 'meal-log':   await TabMealLog.init();   break;
        case 'meal-plan':  await TabMealPlan.init();  break;
        case 'food-db':    await TabFoodDB.init();    break;
        case 'nutrition':  await TabNutrition.init(); break;
        case 'targets':    await TabTargets.init();   break;
      }
    } catch (e) {
      // Reset flag so the tab can be retried next time the user visits it
      App._tabInited[tabName] = false;
      showToast('Tab failed to load — tap again to retry.', 'error');
      console.error(`[Tab:${tabName}] init error:`, e);
    }
  } else if (tabName === 'meal-log') {
    await TabMealLog.refresh(); // always pull fresh data when revisiting
  }
}

// ── Stale-tab recovery ──────────────────────────────────────────
// When the page is backgrounded for a long time, the token refresh may have
// been throttled by the browser.  Re-check on next foreground — if the session
// is gone, show login immediately rather than silently breaking.
document.addEventListener('visibilitychange', async () => {
  if (document.visibilityState !== 'visible' || !App.state.user) return;
  try {
    const { data } = await window._supabase.auth.getSession();
    if (!data.session) {
      App.state.user = null;
      App.state.session = null;
      App._tabInited = {};
      _showAuth();
    }
  } catch (_) { /* ignore network errors during visibility check */ }
});

// ── Boot ───────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => App.init());
