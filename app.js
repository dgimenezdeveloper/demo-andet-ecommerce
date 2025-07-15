document.addEventListener('DOMContentLoaded', () => {
    // --- ESTADO GLOBAL DE LA APLICACIÓN ---
    let allProducts = [];
    let cart = [];
    let currentPage = 1;
    const productsPerPage = 9;

    // --- ELEMENTOS DEL DOM ---
    const productGrid = document.getElementById('productGrid');
    const paginationContainer = document.getElementById('pagination-container');
    const modal = document.getElementById('productModal');
    const overlay = document.getElementById('overlay');
    const cartSidebar = document.getElementById('cartSidebar');
    const cartItemsContainer = document.getElementById('cartItems');
    const cartCounter = document.getElementById('cartCounter');

    /**
     * Carga los productos desde el archivo JSON
     */
    async function fetchProducts() {
        try {
            const response = await fetch('products.json');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            allProducts = await response.json();
            displayProducts(allProducts, currentPage);
            setupPagination(allProducts);
        } catch (error) {
            console.error("No se pudieron cargar los productos:", error);
            productGrid.innerHTML = `<p style="text-align:center; color: var(--secondary-color);">Error al cargar productos. Por favor, intente de nuevo más tarde.</p>`;
        }
    }

    /**
     * Muestra los productos en la página actual
     * @param {Array} products 
     * @param {number} page 
     */
    function displayProducts(products, page) {
        productGrid.innerHTML = '';
        currentPage = page;

        const start = (page - 1) * productsPerPage;
        const end = start + productsPerPage;
        const paginatedProducts = products.slice(start, end);

        if (paginatedProducts.length === 0 && page === 1) {
             productGrid.innerHTML = `<p style="text-align:center;">No se encontraron productos.</p>`;
             return;
        }

        paginatedProducts.forEach(product => {
            const productCard = document.createElement('div');
            productCard.className = 'product-card';
            productCard.setAttribute('data-aos', 'fade-up');
            productCard.onclick = () => openProductModal(product);

            const imageUrl = product.imagen;

            productCard.innerHTML = `
                <div class="product-image-container">
                    <img src="${imageUrl}" alt="${product.nombre}" class="product-image" loading="lazy">
                </div>
                <div class="product-info">
                    <h3 class="product-name">${product.nombre}</h3>
                    <button class="details-button">Ver Detalles</button>
                </div>
            `;
            productGrid.appendChild(productCard);
        });

        updateActivePaginationButton();
    }

    /**
     * Configura los botones de paginación
     * @param {Array} products
     */
    function setupPagination(products) {
        paginationContainer.innerHTML = '';
        const pageCount = Math.ceil(products.length / productsPerPage);

        for (let i = 1; i <= pageCount; i++) {
            const btn = document.createElement('button');
            btn.className = 'pagination-button';
            btn.innerText = i;
            btn.addEventListener('click', () => {
                displayProducts(products, i);
                window.scrollTo({ top: productGrid.offsetTop - 100, behavior: 'smooth' });
            });
            paginationContainer.appendChild(btn);
        }
        updateActivePaginationButton();
    }


    function updateActivePaginationButton() {
        document.querySelectorAll('.pagination-button').forEach(button => {
            button.classList.remove('active');
            if (parseInt(button.innerText) === currentPage) {
                button.classList.add('active');
            }
        });
    }

    // --- LÓGICA DEL MODAL ---
    window.openProductModal = (product) => {
        // Obtenemos los elementos del DOM que necesitamos
        const modalMainImage = document.getElementById('modalMainImage');
        const modalThumbnailsContainer = document.getElementById('modalThumbnails');
        const modalTitle = document.getElementById('modalTitle');
        const modalCategory = document.getElementById('modalCategory');
        const addToCartBtn = modal.querySelector('.add-to-cart-btn');

        // Actualizamos título y categoría
        modalTitle.textContent = product.nombre;
        modalCategory.textContent = product.categoria || "Equipos Industriales";

        // --- LÓGICA DE LA GALERÍA ---
        // Limpiamos miniaturas anteriores
        modalThumbnailsContainer.innerHTML = '';
        
        // El producto puede tener un array de imágenes o solo una.
        // Si no existe un array de imágenes, creamos uno de demostración repitiendo la imagen principal 4 veces.
        const imageList = product.gallery_images || [product.imagen, product.imagen, product.imagen, product.imagen];
        
        // Ponemos la primera imagen como la principal al abrir
        modalMainImage.src = imageList[0];
        
        // Creamos una miniatura por cada imagen en la lista
        imageList.forEach((imgSrc, index) => {
            const thumb = document.createElement('img');
            thumb.src = imgSrc;
            thumb.alt = `Vista ${index + 1} de ${product.nombre}`;
            thumb.className = 'modal-thumbnail-img';
            
            // La primera miniatura empieza como activa
            if (index === 0) {
                thumb.classList.add('active');
            }
            
            // Evento de clic para cada miniatura
            thumb.onclick = () => {
                // Efecto de fade out para la imagen principal
                modalMainImage.style.opacity = '0';

                setTimeout(() => {
                    // Cambiamos la imagen principal y la hacemos visible de nuevo
                    modalMainImage.src = imgSrc;
                    modalMainImage.style.opacity = '1';
                }, 150); // El tiempo debe ser menor a la transición en CSS

                // Actualizamos la clase 'active' en las miniaturas
                modalThumbnailsContainer.querySelector('.active').classList.remove('active');
                thumb.classList.add('active');
            };
            
            modalThumbnailsContainer.appendChild(thumb);
        });

        // Lógica para añadir al carrito (se mantiene igual, pero más limpia)
        document.getElementById('modalQuantity').value = 1; // Reiniciar cantidad
        addToCartBtn.onclick = () => {
            const quantity = parseInt(document.getElementById('modalQuantity').value);
            addToCart(product.id, quantity);
        };
        
        // Mostramos el modal
        modal.classList.add('active');
        overlay.classList.add('active');
    };
    
    window.closeProductModal = () => {
        modal.classList.remove('active');
        overlay.classList.remove('active');
    };

    // --- LÓGICA DEL CARRITO ---
    window.toggleCart = () => {
        cartSidebar.classList.toggle('active');
        overlay.classList.toggle('active');
    };

    function updateCartDisplay() {
        cartItemsContainer.innerHTML = '';
        if (cart.length === 0) {
            cartItemsContainer.innerHTML = `<p class="empty-cart">Tu lista de cotización está vacía.</p>`;
        } else {
            cart.forEach(item => {
                const cartItemElement = document.createElement('div');
                cartItemElement.className = 'cart-item';
                cartItemElement.innerHTML = `
                    <img src="${item.imagen_url || item.imagen}" alt="${item.nombre}" class="cart-item-image">
                    <div class="cart-item-info">
                        <h4>${item.nombre}</h4>
                        <p class="cart-item-quantity">Cantidad: ${item.quantity}</p>
                    </div>
                    <button class="remove-from-cart-btn" onclick="removeFromCart(${item.id})">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                `;
                cartItemsContainer.appendChild(cartItemElement);
            });
        }
        cartCounter.textContent = cart.reduce((total, item) => total + item.quantity, 0);
    }
    
    window.addToCart = (productId, quantity = 1) => {
        const product = allProducts.find(p => p.id === productId);
        const existingItem = cart.find(item => item.id === productId);

        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            cart.push({ ...product, quantity });
        }
        
        closeProductModal();
        updateCartDisplay();
        
        // Muestra el carrito por un momento para feedback
        if (!cartSidebar.classList.contains('active')) {
            toggleCart();
            setTimeout(toggleCart, 1500);
        }
    };
    
    window.addToCartFromModal = () => {
        const productId = allProducts.find(p => p.nombre === document.getElementById('modalTitle').textContent).id;
        const quantity = parseInt(document.getElementById('modalQuantity').value);
        addToCart(productId, quantity);
    };

    window.removeFromCart = (productId) => {
        cart = cart.filter(item => item.id !== productId);
        updateCartDisplay();
    };
    
    window.increaseQuantity = () => {
        const input = document.getElementById('modalQuantity');
        input.value = parseInt(input.value) + 1;
    };
    
    window.decreaseQuantity = () => {
        const input = document.getElementById('modalQuantity');
        if (parseInt(input.value) > 1) {
            input.value = parseInt(input.value) - 1;
        }
    };


    // --- INICIALIZACIÓN ---
    fetchProducts();
    document.addEventListener('keydown', (e) => {
        if (e.key === "Escape") {
            closeProductModal();
            if(cartSidebar.classList.contains('active')) {
                toggleCart();
            }
        }
    });
});