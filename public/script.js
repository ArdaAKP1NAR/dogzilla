document.addEventListener('DOMContentLoaded', () => {
    // --------------------------------------------------------
    // Dynamic Product Loading from API
    // --------------------------------------------------------
    const productGrid = document.getElementById('product-grid');

    async function loadProducts() {
        try {
            const response = await fetch('/api/products');
            if (!response.ok) throw new Error('API hatası');
            const products = await response.json();
            renderProductCards(products);
        } catch (err) {
            console.error('Ürünler yüklenemedi:', err);
            productGrid.innerHTML = `
                <div class="error-msg">
                    <p>Menü yüklenirken bir hata oluştu.</p>
                    <button class="btn-primary" onclick="location.reload()">Tekrar Dene</button>
                </div>
            `;
        }
    }

    function renderProductCards(products) {
        const container = document.getElementById('product-grid');
        container.innerHTML = '';
        container.classList.remove('product-grid');
        container.classList.add('menu-container');

        if (products.length === 0) {
            container.innerHTML = '<p class="empty-msg">Henüz ürün eklenmemiş.</p>';
            return;
        }

        // --------------------------------------------------------
        // Populate Hero Slider dynamically with Hot Dog images
        // --------------------------------------------------------
        const sliderWrapper = document.querySelector('.slider-wrapper');
        if (sliderWrapper) {
            const hotdogImages = products
                .filter(p => p.category_name === 'Hot Dogs' && p.image_url)
                .map(p => ({ url: p.image_url, name: p.name }));

            if (hotdogImages.length > 0) {
                sliderWrapper.innerHTML = '';
                hotdogImages.forEach((img, index) => {
                    const slide = document.createElement('div');
                    slide.className = index === 0 ? 'slide active' : 'slide';
                    slide.innerHTML = `<img src="${img.url}" alt="${img.name}" loading="${index === 0 ? 'eager' : 'lazy'}">`;
                    sliderWrapper.appendChild(slide);
                });
                
                // Re-initialize slider with new dynamic slides
                initSlider();
            }
        }

        const groups = {};
        products.forEach(product => {
            const cat = product.category_name || 'Diğer';
            if (!groups[cat]) groups[cat] = [];
            groups[cat].push(product);
        });

        const order = ['Hot Dogs', 'Yan Ürünler', 'İçecekler'];
        Object.keys(groups).forEach(cat => {
            if (!order.includes(cat)) order.push(cat);
        });

        let totalIndex = 0;

        order.forEach(categoryName => {
            const categoryProducts = groups[categoryName];
            if (!categoryProducts || categoryProducts.length === 0) return;

            const categorySection = document.createElement('div');
            categorySection.className = 'category-section';
            
            categorySection.innerHTML = `
                <div class="category-header">
                    <h3>${categoryName}</h3>
                </div>
                <div class="product-grid"></div>
            `;
            
            const grid = categorySection.querySelector('.product-grid');

            categoryProducts.forEach(product => {
                const card = document.createElement('div');
                card.className = 'product-card';
                card.style.opacity = '0';
                card.style.transform = 'translateY(30px)';
                card.style.transition = `opacity 0.5s ease ${totalIndex * 0.05}s, transform 0.5s ease ${totalIndex * 0.05}s`;
                
                totalIndex++;

                let imageHtml;
                if (product.image_url) {
                    imageHtml = `<img src="${product.image_url}" alt="${product.name}">`;
                } else {
                    imageHtml = `
                        <div class="image-placeholder">
                            <span>Resim Yükle<br>(${product.name.toLowerCase()}.jpg)</span>
                        </div>
                    `;
                }

                const badgeHtml = product.badge
                    ? `<div class="badge">${product.badge}</div>`
                    : '';

                const priceText = `${parseFloat(product.price).toFixed(0)} TL`;
                const descHtml = product.description ? `<p>${product.description}</p>` : '';

                card.innerHTML = `
                    <div class="card-image">
                        ${imageHtml}
                        ${badgeHtml}
                    </div>
                    <div class="card-info">
                        <div class="card-details">
                            <h3>${product.name}</h3>
                            ${descHtml}
                        </div>
                        <div class="card-action">
                            <div class="price">${priceText}</div>
                            <button class="btn-cart"
                                data-id="${product.id}"
                                data-name="${product.name}"
                                data-price="${product.price}"
                                data-description="${product.description}">
                                Ekle
                            </button>
                        </div>
                    </div>
                `;

                grid.appendChild(card);
            });

            container.appendChild(categorySection);
        });

        // Animate cards in
        requestAnimationFrame(() => {
            const cards = container.querySelectorAll('.product-card');
            cards.forEach(card => {
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            });
        });

        // Attach "add to cart" event listeners
        attachCartButtons();

        // Re-observe for scroll animations
        observeCards();
    }

    // --------------------------------------------------------
    // Scroll Reveal Observer
    // --------------------------------------------------------
    const observerOptions = {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px"
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    function observeCards() {
        const cards = document.querySelectorAll('.product-card');
        cards.forEach(card => observer.observe(card));
    }

    // --------------------------------------------------------
    // Mobile Menu Toggle
    // --------------------------------------------------------
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');

    if (hamburger && navLinks) {
        hamburger.addEventListener('click', () => {
            if (navLinks.style.display === 'flex') {
                navLinks.style.display = 'none';
            } else {
                navLinks.style.display = 'flex';
                navLinks.style.flexDirection = 'column';
                navLinks.style.position = 'absolute';
                navLinks.style.top = '80px';
                navLinks.style.left = '0';
                navLinks.style.width = '100%';
                navLinks.style.background = '#0d0d0d';
                navLinks.style.padding = '2rem';
                navLinks.style.borderBottom = '1px solid #FF4500';
            }
        });
    }

    // --------------------------------------------------------
    // Hero Image Slider
    // --------------------------------------------------------
    let sliderInterval;
    function initSlider() {
        const heroSlider = document.querySelector('.hero-slider');
        if (heroSlider) {
            const slides = heroSlider.querySelectorAll('.slide');
            if (slides.length <= 1) return;

            let currentSlide = 0;
            if (sliderInterval) clearInterval(sliderInterval);

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

            sliderInterval = setInterval(nextSlide, 4000);
        }
    }
    
    // Initialize with static HTML slides (if any)
    initSlider();

    // --------------------------------------------------------
    // Smooth scroll for anchor links
    // --------------------------------------------------------
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            if (this.id === 'btn-order-whatsapp') return;

            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({ behavior: 'smooth' });
            }
            if (window.innerWidth <= 768 && navLinks) {
                navLinks.style.display = 'none';
            }
        });
    });

    // --------------------------------------------------------
    // Shopping Cart Logic
    // --------------------------------------------------------
    let cart = [];
    let currentProductToAdd = null;

    const cartCountSpan = document.getElementById('cart-count');
    const toast = document.getElementById('toast');
    const navOrderBtn = document.getElementById('btn-order-whatsapp');

    // Cart Modal Elements
    const cartModalOverlay = document.getElementById('cart-modal');
    const closeCartBtn = document.getElementById('close-cart');
    const cartItemsContainer = document.getElementById('cart-items');
    const cartTotalPriceSpan = document.getElementById('cart-total-price');
    const btnClearCart = document.getElementById('btn-clear-cart');
    const btnCheckout = document.getElementById('btn-checkout');

    // Product Customization Modal Elements
    const productModal = document.getElementById('product-modal');
    const modalTitle = document.getElementById('modal-product-title');
    const modalPrice = document.getElementById('modal-product-price');
    const modalIngredientsList = document.getElementById('modal-ingredients-list');
    const modalNote = document.getElementById('modal-product-note');
    const btnCancelProduct = document.getElementById('btn-cancel-product');
    const btnConfirmAdd = document.getElementById('btn-confirm-add');
    const modalQuantitySelect = document.getElementById('modal-quantity-select');

    // Attach cart button event listeners (called after dynamic render)
    function attachCartButtons() {
        const addToCartBtns = document.querySelectorAll('.btn-cart');
        addToCartBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const productId = parseInt(btn.dataset.id);
                const name = btn.dataset.name;
                const price = parseFloat(btn.dataset.price);
                const description = btn.dataset.description;

                // Extract ingredients from description
                const descClean = description.replace(/\.$/, '');
                const ingredients = descClean.split(',').map(i => i.trim());

                currentProductToAdd = {
                    id: productId,
                    name: name,
                    rawPrice: price,
                    basePriceText: `${price.toFixed(0)} TL`,
                    ingredients: ingredients
                };

                openProductModal();
            });
        });
    }

    function openProductModal() {
        if (!currentProductToAdd) return;

        modalTitle.innerText = currentProductToAdd.name;
        modalPrice.innerText = currentProductToAdd.basePriceText;
        modalNote.value = '';

        if (modalQuantitySelect) modalQuantitySelect.value = "1";

        // Generate checkboxes for ingredients
        modalIngredientsList.innerHTML = '';
        currentProductToAdd.ingredients.forEach(ing => {
            if (ing.length < 2) return;
            const label = document.createElement('label');
            label.className = 'ingredient-checkbox';
            label.innerHTML = `
                <input type="checkbox" value="${ing}" class="ing-check">
                <span>${ing} (Çıkar)</span>
            `;
            modalIngredientsList.appendChild(label);
        });

        productModal.style.display = '';
        productModal.classList.add('open');
        document.body.style.overflow = 'hidden';
    }

    function closeProductModal() {
        productModal.classList.remove('open');
        setTimeout(() => {
            productModal.style.display = 'none';
            document.body.style.overflow = '';
        }, 300);
    }

    // Confirm Add to Cart
    if (btnConfirmAdd) {
        btnConfirmAdd.addEventListener('click', () => {
            if (!currentProductToAdd) return;

            const checks = modalIngredientsList.querySelectorAll('.ing-check');
            let removedIngredients = [];

            checks.forEach(chk => {
                if (chk.checked) {
                    removedIngredients.push(chk.value);
                }
            });

            const note = modalNote.value.trim();
            const qtyVal = modalQuantitySelect ? parseInt(modalQuantitySelect.value) : 1;
            const totalPrice = currentProductToAdd.rawPrice * qtyVal;

            const finalizeItem = {
                productId: currentProductToAdd.id,
                name: currentProductToAdd.name,
                price: currentProductToAdd.basePriceText,
                rawUnitPrice: currentProductToAdd.rawPrice,
                rawTotalPrice: totalPrice,
                quantity: qtyVal,
                removedIngredients: removedIngredients,
                note: note
            };

            cart.push(finalizeItem);
            updateCartCount();
            showToast();
            closeProductModal();
            currentProductToAdd = null;
        });
    }

    if (btnCancelProduct) {
        btnCancelProduct.addEventListener('click', closeProductModal);
    }

    // Click outside product modal
    window.addEventListener('click', (e) => {
        if (e.target === productModal) {
            closeProductModal();
        }
    });

    function updateCartCount() {
        let totalCount = 0;
        cart.forEach(item => totalCount += item.quantity);

        if (cartCountSpan) {
            if (totalCount > 0) {
                cartCountSpan.innerText = `(${totalCount})`;
                cartCountSpan.style.display = 'inline';
            } else {
                cartCountSpan.style.display = 'none';
            }
        }
        if (cartModalOverlay && cartModalOverlay.classList.contains('open')) {
            renderCartItems();
        }
    }

    function showToast() {
        if (toast) {
            toast.classList.add('show');
            setTimeout(() => {
                toast.classList.remove('show');
            }, 3000);
        }
    }

    // --------------------------------------------------------
    // Cart Modal Open/Close
    // --------------------------------------------------------
    function openCartModal() {
        renderCartItems();
        cartModalOverlay.style.display = 'flex';
        setTimeout(() => {
            cartModalOverlay.classList.add('open');
        }, 10);
        document.body.style.overflow = 'hidden';
    }

    function closeCartModal() {
        cartModalOverlay.classList.remove('open');
        setTimeout(() => {
            cartModalOverlay.style.display = 'none';
            document.body.style.overflow = '';
        }, 300);
    }

    if (navOrderBtn) {
        navOrderBtn.addEventListener('click', (e) => {
            e.preventDefault();
            openCartModal();
        });
    }

    if (closeCartBtn) {
        closeCartBtn.addEventListener('click', closeCartModal);
    }

    if (cartModalOverlay) {
        cartModalOverlay.addEventListener('click', (e) => {
            if (e.target === cartModalOverlay) {
                closeCartModal();
            }
        });
    }

    // --------------------------------------------------------
    // Render Cart Items
    // --------------------------------------------------------
    function renderCartItems() {
        cartItemsContainer.innerHTML = '';
        let total = 0;

        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '<div class="empty-cart-msg">Sepetin şu an boş.</div>';
            cartTotalPriceSpan.innerText = '0 TL';
            return;
        }

        cart.forEach((item, index) => {
            total += item.rawTotalPrice;

            let customHtml = '';
            if (item.removedIngredients && item.removedIngredients.length > 0) {
                customHtml += `<div style="font-size: 0.85rem; color: #ff6b6b;">🚫 Çıkarılan: ${item.removedIngredients.join(', ')}</div>`;
            }
            if (item.note) {
                customHtml += `<div style="font-size: 0.85rem; color: #74c0fc;">📝 Not: ${item.note}</div>`;
            }

            const itemDiv = document.createElement('div');
            itemDiv.classList.add('cart-item');
            itemDiv.innerHTML = `
                <div class="cart-item-info">
                    <h4>${item.name}</h4>
                    <span class="cart-item-price">${item.rawTotalPrice} TL <span style="color:white; font-weight:300; font-size:0.9em;">(${item.quantity} Adet)</span></span>
                    ${customHtml}
                </div>
                <button class="btn-remove-item" data-index="${index}" title="Azalt / Kaldır">
                    <i class="fas fa-trash"></i>
                </button>
            `;
            cartItemsContainer.appendChild(itemDiv);
        });

        cartTotalPriceSpan.innerText = `${total} TL`;

        const removeButtons = document.querySelectorAll('.btn-remove-item');
        removeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const index = parseInt(btn.getAttribute('data-index'));
                removeItemFromCart(index);
            });
        });
    }

    function removeItemFromCart(index) {
        const item = cart[index];
        if (item.quantity > 1) {
            item.quantity--;
            item.rawTotalPrice = item.rawUnitPrice * item.quantity;
        } else {
            cart.splice(index, 1);
        }
        updateCartCount();
        renderCartItems();
    }

    // Clear All
    if (btnClearCart) {
        btnClearCart.addEventListener('click', () => {
            if (confirm('Sepeti tamamen boşaltmak istediğinize emin misiniz?')) {
                cart = [];
                updateCartCount();
                renderCartItems();
                closeCartModal();

                const menuSection = document.getElementById('menu');
                if (menuSection) {
                    menuSection.scrollIntoView({ behavior: 'smooth' });
                }
            }
        });
    }

    // --------------------------------------------------------
    // Checkout — Save to DB + WhatsApp
    // --------------------------------------------------------
    if (btnCheckout) {
        btnCheckout.addEventListener('click', async () => {
            if (cart.length === 0) {
                alert("Sepetiniz boş! Lütfen önce menüden ürün seçin.");
                return;
            }

            // 1. Save order to database
            try {
                const orderData = {
                    items: cart.map(item => ({
                        product_id: item.productId,
                        product_name: item.name,
                        quantity: item.quantity,
                        unit_price: item.rawUnitPrice,
                        removed_ingredients: item.removedIngredients,
                        note: item.note
                    }))
                };

                const response = await fetch('/api/orders', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(orderData)
                });

                if (!response.ok) {
                    console.error('Sipariş kaydedilemedi');
                }
            } catch (err) {
                console.error('Sipariş kayıt hatası:', err);
            }

            // 2. Send to WhatsApp
            const phoneNumber = "905380562640";

            let message = "Merhaba, DOGZILLA'dan sipariş vermek istiyorum! 🌭\n\n*SİPARİŞ DETAYLARI:*\n--------------------\n";

            let total = 0;
            cart.forEach((item, index) => {
                total += item.rawTotalPrice;
                message += `${index + 1}. *${item.name}* (x${item.quantity}) - ${item.rawTotalPrice} TL\n`;

                if (item.removedIngredients && item.removedIngredients.length > 0) {
                    message += `   🚫 İstenmeyen: ${item.removedIngredients.join(', ')}\n`;
                }
                if (item.note) {
                    message += `   📝 Not: ${item.note}\n`;
                }
                message += '\n';
            });

            message += `--------------------\n*TOPLAM TUTAR: ${total} TL*\n\n`;
            message += "Lütfen siparişimi onaylayın. Teşekkürler!";

            const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
            window.open(whatsappUrl, '_blank');

            // Clear cart after order
            cart = [];
            updateCartCount();
            closeCartModal();
        });
    }

    // --------------------------------------------------------
    // Deep Linking for Footer (Instagram & Maps)
    // --------------------------------------------------------
    const instaLink = document.getElementById('footer-insta-link');
    if (instaLink) {
        instaLink.addEventListener('click', (e) => {
            e.preventDefault();
            const fallback = instaLink.href;
            const userAgent = navigator.userAgent || navigator.vendor || window.opera;
            
            if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
                window.location.href = 'instagram://user?username=hot.dogzilla';
                setTimeout(() => { window.location.href = fallback; }, 1000);
            } else if (/android/i.test(userAgent)) {
                window.location.href = 'intent://instagram.com/_u/hot.dogzilla/#Intent;package=com.instagram.android;scheme=https;end';
            } else {
                window.open(fallback, '_blank');
            }
        });
    }

    const mapLink = document.getElementById('footer-map-link');
    if (mapLink) {
        mapLink.addEventListener('click', (e) => {
            e.preventDefault();
            const fallback = mapLink.href;
            const userAgent = navigator.userAgent || navigator.vendor || window.opera;
            const lat = '36.4150713';
            const lng = '35.8962197';
            
            if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
                window.location.href = `maps://?q=DOGZILLA&ll=${lat},${lng}`;
                setTimeout(() => { window.location.href = fallback; }, 1000);
            } else if (/android/i.test(userAgent)) {
                window.location.href = `intent://maps.google.com/maps?q=${lat},${lng}#Intent;scheme=http;package=com.google.android.apps.maps;end`;
            } else {
                window.open(fallback, '_blank');
            }
        });
    }

    // --------------------------------------------------------
    // Initialize — Load Products
    // --------------------------------------------------------
    loadProducts();
});
