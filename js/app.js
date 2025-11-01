/* app.js - SPA logic, products, cart, music player, local login */
const PRODUCTS_PATH = 'data/productos.json';
const WHATSAPP_NUMBER = '5493413688248';
const WHATSAPP_BASE = `https://wa.me/${WHATSAPP_NUMBER}?text=`;

let productos = [];
let cart = {};
let user = {}; // stored in localStorage

// MUSIC
const TRACKS = Array.from({length:15}, (_,i)=>`music/tema${i+1}.mp3`);
let currentTrackIndex = 0;
const audio = document.getElementById('bg-audio') || new Audio();
audio.loop = false;
audio.preload = 'auto';

// load stored user/cart
function loadState() {
  const rawCart = localStorage.getItem('urbanfeed_cart');
  cart = rawCart ? JSON.parse(rawCart) : {};
  const rawUser = localStorage.getItem('urbanfeed_user');
  user = rawUser ? JSON.parse(rawUser) : {};
  updateCartIndicators();
}

// save cart
function saveCart() {
  localStorage.setItem('urbanfeed_cart', JSON.stringify(cart));
  updateCartIndicators();
}

// load products
async function loadProducts() {
  try {
    const res = await fetch(PRODUCTS_PATH);
    productos = await res.json();
  } catch(e) {
    console.error('Error cargando productos', e);
    productos = [];
  }
}

// render helpers
function formatMoney(n){ return '$' + n.toLocaleString('es-AR'); }

function createCard(p){
  const div = document.createElement('div');
  div.className = 'card';
  div.innerHTML = `
    <img src="img/${p.imagen}" alt="${p.nombre}">
    ${p.stock===0?'<span class="etiqueta">🔴 Agotado</span>': p.estado?`<span class="etiqueta">${p.estado==='liquidacion'?'💸':'🚀'} ${p.estado}</span>`:''}
    <h3>${p.nombre}</h3>
    <p class="price">${formatMoney(p.precio)}</p>
    <p class="tipo" style="color:rgba(255,255,255,0.65);margin-bottom:8px;text-transform:capitalize;">${p.tipo}</p>
    <div style="display:flex;gap:8px;justify-content:center;">
      <button class="btn btn-outline btn-add" data-id="${p.id}" ${p.stock===0?'disabled':''}>Agregar</button>
      <button class="btn btn-primary btn-buy" data-id="${p.id}" ${p.stock===0?'disabled':''}>Comprar</button>
    </div>
  `;
  return div;
}

function renderGrid(id, filterEstado='todos'){
  const grid = document.getElementById(id);
  if(!grid) return;
  grid.innerHTML = '';
  let list = productos.slice();
  if(filterEstado!=='todos') list = list.filter(p=>p.estado===filterEstado);
  list.forEach(p=> grid.appendChild(createCard(p)));
  attachAddButtons();
}

// attach add buttons
function attachAddButtons(){
  document.querySelectorAll('.btn-add').forEach(b=> b.onclick = ()=>{
    addToCart(b.dataset.id,1);
  });
  document.querySelectorAll('.btn-buy').forEach(b=> b.onclick = ()=>{
    addToCart(b.dataset.id,1);
    openCart();
  });
}

// cart functions
function addToCart(id, qty=1){
  const prod = productos.find(p=>p.id===id);
  if(!prod) return;
  if(!cart[id]) cart[id] = {producto:prod, qty:0};
  cart[id].qty += qty;
  if(cart[id].qty > prod.stock) cart[id].qty = prod.stock;
  saveCart();
  animateAdd();
}
function removeFromCart(id){ delete cart[id]; saveCart(); renderCart(); }
function changeQty(id, delta){
  if(!cart[id]) return;
  cart[id].qty += delta;
  if(cart[id].qty<=0) delete cart[id];
  saveCart(); renderCart();
}
function clearCart(){ cart={}; saveCart(); renderCart(); }

function updateCartIndicators(){
  const total = Object.values(cart).reduce((s,it)=>s+it.qty,0);
  document.querySelectorAll('#cart-count, #fab-cart-count').forEach(el=>{ if(el) el.textContent = total; });
}
function renderCart(){
  const container = document.getElementById('cart-items');
  container.innerHTML = '';
  let total = 0;
  const keys = Object.keys(cart);
  if(keys.length===0){
    container.innerHTML = '<p style="opacity:.8">No hay productos en el pedido.</p>';
  } else {
    keys.forEach(id=>{
      const it = cart[id];
      const p = it.producto;
      const div = document.createElement('div');
      div.className = 'cart-item';
      div.innerHTML = `
        <img src="img/${p.imagen}" alt="${p.nombre}">
        <div class="meta"><h4>${p.nombre}</h4><p>${formatMoney(p.precio)} x ${it.qty}</p></div>
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
  attachCartButtonsInCart();
}

function attachCartButtonsInCart(){
  document.querySelectorAll('.qty-plus').forEach(b=> b.onclick = ()=>{ changeQty(b.dataset.id,1); renderCart(); });
  document.querySelectorAll('.qty-minus').forEach(b=> b.onclick = ()=>{ changeQty(b.dataset.id,-1); renderCart(); });
  document.querySelectorAll('.qty-del').forEach(b=> b.onclick = ()=>{ removeFromCart(b.dataset.id); });
}

// WhatsApp order
function sendOrder(){
  const items = Object.values(cart);
  if(items.length===0){ alert('El carrito está vacío.'); return; }
  let text = `🧢 Pedido desde Urban Feed%0A`;
  let total = 0;
  items.forEach(it=>{
    text += `👕 ${it.producto.nombre} x${it.qty} — ${formatMoney(it.producto.precio * it.qty)}%0A`;
    total += it.producto.precio * it.qty;
  });
  text += `%0A💰 Total: ${formatMoney(total)}%0A%0A`;
  // add user info if exists
  if(user && user.nombre){ text += `👤 Nombre: ${user.nombre}%0A📞 Tel: ${user.telefono || ''}%0A🏠 Dirección: ${user.direccion || ''}%0A`; }
  const url = WHATSAPP_BASE + encodeURIComponent(text);
  window.open(url,'_blank');
}

// UI interactions
function bindUI(){
  // navigation SPA
  document.querySelectorAll('.nav-link').forEach(a=>{
    a.addEventListener('click', (e)=>{
      e.preventDefault();
      const dest = a.dataset.navigate;
      navigateTo(dest);
      document.getElementById('sidebar').classList.remove('open');
      document.getElementById('overlay').classList.remove('show');
    });
  });
  document.querySelectorAll('.logo-link, .logo-link-inline').forEach(a=>{
    a.addEventListener('click', (e)=>{ e.preventDefault(); navigateTo('home'); });
  });
  document.getElementById('btn-open-menu').onclick = ()=> { document.getElementById('sidebar').classList.add('open'); document.getElementById('overlay').classList.add('show'); }
  document.getElementById('btn-close-menu').onclick = ()=> { document.getElementById('sidebar').classList.remove('open'); document.getElementById('overlay').classList.remove('show'); }
  document.getElementById('overlay').onclick = ()=>{ document.getElementById('sidebar').classList.remove('open'); closeCart(); document.getElementById('overlay').classList.remove('show'); }

  // cart open
  document.querySelectorAll('#btn-open-cart, #fab-cart').forEach(b=>{ if(b) b.addEventListener('click', openCart); });
  document.getElementById('close-cart').addEventListener('click', closeCart);
  document.getElementById('clear-cart').addEventListener('click', ()=>{ if(confirm('Vaciar carrito?')){ clearCart(); renderCart(); }});
  document.getElementById('send-order').addEventListener('click', sendOrder);

  // floating links
  const wa = document.getElementById('btn-whatsapp');
  wa.href = `https://wa.me/${WHATSAPP_NUMBER}`;
  wa.innerHTML = '<img src="icons/whatsapp.svg" alt="wh" width="22">';
  const ig = document.getElementById('btn-instagram');
  ig.innerHTML = '<img src="icons/instagram.svg" alt="ig" width="22">';

  // search & filter
  const buscar = document.getElementById('buscar-products') || document.getElementById('buscar-productos');
  const selectCat = document.getElementById('categoria-filtro');
  if(buscar) buscar.addEventListener('input', ()=> filterVisibleCards(buscar.value, selectCat.value));
  if(selectCat) selectCat.addEventListener('change', ()=> filterVisibleCards(buscar.value, selectCat.value));

  // contact form
  const form = document.getElementById('consultaForm');
  if(form) form.addEventListener('submit', e=>{ e.preventDefault(); alert('Consulta enviada! Nos comunicaremos pronto.'); form.reset(); });

  // music toggle and bar
  const musicFab = document.getElementById('music-toggle');
  const musicBar = document.getElementById('music-bar');
  const musicPlay = document.getElementById('music-play');
  const musicPrev = document.getElementById('music-prev');
  const musicNext = document.getElementById('music-next');
  const musicTitle = document.getElementById('music-title');
  const musicList = document.getElementById('music-list');

  // populate list
  TRACKS.forEach((t,i)=>{
    const name = `Tema ${i+1}`;
    const el = document.createElement('div'); el.className='track-item'; el.textContent = name; el.dataset.index = i;
    el.onclick = ()=>{ loadTrack(i); playTrack(); }
    musicList.appendChild(el);
  });

  musicFab.addEventListener('click', ()=> {
    if(musicBar.classList.contains('hidden')) openMusicBar(); else closeMusicBar();
  });
  // controls
  musicPlay.addEventListener('click', ()=> {
    if(audio.paused) playTrack(); else pauseTrack();
  });
  musicPrev.addEventListener('click', ()=> { prevTrack(); });
  musicNext.addEventListener('click', ()=> { nextTrack(); });

  // close music on scroll
  window.addEventListener('scroll', ()=> { closeMusicBar(); });

  // cart fab animation
  document.getElementById('fab-cart').addEventListener('click', openCart);

  // inicial render
  updateCartIndicators();
}

// filter helper
function filterVisibleCards(q, cat){
  q = q? q.trim().toLowerCase() : '';
  document.querySelectorAll('.grid-productos').forEach(grid=>{
    Array.from(grid.children).forEach(card=>{
      const name = card.querySelector('h3')?.textContent?.toLowerCase()||'';
      const tipo = card.querySelector('.tipo')?.textContent?.toLowerCase()||'';
      const show = (name.includes(q) || tipo.includes(q)) && (cat==='todos' || tipo.includes(cat));
      card.style.display = show ? '' : 'none';
    });
  });
}

// music functions
function loadTrack(index){
  currentTrackIndex = index;
  audio.src = TRACKS[index];
  const title = `Tema ${index+1}`;
  const mt = document.getElementById('music-title');
  if(mt) mt.textContent = title;
  highlightTrack(index);
}
function highlightTrack(i){
  document.querySelectorAll('.track-item').forEach(el=> el.style.fontWeight = el.dataset.index==i ? '700' : '400');
}
function playTrack(){
  audio.play().catch(()=>{/* autoplay blocked */});
  document.getElementById('music-play').textContent = '⏸';
}
function pauseTrack(){ audio.pause(); document.getElementById('music-play').textContent = '▶️'; }
function nextTrack(){ currentTrackIndex = (currentTrackIndex+1) % TRACKS.length; loadTrack(currentTrackIndex); playTrack(); }
function prevTrack(){ currentTrackIndex = (currentTrackIndex-1 + TRACKS.length) % TRACKS.length; loadTrack(currentTrackIndex); playTrack(); }
function openMusicBar(){ document.getElementById('music-bar').classList.remove('hidden'); }
function closeMusicBar(){ document.getElementById('music-bar').classList.add('hidden'); }

// cart drawer
function openCart(){ document.getElementById('cart-drawer').classList.add('open'); document.getElementById('overlay').classList.add('show'); renderCart(); }
function closeCart(){ document.getElementById('cart-drawer').classList.remove('open'); document.getElementById('overlay').classList.remove('show'); }

// small animations
function animateAdd(){ const fab = document.getElementById('fab-cart'); if(!fab) return; fab.classList.add('pulse'); setTimeout(()=>fab.classList.remove('pulse'),400); }

// login/local user
function promptUserIfNeeded(){
  const raw = localStorage.getItem('urbanfeed_user');
  if(raw){ user = JSON.parse(raw); return; }
  const nombre = prompt('Ingrese su nombre (para acelerar compras):') || '';
  const telefono = prompt('Ingrese su teléfono:') || '';
  const direccion = prompt('Ingrese su dirección (opcional):') || '';
  if(nombre) { user = {nombre, telefono, direccion}; localStorage.setItem('urbanfeed_user', JSON.stringify(user)); }
}

// SPA navigation
function navigateTo(page){
  document.querySelectorAll('.page').forEach(p=> p.classList.add('hidden'));
  const target = document.getElementById(page);
  if(target) target.classList.remove('hidden');
  if(page==='home'){
    document.body.classList.remove('concrete-bg');
  } else {
    document.body.classList.add('concrete-bg');
  }
  if(page==='home') renderGrid('tendencia-grid');
  if(page==='catalogo') renderGrid('catalogo-grid');
  if(page==='liquidacion') renderGrid('liquidacion-grid','liquidacion');
  if(page==='lanzamientos') renderGrid('lanzamientos-grid','nuevo');
  window.scrollTo(0,0);
}

// init
async function init(){
  await loadProducts();
  loadState();
  bindUI();
  renderGrid('tendencia-grid');
  renderGrid('catalogo-grid');
  renderGrid('liquidacion-grid','liquidacion');
  renderGrid('lanzamientos-grid','nuevo');
  loadTrack(0);
  // do not autoplay; user must press, but browser may allow autoplay - play only if allowed
  // set whatsapp
  document.getElementById('btn-whatsapp').href = `https://wa.me/${WHATSAPP_NUMBER}`;
  navigateTo('home');
  renderCart();
  // prompt user to save name only if not set
  // promptUserIfNeeded(); // commented so user won't be forced; they can be prompted when buying
}

document.addEventListener('DOMContentLoaded', init);
