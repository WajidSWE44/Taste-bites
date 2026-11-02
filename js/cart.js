function save(c) {
  localStorage.setItem('cart', JSON.stringify(c));
  render();
  updateCount();
}
function change(id, n) {
  let c = JSON.parse(localStorage.getItem('cart') || '{}');
  c[id] = (c[id] || 0) + n;
  if (c[id] <= 0) delete c[id];
  save(c);
}
function clearCart() {
  save({});
}

function setCartError(fieldId, message) {
  const field = document.getElementById(fieldId).closest('.field');
  field.classList.toggle('error', Boolean(message));
  field.querySelector('.field-error').textContent = message || '';
}


// Shown inside the order summary: the delivery form for logged-in customers,
// or a prompt to log in / sign up first.
function checkoutBlock() {
  const user = Auth.currentUser();
  if (!user) {
    return `<div class="login-gate">
      <h3>Log in to place your order</h3>
      <p>Your cart is saved. Log in or create an account so you can track this order after you place it.</p>
      <div class="gate-actions">
        <a class="btn primary" href="login.html?next=cart.html">Log in</a>
        <a class="btn ghost" href="signup.html?next=cart.html">Sign up</a>
      </div>
    </div>`;
  }
  return `<div class="delivery-details">
      <h3>Delivery details</h3>
      <div id="cartStatusMsg" class="status-msg"></div>
      <div class="field">
        <label for="oName">Full name</label>
        <input id="oName" type="text" placeholder="Your name" value="${escapeHtml(user.name)}" required>
        <small class="field-error"></small>
      </div>
      <div class="field">
        <label for="oAddress">Delivery address</label>
        <textarea id="oAddress" rows="2" placeholder="House / street, area, city" required></textarea>
        <small class="field-error"></small>
      </div>
      <div class="field">
        <label for="oPhone">Phone number</label>
        <input id="oPhone" type="tel" placeholder="+92 3XX XXXXXXX" value="${escapeHtml(user.phone || '')}" required>
        <small class="field-error"></small>
      </div>
    </div>

    <button class="btn primary big-add" onclick="order()">Place Order</button>`;
}

function render() {
  const c = JSON.parse(localStorage.getItem('cart') || '{}'),
    ids = Object.keys(c);
  if (!ids.length) {
    document.getElementById('cartArea').innerHTML =
      '<div class="empty cart-box">Your cart is empty.<br><br><a class="btn primary" href="menu.html">Browse Menu</a></div>';
    return;
  }
  let sub = 0;
  let items = ids
    .map((id) => {
      const f = window.foods.find((x) => x._id === id);
      if (!f) return ''; // item no longer exists in the menu (e.g. removed by admin)
      const q = c[id];
      sub += f.price * q;
      return `<div class="cart-item">
        <img src="${f.img}">
        <div style="flex:1">
        <h3>${f.name}</h3><small>Rs. ${f.price.toLocaleString()} each</small>
        </div>
        <div class="qty">
        <button onclick="change('${id}',-1)">−</button>
         ${q} 
        <button onclick="change('${id}',1)">+</button>
        </div>
        <strong>Rs. ${(f.price * q).toLocaleString()}</strong>
        </div>`;
    })
    .join('');
  const delivery = 150,
    total = sub + delivery;
  document.getElementById('cartArea').innerHTML = `<div class="cart-box">${items}
    <button class="text-btn" onclick="clearCart()" style="margin-top:20px">
    Clear cart
    </button>
    </div>
    <aside class="summary">
    <h2>Order summary</h2>
    <div class="total">
     <span>Subtotal</span>
     <span>Rs. ${sub.toLocaleString()}</span>
    </div>
     <div class="total"><span>Delivery</span>
     <span>Rs. ${delivery}</span>
    </div>
    <div class="total grand">
     <span>Total</span>
     <span>Rs. ${total.toLocaleString()}</span>
    </div>

    ${checkoutBlock()}
    </aside>`;
}

function validateOrderDetails(data) {
  let ok = true;

  if (!data.name.trim()) {
    setCartError('oName', 'Please enter your name.');
    ok = false;
  } else setCartError('oName', '');

  if (!data.address.trim()) {
    setCartError('oAddress', 'Please enter a delivery address.');
    ok = false;
  } else setCartError('oAddress', '');

  const phoneOk = /^[0-9+\-\s]{7,}$/.test(data.phone.trim());
  if (!phoneOk) {
    setCartError('oPhone', 'Please enter a valid phone number.');
    ok = false;
  } else setCartError('oPhone', '');

  return ok;
}

function order() {
  const user = Auth.currentUser();
  if (!user) {
    location.href = 'login.html?next=cart.html';
    return;
  }

  const data = {
    name: document.getElementById('oName').value,
    address: document.getElementById('oAddress').value,
    phone: document.getElementById('oPhone').value
  };

  if (!validateOrderDetails(data)) {
    const statusMsg = document.getElementById('cartStatusMsg');
    statusMsg.textContent = 'Please fix the fields below before placing your order.';
    statusMsg.className = 'status-msg show bad';
    return;
  }

  // Snapshot the cart into the order (prices stay as they were at checkout)
  const cart = JSON.parse(localStorage.getItem('cart') || '{}');
  const items = Object.keys(cart)
    .map((id) => {
      const f = window.foods.find((x) => x._id === id);
      return f ? { id, name: f.name, price: f.price, qty: cart[id], img: f.img } : null;
    })
    .filter(Boolean);
  if (!items.length) return;

  const subtotal = items.reduce((n, i) => n + i.price * i.qty, 0);
  const placed = Orders.create({
    user,
    name: data.name.trim(),
    phone: data.phone.trim(),
    address: data.address.trim(),
    items,
    subtotal,
    delivery: 150
  });

  clearCart();
  document.getElementById('cartArea').innerHTML =
    '<div class="empty cart-box"><h2>✅ Order confirmed!</h2><p>Thanks, ' +
    escapeHtml(data.name.trim().split(' ')[0]) +
    ' — your order will be delivered to:</p><p><strong>' +
    escapeHtml(data.address) +
    '</strong></p><p>We\'ll call ' +
    escapeHtml(data.phone) +
    ' if anything comes up.</p><p>Order #' +
    placed.id +
    ' • Estimated time: 30–40 minutes</p>' +
    '<a class="btn primary" href="track.html?id=' + placed.id + '">Track this order</a> ' +
    '<a class="btn ghost" href="menu.html">Back to Menu</a></div>';
}

render();