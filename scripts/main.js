// =========================================================
// 1. DATA: PRODUCTOS
// =========================================================
const products = [
    { id: 1, name: "Chaqueta Bomber Street", price: 95.00, category: "Conjuntos", isFeatured: true, isLiquidacion: false, image: "images/chaqueta_bomber.jpg" },
    { id: 2, name: "Gorra Snapback Urban", price: 25.00, category: "Accesorios", isFeatured: true, isLiquidacion: true, image: "images/gorra_snapback.jpg" },
    { id: 3, name: "Hoodie Neón", price: 70.00, category: "Buzos", isFeatured: true, isLiquidacion: false, image: "images/hoodie_neon.jpg" },
    { id: 4, name: "T-Shirt Gráfico Rap", price: 35.00, category: "Remeras", isFeatured: true, isLiquidacion: false, image: "images/tshirt_grafico.jpg" },
    { id: 5, name: "Jogger Cargo Slim", price: 60.00, category: "Pantalones", isFeatured: false, isLiquidacion: true, image: "images/jogger_cargo.jpg" },
    { id: 6, name: "Bermuda Street Mesh", price: 45.00, category: "Shorts", isFeatured: false, isLiquidacion: false, image: "images/bermuda_mesh.jpg" },
    { id: 7, name: "Conjunto Deportivo Black", price: 110.00, category: "Conjuntos", isFeatured: false, isLiquidacion: false, image: "images/conjunto_dep.jpg" },
    { id: 8, name: "Riñonera Táctica", price: 30.00, category: "Accesorios", isFeatured: false, isLiquidacion: true, image: "images/rinonera_tactica.jpg" },
    { id: 9, name: "Camiseta Vintage 90s", price: 40.00, category: "Remeras", isFeatured: false, isLiquidacion: false, image: "images/camiseta_vintage.jpg" }
];

// =========================================================
// 2. LÓGICA DE NAVEGACIÓN (SPA)
// =========================================================
let currentActivePage = 'INICIO';

function navigateTo(targetPage) {
    if (targetPage === currentActivePage) return; 

    const pages = {
        'INICIO': ['page-inicio', 'main-footer'],
        'CATÁLOGO': ['page-catalog-filters', 'main-footer'],
        'LIQUIDACIÓN': ['page-liquidacion', 'main-footer'],
        'CONTACTO': ['page-contacto', 'main-footer']
    };

    const sectionsToShow = pages[targetPage] || pages['INICIO'];

    document.querySelectorAll('.content-page, #main-footer').forEach(element => {
        element.classList.add('closed');
    });

    sectionsToShow.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.classList.remove('closed');
        }
    });

    document.querySelectorAll('.top-nav-center .nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.dataset.target === targetPage) {
            link.classList.add('active');
        }
    });

    currentActivePage = targetPage;
}

// =========================================================
// 3. RENDERIZACIÓN DE PRODUCTOS
// =========================================================
function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.innerHTML = `
        <img src="${product.image || 'images/default.jpg'}" alt="${product.name}">
        <div class="product-info">
            <h3>${product.name}</h3>
            <p>$${product.price.toFixed(2)}</p>
            <button class="neon-btn buy-btn" data-product-id="${product.id}">AÑADIR AL CARRITO</button>
        </div>
    `;
    return card;
}

function renderProducts(productList, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';
    productList.forEach(product => {
        container.appendChild(createProductCard(product));
    });
}

function setupCatalogFilters() {
    const filterContainer = document.getElementById('category-filter-buttons');
    if (!filterContainer) return;

    filterContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('category-btn')) {
            const category = e.target.dataset.category;

            document.querySelectorAll('.category-btn').forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');

            const filteredProducts = products.filter(p => category === 'ALL' || p.category === category);
            renderProducts(filteredProducts, 'catalog-product-list');

            const titleElement = document.getElementById('catalog-title-display');
            if (titleElement) {
                titleElement.textContent = category === 'ALL' ? 'TODOS LOS PRODUCTOS' : category.toUpperCase();
            }
        }
    });

    renderProducts(products, 'catalog-product-list');
}

// =========================================================
// 4. LÓGICA DEL CARRITO Y MODALES
// =========================================================
let cart = [];
const overlay = document.getElementById('overlay');

function getCart() {
    const storedCart = localStorage.getItem('urbanFeedCart');
    return storedCart ? JSON.parse(storedCart) : [];
}
function saveCart(newCart) {
    localStorage.setItem('urbanFeedCart', JSON.stringify(newCart));
    cart = newCart;
    updateCartDisplay();
}

function updateCartDisplay() {
    const cartList = document.getElementById('cart-items-list');
    const cartTotalElement = document.getElementById('cart-total');
    const cartCountElement = document.getElementById('cart-count');
    
    if (!cartList || !cartTotalElement || !cartCountElement) return;

    cartList.innerHTML = '';
    let total = 0;
    let count = 0;

    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        count += item.quantity;

        const listItem = document.createElement('div');
        listItem.className = 'cart-item';
        listItem.innerHTML = `
            <p>${item.name} (${item.quantity})</p>
            <p>$${itemTotal.toFixed(2)}</p>
            <button class="remove-item-btn" data-product-id="${item.id}"><i class="fas fa-times"></i></button>
        `;
        cartList.appendChild(listItem);
    });

    cartTotalElement.textContent = `$${total.toFixed(2)}`;
    cartCountElement.textContent = count;
    
    const checkoutBtn = document.getElementById('open-checkout-modal-btn');
    if(checkoutBtn) {
        // Deshabilita si el carrito está vacío
        checkoutBtn.disabled = cart.length === 0;
    }
}

function addToCart(productId) {
    const product = products.find(p => p.id === parseInt(productId));
    if (!product) return;

    const existingItem = cart.find(item => item.id === product.id);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ id: product.id, name: product.name, price: product.price, quantity: 1 });
    }
    
    saveCart(cart);
    showNotification(`${product.name} añadido al carrito!`);
}

function removeFromCart(productId) {
    const index = cart.findIndex(item => item.id === parseInt(productId));
    if (index !== -1) {
        if (cart[index].quantity > 1) {
            cart[index].quantity -= 1;
        } else {
            cart.splice(index, 1);
        }
    }
    
    saveCart(cart);
}

// LÓGICA DE APERTURA DEL MODAL (VERIFICADA Y CORREGIDA)
function openModal(modalId) {
    closeModal(); 
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('visible');
        modal.classList.remove('closed'); 
        
        overlay.classList.add('visible');
        overlay.classList.remove('closed'); 
    }
}

// LÓGICA DE CIERRE DEL MODAL (VERIFICADA)
function closeModal() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.remove('visible');
        modal.classList.add('closed');
    });
    overlay.classList.remove('visible');
    overlay.classList.add('closed');
}

// ==========================================================
// MÓDULO DE REPRODUCTOR DE MÚSICA (Playlist) - CORREGIDO DEFINITIVO
// ==========================================================

const musicAudio = document.getElementById('background-music');
const musicBar = document.getElementById('music-player-bar');
const musicToggleButton = document.getElementById('music-toggle-btn');
const nextSongButton = document.getElementById('next-song-btn'); 
const musicTitleDisplay = musicBar.querySelector('span');
let currentSongIndex = 0;
let isPlaying = false;

// LISTA DE REPRODUCCIÓN (¡RUTA CORREGIDA! Eliminado el "../")
const playlist = [
    { title: "Doja Cat", file: "audio/track5.mp3" }, 
    { title: "To ke ver", file: "audio/track2.mp3" }, 
    { title: "Tanto Desorden", file: "audio/track3.mp3" }, 
    { title: "Agarro la pala", file: "audio/track13.mp3" }, 
    { title: "Cerounno", file: "audio/track14.mp3" }, 
    { title: "Jere Klein", file: "audio/track12.mp3" }, 
    { title: "Mala Junta ft Duko", file: "audio/track15.mp3" }, 
    { title: "Cerounno", file: "audio/track11.mp3" },
    { title: "Benjitaalkapone", file: "audio/track10.mp3" }, 
    { title: "YG", file: "audio/track9.mp3" },
    { title: "Mo Bamba", file: "audio/track8.mp3" },
    { title: "Nle Shotta Flow", file: "audio/track7.mp3" },
    { title: "Snoop Dogg", file: "audio/track6.mp3" },
    { title: "Mambinho Brasilero", file: "audio/track1.mp3" },
    { title: "Nati", file: "audio/track4.mp3" }
];

function loadAndPlaySong() {
    if (playlist.length === 0) return;

    // Asegura que el índice esté dentro del rango del array y vuelva a 0 si llega al final
    if (currentSongIndex >= playlist.length) {
        currentSongIndex = 0; 
    }

    const song = playlist[currentSongIndex];
    
    // *** ANTI-CACHÉ: Agregamos un timestamp único para obligar al navegador a cargar el nuevo archivo ***
    const antiCacheURL = `${song.file}?t=${new Date().getTime()}`;
    
    // Asigna la fuente usando la URL con anti-cache
    musicAudio.src = antiCacheURL; 
    musicTitleDisplay.textContent = `▶️ ${song.title}`; 
    
    musicAudio.load();
    
    if (isPlaying) {
        // Intenta reproducir, captura errores de Autoplay
        musicAudio.play().catch(error => {
            console.warn("El navegador bloqueó el AutoPlay o hubo un error de códec. El usuario debe interactuar.", error);
        });
    }
}

function toggleMusic() {
    if (isPlaying) {
        // Pausar y cerrar
        musicAudio.pause();
        musicBar.classList.add('closed');
        musicToggleButton.innerHTML = '<i class="fas fa-volume-off"></i>';
        isPlaying = false;
    } else {
        // Reproducir y abrir
        if (!musicAudio.src || musicAudio.src.includes('audio/cancion_1.mp3')) {
            // Si es la primera vez, carga la canción actual
            loadAndPlaySong(); 
        }
        
        musicAudio.play().catch(error => {
            console.warn("Error de AutoPlay al intentar reproducir.", error);
        });

        musicBar.classList.remove('closed');
        musicToggleButton.innerHTML = '<i class="fas fa-volume-up"></i>';
        isPlaying = true;
    }
}

function playNextSong() {
    currentSongIndex++; 
    loadAndPlaySong(); 
}

// Lógica de "Canción Terminada" (El evento clave para la reproducción continua)
musicAudio.addEventListener('ended', playNextSong);

// Inicialización de Eventos de Música
musicToggleButton.addEventListener('click', toggleMusic);
nextSongButton.addEventListener('click', (e) => {
    e.stopPropagation(); 
    playNextSong();
});

// Carga inicial para mostrar el título en la barra al cargar la página
if (playlist.length > 0) {
    musicTitleDisplay.textContent = `🎧 ${playlist[currentSongIndex].title}`;
}

// =========================================================
// 6. EVENT LISTENERS
// =========================================================
document.addEventListener('click', (e) => {
    // 1. Navegación SPA
    if (e.target.classList.contains('nav-link')) {
        e.preventDefault();
        navigateTo(e.target.dataset.target);
    }
    
    // 2. Comprar (Añadir al carrito)
    if (e.target.classList.contains('buy-btn')) {
        addToCart(e.target.dataset.productId);
    }

    // 3. Remover del carrito
    if (e.target.classList.contains('remove-item-btn') || e.target.closest('.remove-item-btn')) {
        const btn = e.target.closest('.remove-item-btn');
        if(btn) {
            removeFromCart(btn.dataset.productId);
        }
    }

    // 4. Control de Modales (Cerrar)
    if (e.target.classList.contains('close-modal-btn') || e.target.closest('.close-modal-btn') || e.target.id === 'overlay') {
        closeModal();
    }
    
    // 5. Abrir Modal de Checkout
    if (e.target.id === 'open-checkout-modal-btn') {
        openModal('checkout-modal');
    }
    
    // 6. Control del Botón Flotante de Música
    if (e.target.id === 'music-toggle-btn' || e.target.closest('#music-toggle-btn')) {
        toggleMusicPlayer();
    }

    // 7. Generar Mensaje de WhatsApp
    if (e.target.closest('#checkout-form')) {
        e.preventDefault();
        
        const name = document.getElementById('checkout-name').value;
        const address = document.getElementById('checkout-address').value;
        const contact = document.getElementById('checkout-contact').value;
        
        if (!name || !address || !contact || cart.length === 0) {
            alert('Por favor, completa todos los campos y añade artículos al carrito.');
            return;
        }

        let orderSummary = "¡Hola UrbanFeed! Quiero realizar un pedido:\n\n";
        orderSummary += "---------------------------------------\n";
        orderSummary += "DATOS DE ENVÍO:\n";
        orderSummary += `👤 *Cliente:* ${name}\n`;
        orderSummary += `🏠 *Dirección:* ${address}\n`;
        orderSummary += `📞 *Contacto:* ${contact}\n`;
        orderSummary += "---------------------------------------\n";
        orderSummary += "PEDIDO:\n";

        let total = 0;
        cart.forEach(item => {
            const itemTotal = item.price * item.quantity;
            total += itemTotal;
            orderSummary += ` • ${item.name} x${item.quantity} ($${itemTotal.toFixed(2)})\n`;
        });

        orderSummary += "---------------------------------------\n";
        orderSummary += `💵 *TOTAL A PAGAR: $${total.toFixed(2)}*\n`;
        orderSummary += "---------------------------------------\n\n";
        orderSummary += "_Por favor, confirma stock y coordina el pago y envío. ¡Gracias!_";

        const whatsappUrl = `https://wa.me/5493413688248?text=${encodeURIComponent(orderSummary)}`;
        
        window.open(whatsappUrl, '_blank');
        
        // Opcional: Limpiar carrito y cerrar modales después de enviar
        // cart = [];
        // saveCart(cart);
        // closeModal();
    }
});


document.addEventListener('DOMContentLoaded', () => {
    // 1. Inicialización de Productos y Filtros
    renderProducts(products.filter(p => p.isFeatured), 'product-list');
    renderProducts(products.filter(p => p.isLiquidacion), 'liquidacion-list');
    setupCatalogFilters();

    // 2. Inicialización de Modales y Carrito
    cart = getCart(); 
    updateCartDisplay();
    closeModal(); // Aseguramos que todos los modales estén cerrados al inicio

    // 3. Inicialización de Música
    initMusicPlayer();
    if (playPauseBtn) playPauseBtn.addEventListener('click', togglePlayPause);
    if (document.getElementById('prev-btn')) document.getElementById('prev-btn').addEventListener('click', () => changeTrack(-1));
    if (document.getElementById('next-btn')) document.getElementById('next-btn').addEventListener('click', () => changeTrack(1));
    
    // 4. Lógica de Botones Top-Bar (Carrito y Búsqueda)
    if (document.getElementById('cart-float-btn-top')) {
        document.getElementById('cart-float-btn-top').addEventListener('click', () => {
            openModal('cart-modal'); // **ESTO AHORA DEBE FUNCIONAR**
        });
    }
    const searchOverlay = document.getElementById('search-overlay');
    if (document.getElementById('search-btn-top')) {
        document.getElementById('search-btn-top').addEventListener('click', () => {
            searchOverlay.classList.toggle('closed');
        });
    }
    if (document.getElementById('close-search-btn')) {
        document.getElementById('close-search-btn').addEventListener('click', () => {
            searchOverlay.classList.add('closed');
        });
    }

    // 5. Navegación Inicial
    navigateTo('INICIO'); 
});


// =========================================================
// 7. NOTIFICACIONES
// =========================================================
function showNotification(message) {
    const notification = document.getElementById('cart-notification');
    if (notification) {
        notification.textContent = message;
        notification.classList.remove('closed');
        notification.classList.add('visible');

        setTimeout(() => {
            notification.classList.remove('visible');
            notification.classList.add('closed');
        }, 3000);
    }
}