const form = document.getElementById('contactForm');
const statusMsg = document.getElementById('statusMsg');

function setError(fieldId, message) {
  const field = document.getElementById(fieldId).closest('.field');
  field.classList.toggle('error', Boolean(message));
  field.querySelector('.field-error').textContent = message || '';
}

function validate(data) {
  let ok = true;
  if (!data.name.trim()) {
    setError('cName', 'Please enter your name.');
    ok = false;
  } else setError('cName', '');

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email);
  if (!emailOk) {
    setError('cEmail', 'Please enter a valid email address.');
    ok = false;
  } else setError('cEmail', '');

  if (!data.message.trim() || data.message.trim().length < 10) {
    setError('cMessage', 'Message should be at least 10 characters.');
    ok = false;
  } else setError('cMessage', '');

  return ok;
}

function showStatus(text, ok) {
  statusMsg.textContent = text;
  statusMsg.className = 'status-msg show ' + (ok ? 'ok' : 'bad');
}

// Saves the message into localStorage under 'messages' so it can be
// reviewed later from the Admin page — no server involved.
function saveMessage(data) {
  const messages = JSON.parse(localStorage.getItem('messages') || '[]');
  messages.unshift({ ...data, id: 'm' + Date.now(), date: new Date().toISOString() });
  localStorage.setItem('messages', JSON.stringify(messages));
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const data = {
    name: document.getElementById('cName').value,
    email: document.getElementById('cEmail').value,
    subject: document.getElementById('cSubject').value,
    message: document.getElementById('cMessage').value
  };

  if (!validate(data)) return;

  saveMessage(data);
  showStatus("Thanks! Your message has been received — we'll reply soon.", true);
  form.reset();
});
