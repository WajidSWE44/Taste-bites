const form = document.getElementById('reservationForm');
const statusMsg = document.getElementById('statusMsg');
const dateInput = document.getElementById('rDate');

// Don't let guests pick a date in the past
if (dateInput) dateInput.min = new Date().toISOString().split('T')[0];

function setError(fieldId, message) {
  const field = document.getElementById(fieldId).closest('.field');
  field.classList.toggle('error', Boolean(message));
  field.querySelector('.field-error').textContent = message || '';
}

function validate(data) {
  let ok = true;

  if (!data.name.trim()) {
    setError('rName', 'Please enter your name.');
    ok = false;
  } else setError('rName', '');

  const phoneOk = /^[0-9+\-\s]{7,}$/.test(data.phone.trim());
  if (!phoneOk) {
    setError('rPhone', 'Please enter a valid phone number.');
    ok = false;
  } else setError('rPhone', '');

  if (!data.date) {
    setError('rDate', 'Please choose a date.');
    ok = false;
  } else setError('rDate', '');

  if (!data.time) {
    setError('rTime', 'Please choose a time.');
    ok = false;
  } else setError('rTime', '');

  if (!data.guests || data.guests < 1) {
    setError('rGuests', 'Please enter at least 1 guest.');
    ok = false;
  } else setError('rGuests', '');

  return ok;
}

function showStatus(text, ok) {
  statusMsg.textContent = text;
  statusMsg.className = 'status-msg show ' + (ok ? 'ok' : 'bad');
}

// Saved into localStorage under 'reservations' so staff can review them
// from the Admin page — no server involved.
function saveReservation(data) {
  const reservations = JSON.parse(localStorage.getItem('reservations') || '[]');
  reservations.unshift({ ...data, id: 'r' + Date.now(), createdAt: new Date().toISOString() });
  localStorage.setItem('reservations', JSON.stringify(reservations));
}

function showConfirmation(data) {
  document.querySelector('.contact-layout').innerHTML = `
    <div class="contact-info confirm-card" style="grid-column:1 / -1">
      <div class="icon">🎉</div>
      <h2>You're booked, ${data.name.split(' ')[0]}!</h2>
      <p>We've saved a table for <strong>${data.guests}</strong> on <strong>${new Date(
    data.date
  ).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</strong> at <strong>${
    data.time
  }</strong>.</p>
      <p>We'll text you at ${data.phone} if anything changes. See you soon!</p>
      <a class="btn primary" href="menu.html" style="margin-top:10px;display:inline-block">Browse the menu while you wait</a>
    </div>`;
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const data = {
    name: document.getElementById('rName').value,
    phone: document.getElementById('rPhone').value,
    date: document.getElementById('rDate').value,
    time: document.getElementById('rTime').value,
    guests: Number(document.getElementById('rGuests').value),
    notes: document.getElementById('rNotes').value
  };

  if (!validate(data)) return;

  saveReservation(data);
  showStatus("Table reserved — we've saved your booking.", true);
  showConfirmation(data);
});
