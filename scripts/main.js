document.addEventListener('DOMContentLoaded', () => {
    // =========================================================
    // 1. DATA Y ESTADO GLOBAL
    // =========================================================
    let cart = JSON.parse(localStorage.getItem('urbanfeedCart')) || [];
    let products = [
        { id: 'chaqueta-bomber', name: 'Chaqueta Bomber Street', price: 95.00, category: 'chaquetas', image: 'images/chaqueta_bomber.jpg' },
        { id: 'gorra-urban', name: 'Gorra Snapback Urban', price: 25.00, category: 'gorras', image: 'images/gorra_urban.jpg' },
        { id: 'hoodie-neon', name: 'Hoodie Neón', price: 70.00, category: 'hoodies', image: 'images/hoodie_neon.jpg' },
        { id: 'tshirt-grafico', name: 'T-Shirt Gráfico Rap', price: 35.00, category: 'remeras', image: 'images/tshirt_grafico.jpg' },
        { id: 'jogger-cargo', name: 'Jogger Cargo Negro', price: 80.00, category: 'pantalones', image: 'images/jogger_cargo.jpg' },
        { id: 'camisa-vintage', name: 'Camiseta Vintage', price: 40.00, category: 'remeras', image: 'images/camisa_vintage.jpg' }
        // Agrega más productos aquí si tienes...
    ];
    let featuredProducts = ['chaqueta-bomber', 'gorra-urban', 'hoodie-neon', 'tshirt-grafico'];

    // Música (Asegúrate de que tus archivos .mp3 estén en la carpeta 'audio/')
    const audio = new Audio();
    let isPlaying = false;
    let currentTrackIndex = 0;
    const playlist = [
        { title: "Mala Junta", file: "audio/track_1.mp3" },
        { title: "Flow", file: "audio/track_2.mp3" },
        { title: "Ritmo", file: "audio/track_3.mp3" }
        // ... otros tracks ...
    ];

    // =========================================================
    // 2. UTILIDADES DE DOM Y VISTAS (MODALES Y SPA)
    // =========================================================

    const $ = selector => document.querySelector(selector);
    const $$ = selector => document.querySelectorAll(selector);

    const cartModal = $('#cart-modal');
    const checkoutModal = $('#checkout-modal');
    const searchOverlay = $('#search-overlay');
    const mobileMenu = $('#mobile-menu');
    const overlay = $('#overlay');
    const cartCount = $('#cart-count');
    const cartNotification = $('#cart-notification');
    const mainContent = $('#main-content');
    const footer = $('#main-footer');

    // Función para mostrar/ocultar modales y el overlay
    const toggleModal = (modal, show) => {
        if (show) {
            modal.classList.add('visible');
            modal.classList.remove('closed');
            overlay.classList.add('visible');
            overlay.classList.remove('closed');
            // Ocultar flotantes mientras el modal está abierto
            $('#music-float-container').style.display = 'none';
        } else {
            modal.classList.remove('visible');
            modal.classList.add('closed');
            overlay.classList.remove('visible');
            overlay.classList.add('closed');
            // Restaurar flotantes
            $('#music-float-container').style.display = 'block';
        }
    };

    // Navegación (Single Page Application)
    const navigateTo = (targetId) => {
        const pages = $$('.content-page');
        pages.forEach(page => {
            if (page.id === targetId) {
                page.classList.add('visible');
                page.classList.remove('closed');
            } else {
                page.classList.add('closed');
                page.classList.remove('visible');
            }
        });

        // Actualizar estado de links activos
        $$('.nav-link, .nav-link-mobile').forEach(link => {
            link.classList.remove('active');
            if (link.dataset.target === targetId) {
                link.classList.add('active');
            }
        });
        
        // Cerrar menú móvil si está abierto
        toggleMobileMenu(false);
    };

    // =========================================================
    // 3. FUNCIONALIDAD DEL CARRITO Y PRODUCTOS
    // =========================================================

    // Genera el HTML de una tarjeta de producto
    const createProductCard = (product) => {
        return `
            <div class="product-card" data-id="${product.id}" data-category="${product.category}">
                <img src="${product.image}" alt="${product.name}">
                <h3>${product.name}</h3>
                <p class="price">$${product.price.toFixed(2)}</p>
                <button class="neon-btn add-to-cart-btn" data-product-id="${product.id}">AÑADIR AL CARRITO</button>
            </div>
        `;
    };

    // Renderiza la lista de productos en una sección
    const renderProducts = (containerId, productList) => {
        const container = $(containerId);
        if (!container) return;
        container.innerHTML = productList.map(createProductCard).join('');
    };

    // Renderiza los productos destacados y el catálogo completo al inicio
    const initProducts = () => {
        const featuredList = products.filter(p => featuredProducts.includes(p.id));
        renderProducts('#INICIO .product-grid', featuredList);
        renderProducts('#catalogo-grid', products);
    };

    const updateCartModal = () => {
        const listContainer = $('#cart-modal .cart-items-list');
        const totalElement = $('#cart-modal #cart-total');
        const count = cart.reduce((sum, item) => sum + item.quantity, 0);

        cartCount.textContent = count;
        localStorage.setItem('urbanfeedCart', JSON.stringify(cart));

        if (cart.length === 0) {
            listContainer.innerHTML = '<p style="text-align: center; color: var(--color-accent);">El carrito está vacío.</p>';
            totalElement.textContent = '$0.00';
            $('#open-checkout-modal-btn').disabled = true;
            return;
        }

        const cartItemsHtml = cart.map(item => `
            <div class="cart-item" data-id="${item.id}">
                <span>${item.name} (${item.quantity})</span>
                <span>$${(item.price * item.quantity).toFixed(2)}
                    <button class="remove-item-btn" data-id="${item.id}"><i class="fas fa-times"></i></button>
                </span>
            </div>
        `).join('');

        listContainer.innerHTML = cartItemsHtml;
        const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        totalElement.textContent = `$${total.toFixed(2)}`;
        $('#open-checkout-modal-btn').disabled = false;
    };

    const showNotification = (message) => {
        cartNotification.textContent = message;
        cartNotification.classList.add('visible');
        cartNotification.classList.remove('closed');
        setTimeout(() => {
            cartNotification.classList.remove('visible');
            cartNotification.classList.add('closed');
        }, 2000);
    };

    const addToCart = (productId) => {
        const product = products.find(p => p.id === productId);
        if (product) {
            const existingItem = cart.find(item => item.id === productId);
            if (existingItem) {
                existingItem.quantity += 1;
            } else {
                cart.push({ ...product, quantity: 1 });
            }
            updateCartModal();
            showNotification(`${product.name} añadido.`);
        }
    };

    const removeFromCart = (productId) => {
        cart = cart.filter(item => item.id !== productId);
        updateCartModal();
    };

    // =========================================================
    // 4. FUNCIONALIDAD DEL REPRODUCTOR DE MÚSICA
    // =========================================================

    const playerBar = $('#music-player-bar');
    const playPauseBtn = $('#music-play-pause-btn');
    const trackTitle = $('#music-track-title');
    const floatingBtn = $('#music-floating-btn');

    const loadTrack = (index) => {
        currentTrackIndex = index;
        audio.src = playlist[currentTrackIndex].file;
        trackTitle.textContent = playlist[currentTrackIndex].title;
    };

    const togglePlayPause = () => {
        if (isPlaying) {
            audio.pause();
            playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
            isPlaying = false;
        } else {
            // El navegador puede requerir interacción del usuario para reproducir
            audio.play().catch(error => console.log("Autoplay bloqueado:", error));
            playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
            isPlaying = true;
        }
    };

    const togglePlayerBar = (show) => {
        if (show) {
            playerBar.classList.remove('closed');
            floatingBtn.style.display = 'none';
        } else {
            playerBar.classList.add('closed');
            floatingBtn.style.display = 'flex';
        }
    };

    const nextTrack = () => {
        currentTrackIndex = (currentTrackIndex + 1) % playlist.length;
        loadTrack(currentTrackIndex);
        if (isPlaying) audio.play();
    };


    // =========================================================
    // 5. MANEJADORES DE EVENTOS
    // =========================================================

    // Cargar productos y carrito al inicio
    initProducts();
    updateCartModal();
    loadTrack(currentTrackIndex);

    // Navegación (SPA)
    $$('.nav-link, .nav-link-mobile').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            navigateTo(e.target.dataset.target);
        });
    });

    // Abrir/Cerrar Modales
    $('#cart-icon-btn').addEventListener('click', () => toggleModal(cartModal, true));
    $('#cart-modal .close-modal-btn').addEventListener('click', () => toggleModal(cartModal, false));
    $('#open-checkout-modal-btn').addEventListener('click', () => {
        toggleModal(cartModal, false);
        toggleModal(checkoutModal, true);
    });
    $('#checkout-modal .close-modal-btn').addEventListener('click', () => toggleModal(checkoutModal, false));
    
    // Cerrar modales al hacer click en el overlay
    overlay.addEventListener('click', () => {
        if (cartModal.classList.contains('visible')) toggleModal(cartModal, false);
        if (checkoutModal.classList.contains('visible')) toggleModal(checkoutModal, false);
        if (searchOverlay.classList.contains('visible')) toggleSearch(false);
        if (mobileMenu.classList.contains('visible')) toggleMobileMenu(false);
    });
    
    // Toggle Menú Móvil
    const toggleMobileMenu = (show) => {
        if (typeof show === 'boolean') {
            if (show) {
                mobileMenu.classList.add('visible');
                mobileMenu.classList.remove('closed');
                overlay.classList.add('visible');
            } else {
                mobileMenu.classList.remove('visible');
                mobileMenu.classList.add('closed');
                overlay.classList.remove('visible');
            }
        } else {
            // Alternar
            toggleMobileMenu(!mobileMenu.classList.contains('visible'));
        }
    };
    $('#menu-toggle-btn').addEventListener('click', () => toggleMobileMenu());
    $('#close-mobile-menu-btn').addEventListener('click', () => toggleMobileMenu(false));

    // Búsqueda
    const toggleSearch = (show) => {
        if (show) {
            searchOverlay.classList.add('visible');
            searchOverlay.classList.remove('closed');
            overlay.classList.add('visible');
            $('#search-input').focus();
        } else {
            searchOverlay.classList.remove('visible');
            searchOverlay.classList.add('closed');
            overlay.classList.remove('visible');
        }
    };
    $('#search-btn-top').addEventListener('click', () => toggleSearch(true));
    $('#close-search-btn').addEventListener('click', () => toggleSearch(false));

    // Agregar al carrito
    mainContent.addEventListener('click', (e) => {
        if (e.target.classList.contains('add-to-cart-btn')) {
            addToCart(e.target.dataset.productId);
        }
    });

    // Eliminar del carrito
    cartModal.addEventListener('click', (e) => {
        if (e.target.closest('.remove-item-btn')) {
            const btn = e.target.closest('.remove-item-btn');
            removeFromCart(btn.dataset.id);
        }
    });
    
    // Reproductor de Música
    floatingBtn.addEventListener('click', () => {
        togglePlayerBar(true);
        togglePlayPause(); // Iniciar reproducción al abrir
    });
    $('#music-close-btn').addEventListener('click', () => {
        togglePlayerBar(false);
        audio.pause(); // Pausar al cerrar
        isPlaying = false;
        playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
    });
    playPauseBtn.addEventListener('click', togglePlayPause);
    audio.addEventListener('ended', nextTrack); // Reproducir siguiente al terminar
    
    // Manejo del formulario de Checkout (Ejemplo básico)
    $('#checkout-form').addEventListener('submit', (e) => {
        e.preventDefault();
        alert('¡Pedido realizado con éxito! En breve te contactaremos.');
        cart = []; // Vaciar carrito
        updateCartModal();
        toggleModal(checkoutModal, false);
    });

    // Filtros de Catálogo
    $$('.category-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const filter = e.target.dataset.filter;
            $$('.category-btn').forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');

            const filteredProducts = filter === 'all' 
                ? products 
                : products.filter(p => p.category === filter);
            
            renderProducts('#catalogo-grid', filteredProducts);
        });
    });
});
