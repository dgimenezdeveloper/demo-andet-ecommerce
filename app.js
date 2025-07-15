document.addEventListener('DOMContentLoaded', () => {
    // === ESTADO Y CONFIGURACIÓN ===
    const productGridContainer = document.querySelector('#productos .grid-container');
    const paginationContainer = document.querySelector('#pagination-container');
    const searchInput = document.querySelector('#searchInput');
    const sortSelect = document.querySelector('#sortSelect');
    const categoryFilters = document.querySelectorAll('.filter-btn');
    const cartSidebar = document.querySelector('#cartSidebar');
    const cartCounter = document.querySelector('.cart-counter');
    const cartItems = document.querySelector('#cartItems');
    const cartTotal = document.querySelector('#cartTotal');
    const overlay = document.querySelector('#overlay');
    
    const productsPerPage = 12;
    let allProducts = [];
    let filteredProducts = [];
    let currentPage = 1;
    let currentCategory = 'all';
    let currentSort = 'default';
    let currentSearch = '';
    let cart = [];

    // === FUNCIONES DE CARGA ===
    const loadProducts = async () => {
        try {
            console.log('Cargando productos...');
            const response = await fetch('products.json');
            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }
            allProducts = await response.json();
            console.log(`${allProducts.length} productos cargados`);
            
            filteredProducts = [...allProducts];
            setupPagination();
            displayProductsForPage(1);
        } catch (error) {
            console.error("Error cargando productos:", error);
            productGridContainer.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 60px; color: #666;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 3rem; margin-bottom: 20px; color: #ff6f00;"></i>
                    <h3>Error al cargar el catálogo</h3>
                    <p>No se pudieron cargar los productos. Verifica que el archivo products.json existe.</p>
                    <p style="margin-top: 10px; font-size: 0.9rem; color: #999;">Error: ${error.message}</p>
                </div>
            `;
        }
    };

    // === FUNCIONES DE FILTRADO Y BÚSQUEDA ===
    const applyFilters = () => {
        filteredProducts = allProducts.filter(product => {
            const matchesCategory = currentCategory === 'all' || product.categoria === currentCategory;
            const matchesSearch = currentSearch === '' || 
                product.nombre.toLowerCase().includes(currentSearch.toLowerCase()) ||
                product.categoria.toLowerCase().includes(currentSearch.toLowerCase()) ||
                product.codigo.toLowerCase().includes(currentSearch.toLowerCase());
            
            return matchesCategory && matchesSearch;
        });

        applySorting();
        currentPage = 1;
        setupPagination();
        displayProductsForPage(1);
    };

    const applySorting = () => {
        switch(currentSort) {
            case 'price-low':
                filteredProducts.sort((a, b) => parseFloat(a.precio.replace('S/ ', '')) - parseFloat(b.precio.replace('S/ ', '')));
                break;
            case 'price-high':
                filteredProducts.sort((a, b) => parseFloat(b.precio.replace('S/ ', '')) - parseFloat(a.precio.replace('S/ ', '')));
                break;
            case 'name':
                filteredProducts.sort((a, b) => a.nombre.localeCompare(b.nombre));
                break;
            case 'name-desc':
                filteredProducts.sort((a, b) => b.nombre.localeCompare(a.nombre));
                break;
            default:
                filteredProducts.sort((a, b) => a.id - b.id);
        }
    };

    // === FUNCIONES DE VISUALIZACIÓN ===
    const displayProductsForPage = (page) => {
        currentPage = page;
        productGridContainer.innerHTML = '';

        if (filteredProducts.length === 0) {
            productGridContainer.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 60px; color: #666;">
                    <i class="fas fa-search" style="font-size: 3rem; margin-bottom: 20px; color: #ccc;"></i>
                    <h3>No se encontraron productos</h3>
                    <p>Intenta cambiar los filtros o términos de búsqueda</p>
                </div>
            `;
            return;
        }

        const startIndex = (page - 1) * productsPerPage;
        const endIndex = startIndex + productsPerPage;
        const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

        const productCardsHTML = paginatedProducts.map(product => `
            <div class="product-card" data-product-id="${product.id}">
                ${product.descuento ? `<div class="discount-badge">${product.descuento}</div>` : ''}
                <img src="${product.imagen}" 
                     alt="${product.nombre}" 
                     class="product-image"
                     onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                <div class="image-placeholder" style="display: none;">
                    <i class="fas fa-image"></i>
                    <span>Imagen no disponible</span>
                </div>
                <div class="product-info">
                    <p class="product-category">${product.categoria}</p>
                    <h3 class="product-name">${product.nombre}</h3>
                    <p class="product-code">Código: ${product.codigo}</p>
                    <div class="product-price-container">
                        ${product.precio_anterior ? `<span class="product-price-old">${product.precio_anterior}</span>` : ''}
                        <span class="product-price">${product.precio}</span>
                    </div>
                    <p class="product-stock">${product.disponibles} disponibles</p>
                    <button class="add-to-cart-button" onclick="addToCart(${product.id})">
                        <i class="fas fa-shopping-cart"></i>
                        Añadir al Carrito
                    </button>
                    <button class="view-details-button" onclick="viewProductDetails(${product.id})">
                        <i class="fas fa-eye"></i>
                        Ver Detalles
                    </button>
                </div>
            </div>
        `).join('');

        productGridContainer.innerHTML = productCardsHTML;
        updateActivePaginationButton();
        window.scrollTo({ top: document.querySelector('#productos').offsetTop - 100, behavior: 'smooth' });
    };

    const setupPagination = () => {
        paginationContainer.innerHTML = '';
        const pageCount = Math.ceil(filteredProducts.length / productsPerPage);

        if (pageCount <= 1) return;

        // Botón anterior
        if (currentPage > 1) {
            const prevBtn = createPaginationButton('‹', currentPage - 1);
            prevBtn.classList.add('pagination-prev');
            paginationContainer.appendChild(prevBtn);
        }

        // Números de página
        for (let i = 1; i <= pageCount; i++) {
            if (i === 1 || i === pageCount || (i >= currentPage - 2 && i <= currentPage + 2)) {
                const btn = createPaginationButton(i, i);
                paginationContainer.appendChild(btn);
            } else if (i === currentPage - 3 || i === currentPage + 3) {
                const dots = document.createElement('span');
                dots.textContent = '...';
                dots.classList.add('pagination-dots');
                paginationContainer.appendChild(dots);
            }
        }

        // Botón siguiente
        if (currentPage < pageCount) {
            const nextBtn = createPaginationButton('›', currentPage + 1);
            nextBtn.classList.add('pagination-next');
            paginationContainer.appendChild(nextBtn);
        }
    };

    const createPaginationButton = (text, page) => {
        const btn = document.createElement('button');
        btn.textContent = text;
        btn.classList.add('pagination-button');
        btn.addEventListener('click', () => displayProductsForPage(page));
        return btn;
    };

    const updateActivePaginationButton = () => {
        const buttons = document.querySelectorAll('.pagination-button');
        buttons.forEach(button => {
            button.classList.toggle('active', parseInt(button.textContent) === currentPage);
        });
    };

    // === FUNCIONES DEL CARRITO ===
    window.addToCart = (productId) => {
        const product = allProducts.find(p => p.id === productId);
        if (!product) return;

        const existingItem = cart.find(item => item.id === productId);
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({ ...product, quantity: 1 });
        }

        updateCartDisplay();
        showNotification(`${product.nombre} añadido al carrito`);
    };

    window.toggleCart = () => {
        cartSidebar.classList.toggle('active');
        overlay.classList.toggle('active');
        document.body.classList.toggle('cart-open');
    };

    const updateCartDisplay = () => {
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        const totalPrice = cart.reduce((sum, item) => sum + (parseFloat(item.precio.replace('S/ ', '')) * item.quantity), 0);

        cartCounter.textContent = totalItems;
        cartTotal.textContent = totalPrice.toFixed(2);

        if (cart.length === 0) {
            cartItems.innerHTML = '<p class="empty-cart">Tu carrito está vacío</p>';
        } else {
            cartItems.innerHTML = cart.map(item => `
                <div class="cart-item">
                    <img src="${item.imagen}" alt="${item.nombre}" class="cart-item-image">
                    <div class="cart-item-info">
                        <h4>${item.nombre}</h4>
                        <p class="cart-item-price">${item.precio}</p>
                        <div class="cart-item-controls">
                            <button onclick="updateCartQuantity(${item.id}, ${item.quantity - 1})">-</button>
                            <span>${item.quantity}</span>
                            <button onclick="updateCartQuantity(${item.id}, ${item.quantity + 1})">+</button>
                            <button onclick="removeFromCart(${item.id})" class="remove-btn">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `).join('');
        }
    };

    window.updateCartQuantity = (productId, newQuantity) => {
        if (newQuantity <= 0) {
            removeFromCart(productId);
            return;
        }

        const item = cart.find(item => item.id === productId);
        if (item) {
            item.quantity = newQuantity;
            updateCartDisplay();
        }
    };

    window.removeFromCart = (productId) => {
        cart = cart.filter(item => item.id !== productId);
        updateCartDisplay();
    };

    // === EVENT LISTENERS ===
    categoryFilters.forEach(btn => {
        btn.addEventListener('click', () => {
            categoryFilters.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentCategory = btn.dataset.category;
            applyFilters();
        });
    });

    sortSelect.addEventListener('change', (e) => {
        currentSort = e.target.value;
        applyFilters();
    });

    searchInput.addEventListener('input', (e) => {
        currentSearch = e.target.value;
        applyFilters();
    });

    // === FUNCIONES GLOBALES ===
    window.searchProducts = () => {
        currentSearch = searchInput.value;
        applyFilters();
    };

    window.sortProducts = () => {
        currentSort = sortSelect.value;
        applyFilters();
    };

    const showNotification = (message) => {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.innerHTML = `
            <i class="fas fa-check-circle"></i>
            <span>${message}</span>
        `;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.classList.add('show');
        }, 100);

        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    };

    // === INICIALIZACIÓN ===
    loadProducts();
});