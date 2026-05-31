const Auth = (() => {
  function init() {
    _bindForms();
  }

  function _bindForms() {
    document.getElementById('btn-show-signup').addEventListener('click', () => {
      document.getElementById('login-form').classList.add('hidden');
      document.getElementById('signup-form').classList.remove('hidden');
    });
    document.getElementById('btn-show-login').addEventListener('click', () => {
      document.getElementById('signup-form').classList.add('hidden');
      document.getElementById('login-form').classList.remove('hidden');
    });

    // Google sign-in buttons (on both login and signup screens)
    document.querySelectorAll('.btn-google').forEach(btn => {
      btn.addEventListener('click', _signInWithGoogle);
    });

    document.getElementById('login-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = e.target.email.value.trim();
      const password = e.target.password.value;
      const btn = e.target.querySelector('button[type=submit]');
      btn.disabled = true;
      btn.textContent = 'Signing in…';
      try {
        const { error } = await window._supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } catch (err) {
        showToast(err.message, 'error');
      } finally {
        btn.disabled = false;
        btn.textContent = 'Sign In';
      }
    });

    document.getElementById('signup-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = e.target.email.value.trim();
      const password = e.target.password.value;
      const btn = e.target.querySelector('button[type=submit]');
      btn.disabled = true;
      btn.textContent = 'Creating account…';
      try {
        const { error } = await window._supabase.auth.signUp({ email, password });
        if (error) throw error;
        showToast('Account created! Check your email to confirm.', 'success');
      } catch (err) {
        showToast(err.message, 'error');
      } finally {
        btn.disabled = false;
        btn.textContent = 'Sign Up';
      }
    });

    document.getElementById('btn-logout').addEventListener('click', async () => {
      try {
        // Race against a 3-second timeout so a stale connection can't block sign-out
        await Promise.race([
          window._supabase.auth.signOut(),
          new Promise(resolve => setTimeout(resolve, 3000)),
        ]);
      } catch (_) { /* ignore */ }
      // Always do a hard reload — clears all in-memory state cleanly
      window.location.reload();
    });
  }

  async function _signInWithGoogle() {
    try {
      const { error } = await window._supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + window.location.pathname,
        },
      });
      if (error) throw error;
      // Page will redirect to Google — nothing else needed here
    } catch (err) {
      showToast('Google sign-in failed: ' + err.message, 'error');
    }
  }

  return { init };
})();
