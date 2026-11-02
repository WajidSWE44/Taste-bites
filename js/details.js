function add(id) {
  let c = JSON.parse(localStorage.getItem('cart') || '{}');
  c[id] = (c[id] || 0) + 1;
  localStorage.setItem('cart', JSON.stringify(c));
  updateCount();
  toast('Added to your cart');
}

const id = new URLSearchParams(location.search).get('id');
const f = window.foods.find((x) => x._id === id) || window.foods[0];

if (!f) {
  document.getElementById('details').innerHTML =
    '<div class="empty">This dish could not be found. <a class="text-btn" href="menu.html">Back to menu</a></div>';
} else {
  document.getElementById('details').innerHTML = `<img src="${f.img}" alt="${f.name}">
    <section>
    <span class="tag">${f.tag}</span>
    <h1>${f.name}</h1>
    <div class="rating">
    ★ ${f.rating} • ${f.time} min prep
    </div>
    <h2>Rs. ${f.price.toLocaleString()}</h2>
    <p>${f.desc}</p>
    <p>Spice level: ${'🌶️'.repeat(f.spice) || 'None'}</p>
    <button class="btn primary big-add" onclick="add('${f._id}')">Add to Cart</button>
    </section>`;
}
