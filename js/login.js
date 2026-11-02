(function () {
  const params = new URLSearchParams(location.search);
  const next = Auth.safeNext(params.get('next'));
  const needAdmin = params.get('need') === 'admin';

  const form = document.getElementById('loginForm');
  const statusBox = document.getElementById('authStatus');

  function showStatus(text, type) {
    statusBox.textContent = text;
    statusBox.className = 'status-msg show ' + type;
  }

  function setError(fieldId, message) {
    const field = document.getElementById(fieldId).closest('.field');
    field.classList.toggle('error', Boolean(message));
    field.querySelector('.field-error').textContent = message || '';
  }

  // Where to go after a successful login
  function destination(user) {
    if (next === 'admin.html' && user.role !== 'admin') return 'menu.html';
    return next || Auth.homeFor(user);
  }

  // Message shown above the form depending on why the visitor is here
  const user = Auth.currentUser();
  if (needAdmin && user && user.role !== 'admin') {
    showStatus('You are logged in as ' + user.name + ', which does not have admin access. Log in with a staff account to continue.', 'bad');
  } else if (user) {
    location.replace(destination(user));
  } else if (needAdmin) {
    showStatus('The admin panel is for restaurant staff. Log in with a staff account to continue.', 'info');
  } else if (next === 'cart.html') {
    showStatus('Log in to place your order. Your cart is saved.', 'info');
  } else if (next === 'track.html' || (next || '').startsWith('track.html')) {
    showStatus('Log in to see your orders.', 'info');
  }

  // Keep the "Create account" link pointing to the same destination
  const signupLink = document.getElementById('toSignup');
  if (signupLink && next) signupLink.href = 'signup.html?next=' + encodeURIComponent(next);

  Auth.bindPasswordToggles();

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('lEmail').value;
    const password = document.getElementById('lPassword').value;

    let ok = true;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('lEmail', 'Enter the email you signed up with.');
      ok = false;
    } else setError('lEmail', '');
    if (!password) {
      setError('lPassword', 'Enter your password.');
      ok = false;
    } else setError('lPassword', '');
    if (!ok) return;

    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    const result = await Auth.login(email, password);
    btn.disabled = false;

    if (!result.ok) {
      showStatus(result.error, 'bad');
      return;
    }
    showStatus('Logged in. Redirecting…', 'ok');
    location.href = destination(result.user);
  });
})();
