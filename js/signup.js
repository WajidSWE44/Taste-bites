(function () {
  const params = new URLSearchParams(location.search);
  const next = Auth.safeNext(params.get('next'));

  const form = document.getElementById('signupForm');
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

  const existing = Auth.currentUser();
  if (existing) location.replace(next || Auth.homeFor(existing));

  const loginLink = document.getElementById('toLogin');
  if (loginLink && next) loginLink.href = 'login.html?next=' + encodeURIComponent(next);

  Auth.bindPasswordToggles();

  function validate(d) {
    let ok = true;

    if (d.name.trim().length < 2) {
      setError('sName', 'Enter your full name.');
      ok = false;
    } else setError('sName', '');

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email.trim())) {
      setError('sEmail', 'Enter a valid email address.');
      ok = false;
    } else setError('sEmail', '');

    if (d.phone.trim() && !/^[0-9+\-\s]{7,}$/.test(d.phone.trim())) {
      setError('sPhone', 'Enter a valid phone number, or leave it empty.');
      ok = false;
    } else setError('sPhone', '');

    if (d.password.length < 8 || !/[A-Za-z]/.test(d.password) || !/[0-9]/.test(d.password)) {
      setError('sPassword', 'Use at least 8 characters with a letter and a number.');
      ok = false;
    } else setError('sPassword', '');

    if (d.confirm !== d.password) {
      setError('sConfirm', 'Passwords do not match.');
      ok = false;
    } else setError('sConfirm', '');

    return ok;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
      name: document.getElementById('sName').value,
      email: document.getElementById('sEmail').value,
      phone: document.getElementById('sPhone').value,
      password: document.getElementById('sPassword').value,
      confirm: document.getElementById('sConfirm').value
    };
    if (!validate(data)) return;

    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    const result = await Auth.signup(data);
    btn.disabled = false;

    if (!result.ok) {
      if (result.field) setError(result.field, result.error);
      showStatus(result.error, 'bad');
      return;
    }
    showStatus('Account created. Redirecting…', 'ok');
    location.href = next || Auth.homeFor(result.user);
  });
})();
