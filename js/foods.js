// The full product catalog lives in the browser's localStorage under the
// key 'products'. The first time the site loads, it's seeded from
// DEFAULT_FOODS below. From then on, anything added or deleted from the
// Admin page updates this same localStorage data — no server required.
const DEFAULT_FOODS = [
  { _id: 'p1', name: 'Truffle Margherita', cat: 'Pizza', price: 1450, rating: 4.9, tag: 'BEST SELLER', veg: true, halal: true, spice: 1, time: 20, desc: 'San Marzano tomato, creamy mozzarella, basil and aromatic truffle oil.', img: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=900&q=85' },
  { _id: 'p2', name: 'Smoky Beef Burger', cat: 'Burger', price: 950, rating: 4.8, tag: "CHEF'S PICK", veg: false, halal: true, spice: 2, time: 18, desc: 'Char-grilled beef, aged cheddar, caramelized onion and our smoky house sauce.', img: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=900&q=85' },
  { _id: 'p3', name: 'Creamy Alfredo', cat: 'Pasta', price: 1100, rating: 4.7, tag: 'POPULAR', veg: true, halal: true, spice: 1, time: 22, desc: 'Silky parmesan cream sauce tossed with pasta and roasted garlic.', img: 'https://images.unsplash.com/photo-1645112411341-6c4fd023714a?auto=format&fit=crop&w=900&q=85' },
  { _id: 'p4', name: 'Crispy Chicken', cat: 'Chicken', price: 850, rating: 4.8, tag: 'CRISPY', veg: false, halal: true, spice: 2, time: 20, desc: 'Golden crispy chicken with a seasoned coating and creamy dipping sauce.', img: 'https://images.unsplash.com/photo-1562967916-eb82221dfb92?auto=format&fit=crop&w=900&q=85' },
  { _id: 'p5', name: 'Garden Power Bowl', cat: 'Healthy', price: 780, rating: 4.6, tag: 'FRESH', veg: true, halal: true, spice: 1, time: 12, desc: 'Crunchy greens, avocado, roasted vegetables, seeds and lemon dressing.', img: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=85' },
  { _id: 'p6', name: 'Lotus Cheesecake', cat: 'Dessert', price: 650, rating: 4.9, tag: 'FAVORITE', veg: true, halal: true, spice: 0, time: 8, desc: 'Velvety cheesecake topped with caramelized biscuit crumbs.', img: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?auto=format&fit=crop&w=900&q=85' },
  { _id: 'p7', name: 'Mango Cooler', cat: 'Drinks', price: 420, rating: 4.7, tag: 'COLD', veg: true, halal: true, spice: 0, time: 5, desc: 'Fresh mango, citrus and sparkling water served over ice.', img: 'https://images.unsplash.com/photo-1546173159-315724a31696?auto=format&fit=crop&w=900&q=85' },
  { _id: 'p8', name: 'Spicy Pepperoni', cat: 'Pizza', price: 1350, rating: 4.8, tag: 'SPICY', veg: false, halal: true, spice: 3, time: 21, desc: 'Mozzarella, tomato, halal pepperoni and chili flakes.', img: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=900&q=85' }
];

function loadFoods() {
  const raw = localStorage.getItem('products');
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length) return parsed;
    } catch (e) {
      /* fall through to reseed on bad data */
    }
  }
  localStorage.setItem('products', JSON.stringify(DEFAULT_FOODS));
  return DEFAULT_FOODS.slice();
}

function saveFoods(list) {
  localStorage.setItem('products', JSON.stringify(list));
  window.foods = list;
}

// Available immediately (synchronous) — no fetch, no server, no waiting.
window.foods = loadFoods();
window.saveFoods = saveFoods;
