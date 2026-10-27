function switchAuthTab(tab) {
  const signup = tab === 'signup';
  document.getElementById('signup-form').hidden = !signup;
  document.getElementById('login-form').hidden = signup;
  document.getElementById('tab-signup').classList.toggle('active', signup);
  document.getElementById('tab-login').classList.toggle('active', !signup);
  setAuthMessage('');
}
function setAuthMessage(message, isError = true) {
  const el = document.getElementById('auth-message');
  if (el) { el.textContent = message; el.classList.toggle('error', isError && Boolean(message)); el.classList.toggle('success', !isError && Boolean(message)); }
}
async function hashPassword(password) {
  if (window.crypto && crypto.subtle) {
    const data = new TextEncoder().encode(password);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash), b => b.toString(16).padStart(2, '0')).join('');
  }
  // Local demo fallback only; never use browser-only credentials for a production service.
  return 'demo:' + password;
}
function enterDashboard(user) {
  localStorage.setItem(APP_PREFIX + 'active_user', user.email);
  localStorage.setItem(APP_PREFIX + 'display_name', user.name || user.email.split('@')[0]);
  localStorage.setItem(APP_PREFIX + 'batch', 'General');
  if (localStorage.getItem(getUserScoreKey(user.email)) === null) setUserScore(user.email, 0);
  showScreen('dashboard-screen');
  const display = document.getElementById('user-display');
  if (display) display.textContent = user.name || user.email.split('@')[0];
  updateLeaderboardUI(); updateProgressUI();
}
document.addEventListener('DOMContentLoaded', () => {
  const signup = document.getElementById('signup-form');
  const login = document.getElementById('login-form');
  signup.addEventListener('submit', async event => {
    event.preventDefault();
    const name = document.getElementById('signup-name').value.trim();
    const email = document.getElementById('signup-email').value.trim().toLowerCase();
    const password = document.getElementById('signup-password').value;
    if (!name || !email || password.length < 8) { setAuthMessage('Please enter your name, a valid email address, and a password with at least 8 characters.'); return; }
    const key = getUserRecordKey(email);
    if (localStorage.getItem(key)) { setAuthMessage('This email address is already registered. Please log in.'); return; }
    const passwordHash = await hashPassword(password);
    const user = { name, email, passwordHash, createdAt: new Date().toISOString() };
    localStorage.setItem(key, JSON.stringify(user));
    enterDashboard(user);
  });
  login.addEventListener('submit', async event => {
    event.preventDefault();
    const email = document.getElementById('login-email').value.trim().toLowerCase();
    const password = document.getElementById('login-password').value;
    const raw = localStorage.getItem(getUserRecordKey(email));
    if (!raw) { setAuthMessage('Account not found in this browser. Create an account to get started.'); return; }
    try {
      const user = JSON.parse(raw);
      if (user.passwordHash !== await hashPassword(password)) { setAuthMessage('Incorrect password. Please try again.'); return; }
      enterDashboard(user);
    } catch { setAuthMessage('Unable to read this account. Please create a new account.'); }
  });
  const active = getActiveUser();
  if (active) {
    const raw = localStorage.getItem(getUserRecordKey(active));
    if (raw) { try { enterDashboard(JSON.parse(raw)); } catch { localStorage.removeItem(APP_PREFIX + 'active_user'); } }
    else { // migrate a previously stored local demo session gracefully
      showScreen('dashboard-screen');
      document.getElementById('user-display').textContent = localStorage.getItem(APP_PREFIX + 'display_name') || active;
      updateLeaderboardUI(); updateProgressUI();
    }
  }
});
function logout() {
  localStorage.removeItem(APP_PREFIX + 'active_user');
  showScreen('auth-screen');
  document.getElementById('signup-form').reset(); document.getElementById('login-form').reset();
  switchAuthTab('login');
}
