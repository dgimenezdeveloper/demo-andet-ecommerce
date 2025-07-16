// --- EVENTO PRINCIPAL: TODO EL CÓDIGO SE EJECUTA CUANDO EL HTML ESTÁ LISTO ---
document.addEventListener("DOMContentLoaded", () => {

    // =================================================================
    //                    1. ESTADO GLOBAL Y ELEMENTOS DEL DOM
    // =================================================================
    let allProducts = [];
    let cart = [];
    let currentPage = 1;
    const productsPerPage = 9;

    // --- Se declaran todas las constantes a elementos del DOM aquí arriba ---
    const productGrid = document.getElementById("productGrid");
    const paginationContainer = document.getElementById("pagination-container");
    const modal = document.getElementById("productModal");
    const overlay = document.getElementById("overlay");
    const cartSidebar = document.getElementById("cartSidebar");
    const cartItemsContainer = document.getElementById("cartItems");
    const cartCounter = document.getElementById("cartCounter");
    const categoryTrack = document.getElementById("category-carousel-track");
    const searchInput = document.getElementById('header-search-input');
    const searchResultsContainer = document.getElementById('search-results-container');
    const heroSlider = document.querySelector(".hero-slider");


    // =================================================================
    //                    2. LÓGICA DE BÚSQUEDA
    // (Movida aquí dentro para que funcione)
    // =================================================================
    function displaySearchResults(results) {
        if (!searchResultsContainer) return;
        searchResultsContainer.innerHTML = '';
        if (results.length === 0) {
            searchResultsContainer.innerHTML = `<p class="no-results">No se encontraron productos.</p>`;
        } else {
            results.slice(0, 10).forEach(product => {
                const resultItem = document.createElement('div');
                resultItem.className = 'result-item';
                resultItem.innerHTML = `<img src="${product.imagen}" alt="${product.nombre}"><div class="result-item-info"><h4>${product.nombre}</h4><p>${product.categoria || ''}</p></div>`;
                resultItem.addEventListener('click', () => {
                    openProductModal(product);
                    searchInput.value = '';
                    searchResultsContainer.classList.remove('active');
                });
                searchResultsContainer.appendChild(resultItem);
            });
        }
        searchResultsContainer.classList.add('active');
    }

    // El listener ahora sí tiene acceso a 'allProducts'
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            const query = searchInput.value.toLowerCase().trim();
            if (query.length < 2) {
                searchResultsContainer.classList.remove('active');
                return;
            }
            // Ahora la variable 'allProducts' sí existe en este contexto
            const filteredProducts = allProducts.filter(p => p.nombre.toLowerCase().includes(query) || (p.categoria && p.categoria.toLowerCase().includes(query)));
            displaySearchResults(filteredProducts);
        });
    }

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-container')) {
            if(searchResultsContainer) searchResultsContainer.classList.remove('active');
        }
    });
    

    // =================================================================
    //                    3. LÓGICA DEL HERO SLIDER
    // (Movida aquí dentro para que funcione correctamente)
    // =================================================================
    if (heroSlider) {
        const slides = heroSlider.querySelectorAll(".slide");
        const nextBtn = heroSlider.querySelector(".next-slide");
        const prevBtn = heroSlider.querySelector(".prev-slide");
        let currentSlide = 0;
        let slideInterval;
    
        function showSlide(index) {
            slides.forEach((slide, i) => {
                slide.classList.toggle("active", i === index);
            });
        }
    
        function nextSlide() {
            currentSlide = (currentSlide + 1) % slides.length;
            showSlide(currentSlide);
        }
    
        function startSlideShow() {
            clearInterval(slideInterval);
            slideInterval = setInterval(nextSlide, 7000);
        }
    
        if (slides.length > 1) {
            showSlide(currentSlide);
            startSlideShow();
            nextBtn.addEventListener("click", () => { nextSlide(); startSlideShow(); });
            prevBtn.addEventListener("click", () => {
                currentSlide = (currentSlide - 1 + slides.length) % slides.length;
                showSlide(currentSlide);
                startSlideShow();
            });
        }
    }


    // =================================================================
    //      4. LÓGICA DEL CARRUSEL DE CATEGORÍAS (código sin cambios)
    // =================================================================
    function getCategoryData() {
        return [{name:"Medidor de Energía",img:"imagenes_productos/001_Batería_de_Litio.png"},{name:"Inversor",img:"imagenes_productos/002_Inversor_Híbrido.png"},{name:"Caja Porta Medidor",img:"imagenes_productos/003_Inversor_On_Grid.png"},{name:"Domótica iSmart",img:"imagenes_productos/005_Tira_de_luces_inteligente.png"},{name:"Inversores",img:"imagenes_productos/002_Inversor_Híbrido.png"},{name:"Baterías",img:"imagenes_productos/001_Batería_de_Litio.png"},{name:"Reflectores",img:"imagenes_productos/007_Reflector_inteligente_sin_marco_30W.png"},{name:"Plafones",img:"imagenes_productos/008_PLAFON_REDONDO_INTELIGENTE_RGB.jpg"}];
    }
    
    function setupCategoryCarousel() {
        if (!categoryTrack) return;
        const wrapper = document.querySelector(".category-carousel-wrapper"),
            prevButton = document.getElementById("carousel-prev"),
            nextButton = document.getElementById("carousel-next"),
            cardsPerPage = 4,
            categories = getCategoryData(),
            clonedCards = categories.slice(0, cardsPerPage),
            allItems = [...categories, ...clonedCards];
        let currentIndex = 0, autoScrollInterval, isTransitioning = !1;
        const cardWidth = 250, cardMargin = 30, moveDistance = cardWidth + cardMargin;
        categoryTrack.innerHTML = allItems.map(t => `<div class="category-card" style="flex: 0 0 ${cardWidth}px; margin: 0 ${cardMargin/2}px;"><div class="img-container"><img src="${t.img}" alt="${t.name}"></div><p class="category-name">${t.name}</p><div class="cta-footer">Ver Categoría</div></div>`).join("");
        const moveTo = t => { isTransitioning = !0, categoryTrack.style.transition = "transform 0.6s ease-in-out", categoryTrack.style.transform = `translateX(-${t*moveDistance}px)` };
        categoryTrack.addEventListener("transitionend", () => { isTransitioning = !1, currentIndex >= categories.length && (categoryTrack.style.transition = "none", currentIndex = 0, categoryTrack.style.transform = "translateX(0px)") });
        const handleNext = () => { isTransitioning || (currentIndex++, moveTo(currentIndex)) };
        const handlePrev = () => { isTransitioning || currentIndex <= 0 || (currentIndex--, moveTo(currentIndex)) };
        const startAutoScroll = () => { autoScrollInterval && clearInterval(autoScrollInterval), autoScrollInterval = setInterval(handleNext, 2e3) };
        nextButton.addEventListener("click", () => { clearInterval(autoScrollInterval), handleNext() });
        prevButton.addEventListener("click", () => { clearInterval(autoScrollInterval), handlePrev() });
        wrapper.addEventListener("mouseenter", () => clearInterval(autoScrollInterval));
        wrapper.addEventListener("mouseleave", () => startAutoScroll());
        startAutoScroll()
    }


    // =================================================================
    //        5. LÓGICA DE PRODUCTOS Y EFECTO 3D (código sin cambios)
    // =================================================================
    async function fetchProducts() {
        try {
            const response = await fetch("products.json");
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            allProducts = await response.json();
            displayProducts(allProducts, currentPage);
            setupPagination(allProducts);
        } catch (error) {
            console.error("No se pudieron cargar los productos:", error);
            if(productGrid) productGrid.innerHTML = `<p style="text-align:center; color: var(--secondary-color);">Error al cargar productos.</p>`;
        }
    }

    function displayProducts(products, page) {
        if (!productGrid) return;
        productGrid.innerHTML = "";
        currentPage = page;
        const start = (page - 1) * productsPerPage,
            end = start + productsPerPage,
            paginatedProducts = products.slice(start, end);
        paginatedProducts.forEach(t => {
            const e = document.createElement("div");
            e.className = "product-card-3d", e.setAttribute("data-aos", "fade-up"), e.onclick = () => openProductModal(t), e.innerHTML = `\n                <div class="card-border"></div>\n                <div class="card-content">\n                    <div class="product-image-container">\n                        <img src="${t.imagen}" alt="${t.nombre}" class="product-image" loading="lazy">\n                    </div>\n                    <div class="product-info">\n                        <h3 class="product-name">${t.nombre}</h3>\n                        <p class="product-category">${t.categoria||"Sin categoría"}</p>\n                    </div>\n                </div>\n            `, productGrid.appendChild(e)
        }), updateActivePaginationButton(), initialize3DEffect()
    }

    function setupPagination(products) {
        if (!paginationContainer) return;
        paginationContainer.innerHTML = "";
        const pageCount = Math.ceil(products.length / productsPerPage);
        for (let i = 1; i <= pageCount; i++) {
            const btn = document.createElement("button");
            btn.className = "pagination-button", btn.innerText = i, btn.addEventListener("click", () => {
                displayProducts(products, i), window.scrollTo({
                    top: productGrid.offsetTop - 100,
                    behavior: "smooth"
                })
            }), paginationContainer.appendChild(btn)
        }
        updateActivePaginationButton()
    }

    function updateActivePaginationButton() {
        if (!paginationContainer) return;
        document.querySelectorAll(".pagination-button").forEach(t => {
            t.classList.remove("active"), parseInt(t.innerText) === currentPage && t.classList.add("active")
        })
    }
    
    function initialize3DEffect() {
        const t = document.querySelectorAll(".product-card-3d");
        if (0 !== t.length) t.forEach(t => {
            t.addEventListener("mousemove", e => {
                const o = t.getBoundingClientRect(),
                    d = e.clientX - o.left - o.width / 2,
                    n = e.clientY - o.top - o.height / 2,
                    i = .07 * d,
                    a = -.12 * n,
                    c = (e.clientX - o.left) / o.width * 100,
                    l = (e.clientY - o.top) / o.height * 100;
                t.style.transform = `rotateX(${a}deg) rotateY(${i}deg) scale3d(1.05, 1.05, 1.05)`, t.style.setProperty("--mouse-x", `${c}%`), t.style.setProperty("--mouse-y", `${l}%`)
            }), t.addEventListener("mouseleave", () => {
                t.style.transform = "rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)"
            })
        })
    }


    // =================================================================
    //         6. LÓGICA DE MODAL Y CARRITO (código sin cambios)
    // =================================================================
    window.openProductModal = product => {
        if (!modal) return;
        const t = document.getElementById("modalMainImage"),
            e = document.getElementById("modalThumbnails"),
            o = document.getElementById("modalTitle"),
            d = document.getElementById("modalCategory"),
            n = modal.querySelector(".add-to-cart-btn");
        o.textContent = product.nombre, d.textContent = product.categoria || "Equipos Industriales", e.innerHTML = "";
        const i = product.gallery_images || [product.imagen, product.imagen, product.imagen, product.imagen];
        t.src = i[0], i.forEach((o, d) => {
            const n = document.createElement("img");
            n.src = o, n.alt = `Vista ${d+1} de ${product.nombre}`, n.className = "modal-thumbnail-img", 0 === d && n.classList.add("active"), n.onclick = d => {
                d.stopPropagation(), t.style.opacity = "0", setTimeout(() => {
                    t.src = o, t.style.opacity = "1"
                }, 150), e.querySelector(".active").classList.remove("active"), n.classList.add("active")
            }, e.appendChild(n)
        }), document.getElementById("modalQuantity").value = 1, n.onclick = () => {
            addToCart(product.id, parseInt(document.getElementById("modalQuantity").value))
        }, modal.classList.add("active"), overlay.classList.add("active")
    };
    
    window.closeProductModal = () => { modal && overlay && (modal.classList.remove("active"), overlay.classList.remove("active")) };
    window.toggleCart = () => { cartSidebar && overlay && (cartSidebar.classList.toggle("active"), overlay.classList.toggle("active")) };
    
    function updateCartDisplay() {
        if (!cartItemsContainer) return;
        const t = cart.reduce((t, e) => t + e.quantity, 0);
        cartCounter && (cartCounter.textContent = t, t > 0 ? cartCounter.classList.remove("hidden") : cartCounter.classList.add("hidden")), cartItemsContainer.innerHTML = "", 0 === cart.length ? cartItemsContainer.innerHTML = '<p class="empty-cart">Tu lista de cotización está vacía.</p>' : cart.forEach(t => {
            const e = document.createElement("div");
            e.className = "cart-item", e.innerHTML = `\n                    <img src="${t.imagen}" alt="${t.nombre}" class="cart-item-image">\n                    <div class="cart-item-info">\n                        <h4>${t.nombre}</h4>\n                        <p class="cart-item-quantity">Cantidad: ${t.quantity}</p>\n                    </div>\n                    <button class="remove-from-cart-btn" onclick="removeFromCart(${t.id})">\n                        <i class="fas fa-trash-alt"></i>\n                    </button>\n                `, cartItemsContainer.appendChild(e)
        })
    }

    window.addToCart = (t, e = 1) => {
        const o = allProducts.find(e => e.id === t);
        if (!o) return;
        const d = cart.find(e => e.id === t);
        d ? d.quantity += e : cart.push({ ...o,
            quantity: e
        }), closeProductModal(), updateCartDisplay(), cartSidebar && !cartSidebar.classList.contains("active") && (toggleCart(), setTimeout(toggleCart, 1500))
    };

    window.addToCartFromModal = () => {
        const t = document.getElementById("modalTitle").textContent,
            e = allProducts.find(e => e.nombre === t);
        e && addToCart(e.id, parseInt(document.getElementById("modalQuantity").value))
    };

    window.removeFromCart = t => { cart = cart.filter(e => e.id !== t), updateCartDisplay() };
    window.increaseQuantity = () => { const t = document.getElementById("modalQuantity"); t.value = parseInt(t.value) + 1 };
    window.decreaseQuantity = () => { const t = document.getElementById("modalQuantity"); parseInt(t.value) > 1 && (t.value = parseInt(t.value) - 1) };
    

    // =================================================================
    //                    7. INICIALIZACIÓN FINAL
    // =================================================================
    fetchProducts();
    setupCategoryCarousel();

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            closeProductModal();
            if (cartSidebar.classList.contains("active")) toggleCart();
        }
    });

});

// --- FUNCIONES GLOBALES (necesarias para los 'onclick' del HTML) ---
function submitContactForm(event) {
    event.preventDefault();
    const form = event.target, name = form.querySelector("#name").value;
    alert(`¡Gracias por contactarnos, ${name}! \n\nEn un proyecto real, este formulario enviaría tus datos.\nEsta es una demostración visual.`), form.reset()
}