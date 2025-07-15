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
    const categoryTrack = document.getElementById('category-carousel-track');

    // =================================================================
    //                    LÓGICA DEL CARRUSEL DE CATEGORÍAS
    // =================================================================
    /**
     * Define los datos para las tarjetas de categorías.
     * En un proyecto real, esto podría venir de un JSON separado.
     * Usamos las imágenes que ya tenemos para la demo.
     */
    function getCategoryData() {
        return [
            { name: "Medidor de Energía", img: "imagenes_productos/001_Batería_de_Litio.png" }, // Reutilizando imagen
            { name: "Medidor de Gas", img: "https://andet.com.pe/wp-content/uploads/2023/12/medidor-de-gas-e1704221159389.png" }, // Ejemplo con URL externa
            { name: "Caja Porta Medidor", img: "imagenes_productos/003_Inversor_On_Grid.png" }, // Reutilizando imagen
            { name: "Domótica iSmart", img: "imagenes_productos/005_Tira_de_luces_inteligente.png" }, // Reutilizando imagen
            { name: "Inversores", img: "imagenes_productos/002_Inversor_Híbrido.png" },
            { name: "Baterías", img: "imagenes_productos/001_Batería_de_Litio.png" },
            { name: "Reflectores", img: "imagenes_productos/007_Reflector_inteligente_sin_marco_30W.png"},
            { name: "Plafones", img: "imagenes_productos/008_PLAFON_REDONDO_INTELIGENTE_RGB.jpg"},
        ];
    }

    /**
     * Inicializa el carrusel de categorías, creando y duplicando las tarjetas.
     */
    function setupCategoryCarousel() {
        if (!categoryTrack) return; // Parada de seguridad si el elemento no existe

        const categories = getCategoryData();
        // Duplicamos las categorías para crear el efecto de bucle infinito
        const allCategories = [...categories, ...categories]; 

        categoryTrack.innerHTML = ''; // Limpiamos el contenido previo

        allCategories.forEach(cat => {
            const card = document.createElement('div');
            card.className = 'category-card';
            
            // --- ¡ESTRUCTURA HTML CORREGIDA PARA LA TARJETA! ---
            card.innerHTML = `
                <div class="img-container">
                    <img src="${cat.img}" alt="Categoría ${cat.name}">
                </div>
                <p class="category-name">${cat.name}</p>
                <div class="cta-footer">
                    Ver Categoría
                </div>
            `;
            categoryTrack.appendChild(card);
        });
        
        // Esta parte es para ajustar la animación CSS dinámicamente
        const totalCards = categories.length;
        const cardWidthWithMargin = 280; // 250px de ancho + 30px de margen
        const animationWidth = totalCards * cardWidthWithMargin;
        
        // Inyectamos la variable en el CSS
        document.documentElement.style.setProperty('--scroll-width', `-${animationWidth}px`);
        categoryTrack.style.animationDuration = `${totalCards * 4}s`; // Ajusta la velocidad dinámicamente
    }

    // =================================================================
    //                    LÓGICA PRINCIPAL DE PRODUCTOS
    // =================================================================

    async function fetchProducts() {
        try {
            const response = await fetch('products.json');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            allProducts = await response.json();
            displayProducts(allProducts, currentPage);
            setupPagination(allProducts);
        } catch (error) {
            console.error("No se pudieron cargar los productos:", error);
            productGrid.innerHTML = `<p style="text-align:center; color: var(--secondary-color);">Error al cargar productos.</p>`;
        }
    }

    function displayProducts(products, page) {
        if (!productGrid) return;
        productGrid.innerHTML = '';
        currentPage = page;

        const start = (page - 1) * productsPerPage;
        const end = start + productsPerPage;
        const paginatedProducts = products.slice(start, end);

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
                    <button class="details-button">Cotizar Ahora</button>
                </div>
            `;
            productGrid.appendChild(productCard);
        });

        updateActivePaginationButton();
    }
    
    // ... (El resto de tus funciones: setupPagination, openProductModal, toggleCart, etc., permanecen igual) ...
    // Asegúrate de que todas las demás funciones que ya tenías estén aquí.
    
    // ...

    // --- INICIALIZACIÓN DE LA PÁGINA ---
    fetchProducts();
    setupCategoryCarousel(); // Ahora se llamará correctamente
    
    document.addEventListener('keydown', (e) => {
        if (e.key === "Escape") {
            closeProductModal();
            if (cartSidebar.classList.contains('active')) {
                toggleCart();
            }
        }
    });

    // ... Y aquí adentro van el resto de funciones (openProductModal, addToCart, etc) ...

    function setupPagination(products) {
        if (!paginationContainer) return;
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

    window.openProductModal = (product) => {
        if (!modal) return;
        const modalMainImage = document.getElementById('modalMainImage');
        const modalThumbnailsContainer = document.getElementById('modalThumbnails');
        const modalTitle = document.getElementById('modalTitle');
        const modalCategory = document.getElementById('modalCategory');
        const addToCartBtn = modal.querySelector('.add-to-cart-btn');

        modalTitle.textContent = product.nombre;
        modalCategory.textContent = product.categoria || "Equipos Industriales";
        
        modalThumbnailsContainer.innerHTML = '';
        const imageList = product.gallery_images || [product.imagen, product.imagen, product.imagen, product.imagen];
        modalMainImage.src = imageList[0];
        
        imageList.forEach((imgSrc, index) => {
            const thumb = document.createElement('img');
            thumb.src = imgSrc;
            thumb.alt = `Vista ${index + 1} de ${product.nombre}`;
            thumb.className = 'modal-thumbnail-img';
            if (index === 0) thumb.classList.add('active');
            thumb.onclick = (e) => {
                e.stopPropagation(); // Evita que se cierre el modal al hacer clic en la miniatura
                modalMainImage.style.opacity = '0';
                setTimeout(() => {
                    modalMainImage.src = imgSrc;
                    modalMainImage.style.opacity = '1';
                }, 150);
                modalThumbnailsContainer.querySelector('.active').classList.remove('active');
                thumb.classList.add('active');
            };
            modalThumbnailsContainer.appendChild(thumb);
        });

        document.getElementById('modalQuantity').value = 1;
        addToCartBtn.onclick = () => {
            const quantity = parseInt(document.getElementById('modalQuantity').value);
            addToCart(product.id, quantity);
        };
        
        modal.classList.add('active');
        overlay.classList.add('active');
    };

    window.closeProductModal = () => {
        if (modal && overlay) {
            modal.classList.remove('active');
            overlay.classList.remove('active');
        }
    };

    window.toggleCart = () => {
        if (cartSidebar && overlay) {
            cartSidebar.classList.toggle('active');
            overlay.classList.toggle('active');
        }
    };

    function updateCartDisplay() {
        if (!cartItemsContainer) return;
        cartItemsContainer.innerHTML = '';
        if (cart.length === 0) {
            cartItemsContainer.innerHTML = `<p class="empty-cart">Tu lista de cotización está vacía.</p>`;
        } else {
            cart.forEach(item => {
                const cartItemElement = document.createElement('div');
                cartItemElement.className = 'cart-item';
                cartItemElement.innerHTML = `
                    <img src="${item.imagen}" alt="${item.nombre}" class="cart-item-image">
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
        if (cartCounter) {
            cartCounter.textContent = cart.reduce((total, item) => total + item.quantity, 0);
        }
    }

    window.addToCart = (productId, quantity = 1) => {
        const product = allProducts.find(p => p.id === productId);
        if (!product) return;
        const existingItem = cart.find(item => item.id === productId);

        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            cart.push({ ...product, quantity });
        }
        
        closeProductModal();
        updateCartDisplay();
        
        if (cartSidebar && !cartSidebar.classList.contains('active')) {
            toggleCart();
            setTimeout(toggleCart, 1500);
        }
    };

    window.addToCartFromModal = () => {
        const title = document.getElementById('modalTitle').textContent;
        const product = allProducts.find(p => p.nombre === title);
        if(product){
            const quantity = parseInt(document.getElementById('modalQuantity').value);
            addToCart(product.id, quantity);
        }
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
});


function submitContactForm(event) {
    event.preventDefault();
    const form = event.target;
    const name = form.querySelector('#name').value;
    alert(`¡Gracias por contactarnos, ${name}! \n\nEn un proyecto real, este formulario enviaría tus datos.\nEsta es una demostración visual.`);
    form.reset();
}