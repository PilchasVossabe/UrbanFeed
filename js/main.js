// main.js - carga productos, filtros y carrito (localStorage)
// Ajusta PRODUCTS_PATH si no usas carpeta /data
const PRODUCTS_PATH = 'data/productos.json';
const WHATSAPP_NUMBER = '5493413688248';
const WHATSAPP_BASE = `https://wa.me/${WHATSAPP_NUMBER}?text=`;

let productos = [];
let cart = {}; // id => {producto, qty}

function formatMoney(n) {
  return '$' + n.toLocaleString('es-AR');
}

async function loadProducts() {
  try {
    const res = await fetch(PRODUCTS_PATH);
    productos = await res.json();
  } catch (e) {
    console.error('Error cargando productos:', e);
    productos = [];
  }
}

function renderGrid(id, filterEstado = 'todos') {
  const grid = document.getElementById(id);
  if (!grid) return;
  grid.innerHTML = '';
  let lista = productos.slice();
  if (filterEstado !== 'todos') {
    lista = lista.filter(p => p.estado === filterEstado);
  }
  lista.forEach(p => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <img src="images/${p.imagen}" alt="${p.nombre}">
      ${p.estado ? `<span class="etiqueta">${p.estado === 'liquidacion' ? '💸' : '🚀'} ${p.estado}</span>` : ''}
      <h3>${p.nombre}</h3>
      <p class="price">${formatMoney(p.precio)}</p>
      <p class="tipo" style="color:rgba(255,255,255,0.65);margin-bottom:8px;text-transform:capitalize;">${p.tipo}</p>
      <div style="display:flex;gap:8px;justify-content:center;">
        <button class="btn btn-outline btn-add" data-id="${p.id}">Agregar</button>
        <button class="btn btn-primary btn-add-quick" data-id="${p.id}">Comprar</button>
      </div>
    `;
    grid.appendChild(card);
  });
  attachAddButtons();
}

function attachAddButtons() {
  document.querySelectorAll('.btn-add').forEach(btn => {
    btn.onclick = () => {
      const id = btn.getAttribute('data-id');
      addToCart(id, 1);
    };
  });
  document.querySelectorAll('.btn-add-quick').forEach(btn => {
    btn.onclick = () => {
      const id = btn.getAttribute('data-id');
      addToCart(id, 1);
      openCart();
    };
  });
}

function loadCartFromStorage() {
  const raw = localStorage.getItem('urbanfeed_cart');
  cart = raw ? JSON.parse(raw) : {};
  updateCartIndicators();
}

function saveCartToStorage() {
  localStorage.setItem('urbanfeed_cart', JSON.stringify(cart));
  updateCartIndicators();
}

function addToCart(id, qty = 1) {
  const prod = productos.find(p => p.id === id);
  if (!prod) return;
  if (!cart[id]) {
    cart[id] = { producto: prod, qty: 0 };
  }
  cart[id].qty += qty;
  if (cart[id].qty < 1) delete cart[id];
  saveCartToStorage();
  animateAddToCart();
}

function removeFromCart(id) {
  delete cart[id];
  saveCartToStorage();
}

function changeQty(id, delta) {
  if (!cart[id]) return;
  cart[id].qty += delta;
  if (cart[id].qty <= 0) removeFromCart(id);
  saveCartToStorage();
}

function clearCart() {
  cart = {};
  saveCartToStorage();
}

function updateCartIndicators() {
  const totalCount = Object.values(cart).reduce((s, it) => s + it.qty, 0);
  document.querySelectorAll('#cart-count, #fab-cart-count, #cart-count').forEach(el => {
    el.textContent = totalCount;
  });
  const fabCount = document.getElementById('fab-cart-count');
  if (fabCount) fabCount.textContent = totalCount;
}

function renderCart() {
  const container = document.getElementById('cart-items');
  container.innerHTML = '';
  let total = 0;
  const keys = Object.keys(cart);
  if (keys.length === 0) {
    container.innerHTML = '<p style="opacity:0.8">No hay productos en el pedido.</p>';
  } else {
    keys.forEach(id => {
      const it = cart[id];
      const p = it.producto;
      const div = document.createElement('div');
      div.className = 'cart-item';
      div.innerHTML = `
        <img src="images/${p.imagen}" alt="${p.nombre}">
        <div class="meta">
          <h4>${p.nombre}</h4>
          <p>${formatMoney(p.precio)} x ${it.qty}</p>
        </div>
        <div class="qty">
          <button class="qty-minus" data-id="${id}">-</button>
          <span>${it.qty}</span>
          <button class="qty-plus" data-id="${id}">+</button>
          <button class="qty-del" data-id="${id}" style="background:transparent;border:none;color:#f55;margin-left:6px;cursor:pointer;">✕</button>
        </div>
      `;
      container.appendChild(div);
      total += p.precio * it.qty;
    });
  }
  document.getElementById('cart-total').textContent = formatMoney(total);
  attachCartButtons();
}

function attachCartButtons() {
  document.querySelectorAll('.qty-plus').forEach(b => b.onclick = () => {
    changeQty(b.dataset.id, 1);
    renderCart();
  });
  document.querySelectorAll('.qty-minus').forEach(b => b.onclick = () => {
    changeQty(b.dataset.id, -1);
    renderCart();
  });
  document.querySelectorAll('.qty-del').forEach(b => b.onclick = () => {
    removeFromCart(b.dataset.id);
    renderCart();
  });
}

function animateAddToCart() {
  const fab = document.getElementById('fab-cart');
  if (!fab) return;
  fab.classList.add('pulse');
  setTimeout(()=> fab.classList.remove('pulse'), 400);
}

function openCart() {
  document.getElementById('cart-drawer').classList.add('open');
  document.getElementById('overlay').classList.add('show');
  renderCart();
}
function closeCart() {
  document.getElementById('cart-drawer').classList.remove('open');
  document.getElementById('overlay').classList.remove('show');
}

function sendOrderViaWhatsApp() {
  const items = Object.values(cart);
  if (items.length === 0) {
    alert('El carrito está vacío.');
    return;
  }
  let text = `Hola Urban Feed 👋, quiero hacer el siguiente pedido:%0A`;
  let total = 0;
  items.forEach(it => {
    text += `- ${it.producto.nombre} x${it.qty} - ${formatMoney(it.producto.precio * it.qty)}%0A`;
    total += it.producto.precio * it.qty;
  });
  text += `%0ATotal: ${formatMoney(total)}%0A%0ADatos:%0ANombre:%0ATeléfono:%0ADirección:%0A`;
  const url = WHATSAPP_BASE + encodeURIComponent(text);
  window.open(url, '_blank');
}

function bindUI() {
  const btnOpen = document.getElementById('btn-open-menu');
  const btnClose = document.getElementById('btn-close-menu');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('overlay');

  if(btnOpen) btnOpen.onclick = () => {
    sidebar.classList.add('open');
    overlay.classList.add('show');
  };
  if(btnClose) btnClose.onclick = () => {
    sidebar.classList.remove('open');
    overlay.classList.remove('show');
  };
  if(overlay) overlay.onclick = () => {
    sidebar.classList.remove('open');
    closeCart();
    overlay.classList.remove('show');
  };

  document.querySelectorAll('#btn-open-cart, #fab-cart, #btn-open-cart').forEach(b => {
    if (b) b.onclick = () => openCart();
  });
  const fabCart = document.getElementById('fab-cart');
  if (fabCart) fabCart.onclick = () => openCart();

  document.getElementById('close-cart')?.addEventListener('click', closeCart);
  document.getElementById('clear-cart')?.addEventListener('click', () => {
    if (confirm('Vaciar carrito?')) { clearCart(); renderCart(); }
  });
  document.getElementById('send-order')?.addEventListener('click', sendOrderViaWhatsApp);

  const form = document.getElementById('consultaForm');
  if (form) {
    form.addEventListener('submit', e => {
      e.preventDefault();
      alert('Consulta enviada! Nos comunicaremos pronto.');
      form.reset();
    });
  }

  const buscar = document.getElementById('buscar-productos');
  const selectCat = document.getElementById('categoria-filtro');

  if (buscar) {
    buscar.addEventListener('input', () => {
      const q = buscar.value.trim().toLowerCase();
      document.querySelectorAll('.grid-productos').forEach(grid => {
        const cards = Array.from(grid.children);
        cards.forEach(card => {
          const name = card.querySelector('h3')?.textContent?.toLowerCase() || '';
          const tipo = card.querySelector('.tipo')?.textContent?.toLowerCase() || '';
          const show = (name.includes(q) || tipo.includes(q)) && (selectCat.value === 'todos' || tipo.includes(selectCat.value));
          card.style.display = show ? '' : 'none';
        });
      });
    });
  }
  if (selectCat) {
    selectCat.addEventListener('change', () => {
      const val = selectCat.value;
      document.querySelectorAll('.grid-productos').forEach(grid => {
        const cards = Array.from(grid.children);
        cards.forEach(card => {
          const tipo = card.querySelector('.tipo')?.textContent?.toLowerCase() || '';
          const show = (val === 'todos') || tipo.includes(val);
          card.style.display = show ? '' : 'none';
        });
      });
    });
  }

  // music toggle
  const musicToggle = document.getElementById('music-toggle') || document.getElementById('music-toggle');
  const musicFab = document.getElementById('music-toggle') || document.getElementById('music-toggle');
  const musicBtn = document.getElementById('music-toggle') || document.getElementById('music-toggle');
  const bgAudio = document.getElementById('bg-audio');

  // new unified control (button id may be music-toggle or music-toggle in other pages)
  const mBtn = document.getElementById('music-toggle') || document.getElementById('music-toggle') || document.getElementById('music-toggle');
  const mFab = document.getElementById('music-toggle') || document.getElementById('music-toggle') || document.getElementById('music-toggle');
  const fabMusic = document.getElementById('music-toggle') || document.getElementById('music-toggle');

  const controlMusic = document.getElementById('music-toggle') || document.getElementById('music-toggle') || document.getElementById('music-toggle') || document.getElementById('music-toggle') || document.getElementById('music-toggle');
  const musicButton = document.getElementById('music-toggle') || document.getElementById('music-toggle') || document.getElementById('music-toggle') || document.getElementById('music-toggle');

  const musicButtonFinal = document.getElementById('music-toggle') || document.getElementById('music-toggle') || document.getElementById('music-toggle');

  document.querySelectorAll('.music-fab, #music-toggle').forEach(b => {
    if(!b) return;
    b.addEventListener('click', () => {
      const audio = document.getElementById('bg-audio');
      if(!audio) return;
      if (audio.paused) {
        audio.play().catch(()=>{ /* autoplay blocked */ });
        b.textContent = '🔇';
        b.classList.add('playing');
      } else {
        audio.pause();
        b.textContent = '🎵';
        b.classList.remove('playing');
      }
    });
  });
}

async function init() {
  await loadProducts();
  renderGrid('tendencia-grid');
  renderGrid('catalogo-grid');
  renderGrid('liquidacion-grid', 'liquidacion');
  renderGrid('lanzamientos-grid', 'nuevo');

  loadCartFromStorage();
  renderCart();
  bindUI();
}

document.addEventListener('DOMContentLoaded', init);
