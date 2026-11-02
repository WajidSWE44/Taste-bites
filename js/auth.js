// ---------------------------------------------------------------
// Auth for Taste Bites (front-end demo, stored in localStorage)
//
//   users   -> localStorage 'users'    [{ id, name, email, phone, salt, hash, role, createdAt }]
//   session -> localStorage 'session'  { userId }
//
// A default staff account is created the first time the site loads:
//   email:    admin@tastebites.com
//   password: Admin@123
// Change it after your first login (or edit ADMIN_SEED below).
//
// NOTE: localStorage lives in the visitor's browser, so this protects the
// admin page from casual visitors, not from someone using dev tools.
// For a real deployment move users/orders to Node + Express + MongoDB
// and verify sessions (JWT / cookies) on the server.
// ---------------------------------------------------------------
(function () {
  const USERS_KEY = 'users';
  const SESSION_KEY = 'session';

  const ADMIN_SEED = {
    name: 'Restaurant Admin',
    email: 'admin@tastebites.com',
    password: 'Admin@123'
  };

  function read(key, fallback) {
    try {
      const v = JSON.parse(localStorage.getItem(key));
      return v === null || v === undefined ? fallback : v;
    } catch (e) {
      return fallback;
    }
  }
  function write(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  // Escape user-provided text before putting it inside innerHTML.
  function escapeHtml(s) {
    return String(s === undefined || s === null ? '' : s).replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  function toHex(bytes) {
    return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  }

  function randomSalt() {
    const a = new Uint8Array(16);
    crypto.getRandomValues(a);
    return toHex(a);
  }

  // SHA-256(salt:password). Falls back to a simple hash if the browser
  // blocks crypto.subtle (it needs https:// or localhost).
  async function hashPassword(password, salt) {
    const text = salt + ':' + password;
    if (window.crypto && crypto.subtle) {
      const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
      return toHex(new Uint8Array(buf));
    }
    let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
    for (let i = 0; i < text.length; i++) {
      const ch = text.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return 'f' + (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16);
  }

  async function seedAdmin() {
    const users = read(USERS_KEY, []);
    if (users.some((u) => u.role === 'admin')) return;
    const salt = randomSalt();
    users.push({
      id: 'u_admin',
      name: ADMIN_SEED.name,
      email: ADMIN_SEED.email,
      phone: '',
      salt,
      hash: await hashPassword(ADMIN_SEED.password, salt),
      role: 'admin',
      createdAt: new Date().toISOString()
    });
    write(USERS_KEY, users);
  }
  const ready = seedAdmin();

  function publicUser(u) {
    return u ? { id: u.id, name: u.name, email: u.email, phone: u.phone, role: u.role } : null;
  }

  function currentUser() {
    const s = read(SESSION_KEY, null);
    if (!s || !s.userId) return null;
    const u = read(USERS_KEY, []).find((x) => x.id === s.userId);
    return publicUser(u);
  }

  async function signup({ name, email, phone, password }) {
    await ready;
    const users = read(USERS_KEY, []);
    const cleanEmail = String(email).trim().toLowerCase();
    if (users.some((u) => u.email === cleanEmail)) {
      return { ok: false, field: 'sEmail', error: 'An account with this email already exists. Try logging in.' };
    }
    const salt = randomSalt();
    const user = {
      id: 'u' + Date.now() + Math.floor(Math.random() * 1000),
      name: String(name).trim(),
      email: cleanEmail,
      phone: String(phone || '').trim(),
      salt,
      hash: await hashPassword(password, salt),
      role: 'customer', // signup can never create an admin
      createdAt: new Date().toISOString()
    };
    users.push(user);
    write(USERS_KEY, users);
    write(SESSION_KEY, { userId: user.id });
    return { ok: true, user: publicUser(user) };
  }

  async function login(email, password) {
    await ready;
    const cleanEmail = String(email).trim().toLowerCase();
    const u = read(USERS_KEY, []).find((x) => x.email === cleanEmail);
    const bad = { ok: false, error: 'Incorrect email or password.' };
    if (!u) return bad;
    if ((await hashPassword(password, u.salt)) !== u.hash) return bad;
    write(SESSION_KEY, { userId: u.id });
    return { ok: true, user: publicUser(u) };
  }

  function logout() {
    localStorage.removeItem(SESSION_KEY);
  }

  function homeFor(user) {
    return user && user.role === 'admin' ? 'admin.html' : 'menu.html';
  }

  // Only allow redirects to our own pages (prevents open-redirect links).
  function safeNext(next) {
    return /^[a-z0-9_-]+\.html(\?[a-z0-9_=&%.-]*)?$/i.test(next || '') ? next : '';
  }

  function bindPasswordToggles() {
    document.querySelectorAll('.pw-toggle').forEach((btn) => {
      btn.addEventListener('click', () => {
        const input = btn.parentElement.querySelector('input');
        const show = input.type === 'password';
        input.type = show ? 'text' : 'password';
        btn.textContent = show ? 'Hide' : 'Show';
        btn.setAttribute('aria-pressed', show ? 'true' : 'false');
      });
    });
  }

  window.escapeHtml = escapeHtml;
  window.Auth = {
    ready,
    signup,
    login,
    logout,
    currentUser,
    homeFor,
    safeNext,
    bindPasswordToggles,
    isAdmin: () => {
      const u = currentUser();
      return Boolean(u && u.role === 'admin');
    }
  };
})();
