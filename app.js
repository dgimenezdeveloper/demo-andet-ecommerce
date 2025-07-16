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
            { name: "Inversor", img: "imagenes_productos/002_Inversor_Híbrido.png" }, // Ejemplo con URL externa
            { name: "Caja Porta Medidor", img: "imagenes_productos/003_Inversor_On_Grid.png" }, // Reutilizando imagen
            { name: "Domótica iSmart", img: "imagenes_productos/005_Tira_de_luces_inteligente.png" }, // Reutilizando imagen
            { name: "Inversores", img: "imagenes_productos/002_Inversor_Híbrido.png" },
            { name: "Baterías", img: "imagenes_productos/001_Batería_de_Litio.png" },
            { name: "Reflectores", img: "imagenes_productos/007_Reflector_inteligente_sin_marco_30W.png"},
            { name: "Plafones", img: "imagenes_productos/008_PLAFON_REDONDO_INTELIGENTE_RGB.jpg"},
        ];
    }

    /**
     * Inicializa el carrusel de categorías con navegación por clic.
     */
    function setupCategoryCarousel() {
        if (!categoryTrack) return;

        const wrapper = document.querySelector('.category-carousel-wrapper');
        const prevButton = document.getElementById('carousel-prev');
        const nextButton = document.getElementById('carousel-next');
        const cardsPerPage = 4;
        let categories = getCategoryData();
        
        // Clonamos las primeras 'cardsPerPage' para el efecto infinito
        const clonedCards = categories.slice(0, cardsPerPage);
        let allItems = [...categories, ...clonedCards];
        
        let currentIndex = 0;
        let autoScrollInterval;
        let isTransitioning = false;
        
        const cardWidth = 250;
        const cardMargin = 30;
        const moveDistance = cardWidth + cardMargin;

        // 1. Renderiza todas las tarjetas (originales + clones)
        categoryTrack.innerHTML = allItems.map(cat => `
            <div class="category-card" style="flex: 0 0 ${cardWidth}px; margin: 0 ${cardMargin / 2}px;">
                <div class="img-container"><img src="${cat.img}" alt="${cat.name}"></div>
                <p class="category-name">${cat.name}</p>
                <div class="cta-footer">Ver Categoría</div>
            </div>
        `).join('');

        // 2. Función principal para mover el carrusel
        function moveTo(index) {
            isTransitioning = true;
            categoryTrack.style.transition = 'transform 0.6s ease-in-out';
            categoryTrack.style.transform = `translateX(-${index * moveDistance}px)`;
        }

        // 3. Event listener que detecta cuándo terminó la animación
        categoryTrack.addEventListener('transitionend', () => {
            isTransitioning = false;
            // Magia del bucle infinito: Si hemos llegado al final (a los clones),
            // saltamos silenciosamente al principio.
            if (currentIndex >= categories.length) {
                categoryTrack.style.transition = 'none'; // Sin animación para el salto
                currentIndex = 0;
                categoryTrack.style.transform = `translateX(0px)`;
            }
        });

        // 4. Lógica para el botón "Siguiente"
        function handleNext() {
            if (isTransitioning) return;
            currentIndex++;
            moveTo(currentIndex);
        }

        // 5. Lógica para el botón "Anterior"
        function handlePrev() {
            if (isTransitioning || currentIndex <= 0) return;
            currentIndex--;
            moveTo(currentIndex);
        }

        // 6. Lógica del Auto-Scroll
        function startAutoScroll() {
            if (autoScrollInterval) clearInterval(autoScrollInterval); // Prevenir múltiples intervalos
            autoScrollInterval = setInterval(handleNext, 2000); // Se mueve cada 3 segundos
        }

        // 7. Event Listeners
        nextButton.addEventListener('click', () => {
            clearInterval(autoScrollInterval); // Detiene el auto-scroll al interactuar
            handleNext();
        });

        prevButton.addEventListener('click', () => {
            clearInterval(autoScrollInterval); // Detiene el auto-scroll al interactuar
            handlePrev();
        });

        // Pausar con el mouse y reanudar
        wrapper.addEventListener('mouseenter', () => clearInterval(autoScrollInterval));
        wrapper.addEventListener('mouseleave', () => startAutoScroll());

        // Iniciar todo
        startAutoScroll();
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

        const cartCount = cart.reduce((total, item) => total + item.quantity, 0);

        // Actualiza el texto del contador
        if (cartCounter) {
            cartCounter.textContent = cartCount;
            // Añade o quita la clase 'hidden'
            if (cartCount > 0) {
                cartCounter.classList.remove('hidden');
            } else {
                cartCounter.classList.add('hidden');
            }
        }

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

/**
 * Simula la acción de búsqueda de productos
 */
function executeSearch() {
    const query = document.getElementById('header-search-input').value;
    if (query) {
        alert(`Buscando productos para: "${query}"\n\nEn una aplicación completa, esto mostraría los resultados.`);
    } else {
        alert('Por favor, ingrese un término de búsqueda.');
    }
}

// --- Lógica para el Hero Slider ---
document.addEventListener('DOMContentLoaded', () => {
    // Asegúrate de que este código no se ejecute si no existe el slider
    const heroSlider = document.querySelector('.hero-slider');
    if (!heroSlider) return;

    const slides = heroSlider.querySelectorAll('.slide');
    const nextBtn = heroSlider.querySelector('.next-slide');
    const prevBtn = heroSlider.querySelector('.prev-slide');
    let currentSlide = 0;
    let slideInterval;

    function showSlide(index) {
        slides.forEach((slide, i) => {
            slide.classList.remove('active');
            if (i === index) {
                slide.classList.add('active');
            }
        });
    }

    function nextSlide() {
        currentSlide = (currentSlide + 1) % slides.length;
        showSlide(currentSlide);
    }

    function startSlideShow() {
        stopSlideShow(); // Limpia cualquier intervalo anterior
        slideInterval = setInterval(nextSlide, 7000); // Cambia cada 7 segundos
    }

    function stopSlideShow() {
        clearInterval(slideInterval);
    }

    if (slides.length > 1) {
        showSlide(currentSlide);
        startSlideShow();

        nextBtn.addEventListener('click', () => {
            nextSlide();
            stopSlideShow(); // Detenemos el autoplay al interactuar
            startSlideShow(); // Y lo reiniciamos
        });

        prevBtn.addEventListener('click', () => {
            currentSlide = (currentSlide - 1 + slides.length) % slides.length;
            showSlide(currentSlide);
            stopSlideShow();
            startSlideShow();
        });
    }
});