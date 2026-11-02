function toast(t) {
  const x = document.createElement('div');
  x.className = 'notice';
  x.textContent = t;
  document.body.appendChild(x);
  setTimeout(() => x.remove(), 1800);
}

function updateCount() {
  const c = JSON.parse(localStorage.getItem('cart') || '{}');
  document.querySelectorAll('#cartCount').forEach(
    (x) => (x.textContent = Object.values(c).reduce((a, b) => a + b, 0))
  );
}

function initTheme() {
  const dark = localStorage.getItem('dark') === '1';
  document.body.classList.toggle('dark', dark);
  const b = document.getElementById('themeToggle');
  if (b) b.textContent = dark ? '☀' : '☾';
  if (b)
    b.onclick = () => {
      const d = !document.body.classList.contains('dark');
      document.body.classList.toggle('dark', d);
      localStorage.setItem('dark', d ? '1' : '0');
      b.textContent = d ? '☀' : '☾';
    };
}

function initNavToggle() {
  const toggle = document.getElementById('navToggle');
  const links = document.getElementById('navLinks');
  if (!toggle || !links) return;
  toggle.addEventListener('click', () => {
    const open = links.classList.toggle('open');
    toggle.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  // Close the mobile menu after a link is tapped
  links.querySelectorAll('a').forEach((a) =>
    a.addEventListener('click', () => {
      links.classList.remove('open');
      toggle.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    })
  );
}

// ---------- Auth in the header: Track order link + account menu ----------
function initAuthNav() {
  if (!window.Auth) return;

  // "Track order" link in the main navigation
  const links = document.getElementById('navLinks');
  if (links && !links.querySelector('[href="track.html"]')) {
    const a = document.createElement('a');
    a.href = 'track.html';
    a.textContent = 'Track order';
    if (/track\.html$/.test(location.pathname)) a.classList.add('active');
    links.appendChild(a);
  }

  // Log in button, or the account dropdown when logged in
  const right = document.querySelector('.nav-right');
  if (!right) return;
  const user = Auth.currentUser();
  const wrap = document.createElement('div');
  wrap.className = 'account';

  if (!user) {
    wrap.innerHTML = '<a class="login-link" href="login.html">Log in</a>';
  } else {
    const first = escapeHtml(user.name.split(' ')[0]);
    wrap.innerHTML =
      '<button class="account-btn" id="accountBtn" aria-haspopup="true" aria-expanded="false">' +
      '<span class="avatar">' + escapeHtml(user.name.trim().charAt(0).toUpperCase()) + '</span>' +
      '<span class="account-name">' + first + '</span></button>' +
      '<div class="account-menu" id="accountMenu" hidden>' +
      '<div class="menu-role">' + (user.role === 'admin' ? 'Staff account' : escapeHtml(user.email)) + '</div>' +
      '<a href="track.html">My orders</a>' +
      (user.role === 'admin' ? '<a href="admin.html">Admin panel</a>' : '') +
      '<button type="button" id="logoutBtn">Log out</button></div>';
  }
  right.insertBefore(wrap, right.querySelector('.theme'));

  const btn = document.getElementById('accountBtn');
  const menu = document.getElementById('accountMenu');
  if (btn && menu) {
    const close = () => {
      menu.hidden = true;
      btn.setAttribute('aria-expanded', 'false');
    };
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      menu.hidden = !menu.hidden;
      btn.setAttribute('aria-expanded', menu.hidden ? 'false' : 'true');
    });
    document.addEventListener('click', (e) => {
      if (!wrap.contains(e.target)) close();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') close();
    });
    document.getElementById('logoutBtn').addEventListener('click', () => {
      Auth.logout();
      const protectedPage = /(admin|track)\.html$/.test(location.pathname);
      if (protectedPage) location.href = 'login.html';
      else location.reload();
    });
  }
}

updateCount();
initTheme();
initNavToggle();
initAuthNav();
