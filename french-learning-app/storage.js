// Local demo storage helpers. Use a server-side auth provider for production.
const APP_PREFIX = 'eurosphere_fr_';
function getActiveUser() { return localStorage.getItem(APP_PREFIX + 'active_user') || null; }
function getActiveBatch() { return localStorage.getItem(APP_PREFIX + 'batch') || 'Général'; }
function getUserScoreKey(username) { return APP_PREFIX + 'score_' + username; }
function getUserRecordKey(email) { return APP_PREFIX + 'user_' + String(email).toLowerCase(); }
function getUserScore(username) { return Number(localStorage.getItem(getUserScoreKey(username)) || 0); }
function setUserScore(username, score) { localStorage.setItem(getUserScoreKey(username), String(Math.max(0, Number(score) || 0))); }
function getTopScorer() {
  let name = 'Pas encore de score', score = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key || !key.startsWith(APP_PREFIX + 'score_')) continue;
    const value = Number(localStorage.getItem(key)) || 0;
    if (value > score) { score = value; name = key.slice((APP_PREFIX + 'score_').length); }
  }
  return { name, score };
}
