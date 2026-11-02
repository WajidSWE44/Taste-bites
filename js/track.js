(function () {
  const area = document.getElementById('trackArea');
  const esc = escapeHtml;
  const money = (n) => 'Rs. ' + Number(n).toLocaleString();
  const fmt = (iso) =>
    new Date(iso).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
  const fmtClock = (d) => d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });

  const user = Auth.currentUser();

  if (!user) {
    area.innerHTML = `<div class="cart-box login-gate-box">
      <h2>Log in to track your orders</h2>
      <p>Your orders are saved to your account, so you can follow each one from kitchen to doorstep.</p>
      <div class="gate-actions">
        <a class="btn primary" href="login.html?next=track.html">Log in</a>
        <a class="btn ghost" href="signup.html?next=track.html">Create account</a>
      </div>
    </div>`;
    return;
  }

  area.innerHTML = `
    <form class="track-search" id="trackForm" novalidate>
      <input id="trackId" aria-label="Order number" placeholder="Order number, e.g. TB1234" autocomplete="off">
      <button class="btn primary" type="submit">Track order</button>
    </form>
    <div id="trackMsg" class="status-msg"></div>
    <div class="track-layout">
      <div>
        <h3 class="list-title">Your orders</h3>
        <div class="order-list" id="orderList"></div>
      </div>
      <div id="orderDetail"></div>
    </div>`;

  const listEl = document.getElementById('orderList');
  const detailEl = document.getElementById('orderDetail');
  const msgEl = document.getElementById('trackMsg');
  const form = document.getElementById('trackForm');
  const input = document.getElementById('trackId');

  let selectedId = null;

  const canView = (o) => o.userId === user.id || user.role === 'admin';

  function showMsg(text) {
    msgEl.textContent = text;
    msgEl.className = text ? 'status-msg show bad' : 'status-msg';
  }

  function renderList() {
    const mine = Orders.forUser(user.id);
    if (!mine.length) {
      listEl.innerHTML = `<div class="empty cart-box">You have not placed any orders yet.<br><br>
        <a class="btn primary" href="menu.html">Browse menu</a></div>`;
      return;
    }
    listEl.innerHTML = mine
      .map(
        (o) => `<button class="order-item ${o.id === selectedId ? 'selected' : ''}" data-id="${o.id}">
          <span class="oi-top"><span>#${o.id}</span><span class="pill ${o.status}">${esc(Orders.label(o.status))}</span></span>
          <span class="oi-sub">${o.items.reduce((n, i) => n + i.qty, 0)} item(s) · ${money(o.total)}</span>
          <span class="oi-sub">${fmt(o.createdAt)}</span>
        </button>`
      )
      .join('');
  }

  function timelineHtml(o) {
    if (o.status === 'cancelled') {
      const done = o.history.filter((h) => h.status !== 'cancelled');
      const steps = done
        .map((h) => {
          const s = Orders.STEPS.find((x) => x.key === h.status);
          return `<li class="done"><span class="dot">✓</span><div><strong>${esc(s.label)}</strong><small>${fmt(h.at)}</small></div></li>`;
        })
        .join('');
      const c = Orders.statusTime(o, 'cancelled');
      return `<ol class="timeline">${steps}
        <li class="cancelled"><span class="dot">✕</span><div><strong>Order cancelled</strong><small>${c ? fmt(c) : ''}</small></div></li></ol>`;
    }

    const current = Orders.stepIndex(o.status);
    return `<ol class="timeline">${Orders.STEPS.map((s, i) => {
      const state = i < current || o.status === 'delivered' ? 'done' : i === current ? 'current' : 'todo';
      const at = Orders.statusTime(o, s.key);
      const sub = at ? fmt(at) : state === 'todo' ? s.desc : '';
      const text = state === 'current' ? s.desc + (at ? ' · ' + fmt(at) : '') : sub;
      return `<li class="${state}"><span class="dot">${state === 'done' ? '✓' : ''}</span>
        <div><strong>${esc(s.label)}</strong><small>${esc(text)}</small></div></li>`;
    }).join('')}</ol>`;
  }

  function renderDetail() {
    const o = selectedId ? Orders.get(selectedId) : null;
    if (!o || !canView(o)) {
      detailEl.innerHTML = `<div class="track-card empty">Select an order to see its progress.</div>`;
      return;
    }

    let etaHtml = '';
    if (Orders.isActive(o)) {
      const e = Orders.eta(o);
      etaHtml =
        e.getTime() > Date.now()
          ? `<div class="eta">Estimated arrival around <strong>${fmtClock(e)}</strong></div>`
          : `<div class="eta">Your order should arrive any minute now.</div>`;
    }

    const itemsHtml = o.items
      .map(
        (i) => `<div class="track-item">
          <img src="${esc(i.img)}" alt="">
          <span>${i.qty} × ${esc(i.name)}</span>
          <strong>${money(i.price * i.qty)}</strong>
        </div>`
      )
      .join('');

    detailEl.innerHTML = `<div class="track-card">
      <div class="track-head">
        <div>
          <h2>Order #${o.id}</h2>
          <div class="track-meta">Placed ${fmt(o.createdAt)}</div>
        </div>
        <span class="pill ${o.status}">${esc(Orders.label(o.status))}</span>
      </div>
      ${etaHtml}
      ${timelineHtml(o)}
      <div class="track-section">
        <h3>Items</h3>
        ${itemsHtml}
        <div class="total"><span>Subtotal</span><span>${money(o.subtotal)}</span></div>
        <div class="total"><span>Delivery</span><span>${money(o.delivery)}</span></div>
        <div class="total grand"><span>Total</span><span>${money(o.total)}</span></div>
      </div>
      <div class="track-section">
        <h3>Delivery details</h3>
        <p class="track-address">${esc(o.name)}<br>${esc(o.address)}<br>${esc(o.phone)}</p>
      </div>
      ${
        Orders.canCancel(o) && o.userId === user.id
          ? `<button class="btn ghost danger" data-cancel="${o.id}">Cancel order</button>`
          : ''
      }
    </div>`;
  }

  function refresh() {
    renderList();
    renderDetail();
  }

  function select(id) {
    selectedId = id;
    history.replaceState(null, '', 'track.html?id=' + id);
    refresh();
  }

  listEl.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-id]');
    if (btn) {
      showMsg('');
      select(btn.dataset.id);
    }
  });

  detailEl.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-cancel]');
    if (!btn) return;
    if (!confirm('Cancel this order? This cannot be undone.')) return;
    if (!Orders.cancel(btn.dataset.cancel, user.id)) {
      showMsg('This order can no longer be cancelled because the kitchen has started preparing it.');
    }
    refresh();
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const raw = input.value.trim();
    if (!raw) {
      showMsg('Enter your order number, for example TB1234.');
      return;
    }
    const o = Orders.get(raw);
    if (!o || !canView(o)) {
      showMsg('No order with that number was found on your account. Check the number in your confirmation.');
      return;
    }
    showMsg('');
    select(o.id);
  });

  // Start with ?id=… or the newest order
  const fromUrl = Orders.get(new URLSearchParams(location.search).get('id'));
  if (fromUrl && canView(fromUrl)) selectedId = fromUrl.id;
  else {
    const mine = Orders.forUser(user.id);
    if (mine.length) selectedId = mine[0].id;
  }
  refresh();

  // Live updates: when staff change a status (even in another tab) this page follows.
  window.addEventListener('storage', (e) => {
    if (e.key === 'orders') refresh();
  });
  setInterval(refresh, 5000);
})();
