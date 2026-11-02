let category = 'All';
const chips = document.getElementById('chips');
const cats = ['All', 'Pizza', 'Burger', 'Pasta', 'Chicken', 'Healthy', 'Dessert', 'Drinks'];

cats.forEach((c) => {
  const b = document.createElement('button');
  b.className = 'chip ' + (c === 'All' ? 'active' : '');
  b.textContent = c;
  b.onclick = () => {
    category = c;
    document.querySelectorAll('.chip').forEach((x) => x.classList.remove('active'));
    b.classList.add('active');
    render();
  };
  chips.appendChild(b);
});

function addCart(id) {
  let c = JSON.parse(localStorage.getItem('cart') || '{}');
  c[id] = (c[id] || 0) + 1;
  localStorage.setItem('cart', JSON.stringify(c));
  updateCount();
  toast('Added to your cart');
}

function render() {
  const q = document.getElementById('search').value.toLowerCase(),
    veg = document.getElementById('veg').checked,
    halal = document.getElementById('halal').checked;
  let a = window.foods.filter(
    (f) =>
      (category === 'All' || f.cat === category) &&
      f.name.toLowerCase().includes(q) &&
      (!veg || f.veg) &&
      (!halal || f.halal)
  );
  const s = document.getElementById('sort').value;
  if (s === 'priceLow') a.sort((x, y) => x.price - y.price);
  if (s === 'priceHigh') a.sort((x, y) => y.price - x.price);
  if (s === 'rating') a.sort((x, y) => y.rating - x.rating);
  document.getElementById('menuGrid').innerHTML = a.length
    ? a.map(card).join('')
    : '<div class="empty">No dishes match your search.</div>';
}

function card(f) {
  return `<article class="food-card">
    <img src="${f.img}" alt="${f.name}" loading="lazy">
    <div class="food-info">
    <span class="tag">${f.tag}</span>
    <h3>${f.name}</h3>
    <p>${f.desc}</p>
    <div class="food-meta">
    <span class="rating">★ ${f.rating}</span>
    <span class="price">Rs. ${f.price.toLocaleString()}</span>
    </div>
    <div class="card-actions">
    <a class="view" href="details.html?id=${f._id}">View details</a>
    <button class="add" onclick="addCart('${f._id}')">Add to Cart</button>
    </div>
    </div>
    </article>`;
}

['search', 'sort', 'veg', 'halal'].forEach((id) =>
  document.getElementById(id).addEventListener('input', render)
);

render();
