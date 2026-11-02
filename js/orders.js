// ---------------------------------------------------------------
// Orders store (localStorage key: 'orders')
//
// order = {
//   id: 'TB1234', userId, userEmail, name, phone, address,
//   items: [{ id, name, price, qty, img }],
//   subtotal, delivery, total,
//   status: 'placed' | 'confirmed' | 'preparing' | 'out_for_delivery' | 'delivered' | 'cancelled',
//   history: [{ status, at }],
//   createdAt
// }
// ---------------------------------------------------------------
(function () {
  const KEY = 'orders';
  const ETA_MINUTES = 40;

  // The normal journey of an order, in order.
  const STEPS = [
    { key: 'placed', label: 'Order placed', desc: "We've received your order." },
    { key: 'confirmed', label: 'Order confirmed', desc: 'The kitchen has accepted it.' },
    { key: 'preparing', label: 'Preparing your food', desc: 'Our chefs are cooking it fresh.' },
    { key: 'out_for_delivery', label: 'Out for delivery', desc: 'Your rider is on the way.' },
    { key: 'delivered', label: 'Delivered', desc: 'Enjoy your meal!' }
  ];
  const CANCELLED = { key: 'cancelled', label: 'Cancelled' };

  function all() {
    try {
      const list = JSON.parse(localStorage.getItem(KEY));
      return Array.isArray(list) ? list : [];
    } catch (e) {
      return [];
    }
  }
  function saveAll(list) {
    localStorage.setItem(KEY, JSON.stringify(list));
  }

  function newId(existing) {
    let id;
    do {
      id = 'TB' + Math.floor(1000 + Math.random() * 9000);
    } while (existing.some((o) => o.id === id));
    return id;
  }

  function create({ user, name, phone, address, items, subtotal, delivery }) {
    const list = all();
    const now = new Date().toISOString();
    const order = {
      id: newId(list),
      userId: user.id,
      userEmail: user.email,
      name,
      phone,
      address,
      items,
      subtotal,
      delivery,
      total: subtotal + delivery,
      status: 'placed',
      history: [{ status: 'placed', at: now }],
      createdAt: now
    };
    list.unshift(order);
    saveAll(list);
    return order;
  }

  function normalizeId(id) {
    return String(id || '').trim().replace(/^#/, '').toUpperCase();
  }

  function get(id) {
    const clean = normalizeId(id);
    return all().find((o) => o.id === clean) || null;
  }

  function forUser(userId) {
    return all().filter((o) => o.userId === userId);
  }

  function setStatus(id, status) {
    const list = all();
    const o = list.find((x) => x.id === id);
    if (!o || o.status === status) return o || null;
    o.status = status;
    o.history.push({ status, at: new Date().toISOString() });
    saveAll(list);
    return o;
  }

  function canCancel(o) {
    return o.status === 'placed' || o.status === 'confirmed';
  }

  // Customers can cancel their own order until the kitchen starts cooking.
  function cancel(id, userId) {
    const o = get(id);
    if (!o || o.userId !== userId || !canCancel(o)) return null;
    return setStatus(o.id, 'cancelled');
  }

  function stepIndex(status) {
    return STEPS.findIndex((s) => s.key === status);
  }

  function nextStatus(o) {
    const i = stepIndex(o.status);
    return i >= 0 && i < STEPS.length - 1 ? STEPS[i + 1] : null;
  }

  function label(status) {
    const s = STEPS.find((x) => x.key === status);
    return s ? s.label : status === 'cancelled' ? CANCELLED.label : status;
  }

  function isActive(o) {
    return o.status !== 'delivered' && o.status !== 'cancelled';
  }

  function eta(o) {
    return new Date(new Date(o.createdAt).getTime() + ETA_MINUTES * 60000);
  }

  function statusTime(o, status) {
    const h = o.history.find((x) => x.status === status);
    return h ? h.at : null;
  }

  window.Orders = {
    STEPS, CANCELLED, ETA_MINUTES,
    all, create, get, forUser, setStatus, cancel, canCancel,
    stepIndex, nextStatus, label, isActive, eta, statusTime
  };
})();
