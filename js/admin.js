// ---------- Admin gate: only logged-in staff can use this page ----------
(function () {
  const user = Auth.currentUser();
  if (!user || user.role !== 'admin') {
    location.replace('login.html?next=admin.html&need=admin');
    return;
  }
  document.getElementById('adminMain').hidden = false;
  document.getElementById('adminUser').innerHTML =
    'Signed in as <strong>' + escapeHtml(user.name) + '</strong> (' + escapeHtml(user.email) + ') ' +
    '<button type="button" class="text-btn" id="adminLogout">Log out</button>';
  document.getElementById('adminLogout').addEventListener('click', () => {
    Auth.logout();
    location.href = 'login.html';
  });
})();

const form = document.getElementById('productForm');
const statusMsg = document.getElementById('statusMsg');
const tableBody = document.querySelector('#productTable tbody');
const msgList = document.getElementById('msgList');
const resList = document.getElementById('resList');

function showStatus(text, ok) {
  statusMsg.textContent = text;
  statusMsg.className = 'status-msg show ' + (ok ? 'ok' : 'bad');
}

function renderTable() {
  tableBody.innerHTML = window.foods
    .map(
      (f) => `<tr>
      <td><img src="${f.img}" alt="${f.name}"></td>
      <td>${f.name}</td>
      <td>${f.cat}</td>
      <td>Rs. ${f.price.toLocaleString()}</td>
      <td>${f.veg ? 'Veg' : 'Non-veg'}</td>
      <td><button onclick="removeProduct('${f._id}')">Delete</button></td>
    </tr>`
    )
    .join('');
}

function removeProduct(id) {
  if (!confirm('Remove this item from the menu?')) return;
  const updated = window.foods.filter((f) => f._id !== id);
  saveFoods(updated);
  renderTable();
  showStatus('Product removed.', true);
}

form.addEventListener('submit', (e) => {
  e.preventDefault();

  const payload = {
    _id: 'p' + Date.now(),
    name: document.getElementById('pName').value.trim(),
    cat: document.getElementById('pCat').value,
    price: Number(document.getElementById('pPrice').value),
    rating: Number(document.getElementById('pRating').value) || 4.5,
    tag: document.getElementById('pTag').value.trim() || 'NEW',
    veg: document.getElementById('pVeg').checked,
    halal: document.getElementById('pHalal').checked,
    spice: Number(document.getElementById('pSpice').value) || 0,
    time: Number(document.getElementById('pTime').value) || 15,
    desc: document.getElementById('pDesc').value.trim(),
    img: document.getElementById('pImg').value.trim()
  };

  if (!payload.name || !payload.cat || !payload.price || !payload.img) {
    showStatus('Please fill in name, category, price and image URL.', false);
    return;
  }

  const updated = [payload, ...window.foods];
  saveFoods(updated);
  renderTable();
  form.reset();
  showStatus(`"${payload.name}" was added to the menu.`, true);
});

function renderMessages() {
  const messages = JSON.parse(localStorage.getItem('messages') || '[]');
  msgList.innerHTML = messages.length
    ? messages
        .map(
          (m) => `<div class="msg-row">
        <div class="msg-top"><span>${escapeHtml(m.name)} · ${escapeHtml(m.email)}</span><span>${new Date(m.date).toLocaleString()}</span></div>
        <div class="msg-subject">${escapeHtml(m.subject)}</div>
        <div class="msg-body">${escapeHtml(m.message)}</div>
        </div>`
        )
        .join('')
    : '<p class="empty">No messages yet.</p>';
}

function removeReservation(id) {
  const updated = JSON.parse(localStorage.getItem('reservations') || '[]').filter((r) => r.id !== id);
  localStorage.setItem('reservations', JSON.stringify(updated));
  renderReservations();
}

function renderReservations() {
  if (!resList) return;
  const reservations = JSON.parse(localStorage.getItem('reservations') || '[]');
  resList.innerHTML = reservations.length
    ? reservations
        .map(
          (r) => `<div class="msg-row">
        <div class="msg-top">
          <span>${escapeHtml(r.name)} · ${escapeHtml(r.phone)}</span>
          <span>${new Date(r.createdAt).toLocaleString()}</span>
        </div>
        <div class="msg-subject">${new Date(r.date).toLocaleDateString(undefined, {
          weekday: 'short',
          month: 'short',
          day: 'numeric'
        })} at ${r.time} · ${r.guests} guest${r.guests == 1 ? '' : 's'}</div>
        <div class="msg-body">${r.notes ? escapeHtml(r.notes) : 'No special requests.'}</div>
        <button style="margin-top:8px" onclick="removeReservation('${r.id}')">Cancel</button>
        </div>`
        )
        .join('')
    : '<p class="empty">No reservations yet.</p>';
}


// ---------- Orders ----------
const ordList = document.getElementById('ordList');
const ordFilter = document.getElementById('orderFilter');
const ordBadge = document.getElementById('ordBadge');

function orderCard(o) {
  const next = Orders.nextStatus(o);
  const statusOptions = Orders.STEPS.concat([Orders.CANCELLED])
    .map((st) => `<option value="${st.key}" ${st.key === o.status ? 'selected' : ''}>${st.label}</option>`)
    .join('');
  const lines = o.items.map((i) => `${i.qty} × ${escapeHtml(i.name)}`).join(', ');
  return `<div class="ord-card">
    <div class="ord-top">
      <strong>#${o.id}</strong>
      <span class="pill ${o.status}">${escapeHtml(Orders.label(o.status))}</span>
    </div>
    <div class="ord-lines">
      <div>${escapeHtml(o.name)} · ${escapeHtml(o.phone)} · ${escapeHtml(o.userEmail || '')}</div>
      <div>${escapeHtml(o.address)}</div>
      <div>${lines}</div>
      <div><strong>Rs. ${o.total.toLocaleString()}</strong> · ${new Date(o.createdAt).toLocaleString()}</div>
    </div>
    <div class="ord-actions">
      <select data-status-for="${o.id}" aria-label="Order status for ${o.id}">${statusOptions}</select>
      ${next ? `<button class="btn primary sm" data-advance="${o.id}">Mark as ${escapeHtml(next.label.toLowerCase())}</button>` : ''}
    </div>
  </div>`;
}

function renderOrders() {
  const all = Orders.all();
  const f = ordFilter.value;
  const list = all.filter((o) =>
    f === 'all' ? true : f === 'active' ? Orders.isActive(o) : o.status === f
  );
  const fresh = all.filter((o) => o.status === 'placed').length;
  ordBadge.textContent = fresh;
  ordBadge.hidden = !fresh;
  ordList.innerHTML = list.length ? list.map(orderCard).join('') : '<p class="empty">No orders here yet.</p>';
}

ordFilter.addEventListener('change', renderOrders);

ordList.addEventListener('change', (e) => {
  const sel = e.target.closest('[data-status-for]');
  if (!sel) return;
  Orders.setStatus(sel.dataset.statusFor, sel.value);
  renderOrders();
});

ordList.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-advance]');
  if (!btn) return;
  const o = Orders.get(btn.dataset.advance);
  const next = o && Orders.nextStatus(o);
  if (next) Orders.setStatus(o.id, next.key);
  renderOrders();
});

// New orders placed in another tab show up without a refresh
window.addEventListener('storage', (e) => {
  if (e.key === 'orders') renderOrders();
});

// ---------- Tabs: Products / Messages / Reservations ----------
function initTabs() {
  const tabs = document.querySelectorAll('.admin-tabs button');
  const panels = {
    products: document.getElementById('panelProducts'),
    orders: document.getElementById('panelOrders'),
    messages: document.getElementById('panelMessages'),
    reservations: document.getElementById('panelReservations')
  };
  tabs.forEach((btn) => {
    btn.addEventListener('click', () => {
      tabs.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      Object.entries(panels).forEach(([key, el]) => {
        if (!el) return;
        el.style.display = key === btn.dataset.tab ? '' : 'none';
      });
    });
  });
}

renderTable();
renderOrders();
renderMessages();
renderReservations();
initTabs();
