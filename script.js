document.addEventListener('DOMContentLoaded', () => {
    // Reveal animations on scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px"
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    const products = document.querySelectorAll('.product-card');
    products.forEach((product, index) => {
        product.style.opacity = '0';
        product.style.transform = 'translateY(30px)';
        product.style.transition = `opacity 0.5s ease ${index * 0.1}s, transform 0.5s ease ${index * 0.1}s`;
        observer.observe(product);
    });

    // We add a class to handle the animation state when it becomes visible
    document.addEventListener('scroll', () => {
        products.forEach(product => {
            if (product.classList.contains('visible')) {
                product.style.opacity = '1';
                product.style.transform = 'translateY(0)';
            }
        });
    });

    // Mobile Menu Toggle
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

    // Hero Image Slider
    const heroSlider = document.querySelector('.hero-slider');
    if (heroSlider) {
        const slides = heroSlider.querySelectorAll('.slide');
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

        function startInterval() {
            slideInterval = setInterval(nextSlide, 4000); // Auto slide every 4 seconds
        }

        startInterval();
    }

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            // If it's the order button, don't scroll
            if (this.id === 'btn-order-whatsapp') return;

            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth'
                });
            }
            // Close mobile menu if open
            if (window.innerWidth <= 768 && navLinks) {
                navLinks.style.display = 'none';
            }
        });
    });

    // --------------------------------------------------------
    // Shopping Cart Logic
    // --------------------------------------------------------
    let cart = []; // Use let to allow clearing
    let currentProductToAdd = null; // Store temp product data for modal

    const cartCountSpan = document.getElementById('cart-count');
    const toast = document.getElementById('toast');
    const navOrderBtn = document.getElementById('btn-order-whatsapp'); // Nav button

    // Check if we have the toast element, creating it dynamically if not exists (for robustness)
    // (Already in HTML now)

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

    // Quantity Elements
    const modalQuantitySelect = document.getElementById('modal-quantity-select');
    // REMOVED old button refs since we use select now

    // Add to Cart Buttons logic - OPEN MODAL
    const addToCartBtns = document.querySelectorAll('.btn-cart');

    addToCartBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const card = e.target.closest('.product-card');
            const name = card.querySelector('h3').innerText;
            const description = card.querySelector('p').innerText;
            const priceText = card.querySelector('.price').innerText;

            // Extract ingredients from description (comma separated)
            // Remove ending dot if exists
            const descClean = description.replace(/\.$/, '');
            const ingredients = descClean.split(',').map(i => i.trim());

            currentProductToAdd = {
                name: name,
                basePriceText: priceText,
                rawPrice: parseInt(priceText.replace(/\D/g, '')),
                ingredients: ingredients
            };

            openProductModal();
        });
    });

    function openProductModal() {
        if (!currentProductToAdd) return;

        modalTitle.innerText = currentProductToAdd.name;
        modalPrice.innerText = currentProductToAdd.basePriceText;
        modalNote.value = '';

        // Reset Quantity Select
        if (modalQuantitySelect) modalQuantitySelect.value = "1";

        // Generate checkboxes for ingredients
        modalIngredientsList.innerHTML = '';
        currentProductToAdd.ingredients.forEach(ing => {
            if (ing.length < 2) return; // Skip empty or tiny strings
            const label = document.createElement('label');
            label.className = 'ingredient-checkbox';
            label.innerHTML = `
                <input type="checkbox" value="${ing}" class="ing-check">
                <span>${ing} (Çıkar)</span>
            `;
            modalIngredientsList.appendChild(label);
        });

        productModal.style.display = ''; // Clear inline display:none from previous close
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

    // No more button event listeners for quantity needed

    // Confirm Add to Cart
    if (btnConfirmAdd) {
        btnConfirmAdd.addEventListener('click', () => {
            if (!currentProductToAdd) return;

            // Gather unwanted ingredients
            // "Checked" means "REMOVE" based on label text "Çıkar" ? 
            // Usually ticked means "I want this". 
            // User request: "ürünün altında olup olmamasını istediği sosları içeriği seçebilsin"
            // Let's assume unchecked = KEEP, checked = REMOVE (since label says "Çıkar")
            // Or better: List ingredients, Unchecked = Remove. 
            // Let's flip it for better UX: "Malzemeler (İstediklerinizi İşaretleyin)" -> Default ALL Checked.
            // But code above says "Çıkar" in label. Let's stick to "Checked = REMOVE" for now based on previous simple text gen?
            // Actually, standard is "Uncheck to remove". 
            // Let's change label generation above to "Checked by default".

            // RE-GENERATING LOGIC for UX: 
            // We will let user UNCHECK what they DON'T want.
            // So default state: everything checked.

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
                name: currentProductToAdd.name,
                price: currentProductToAdd.basePriceText, // Keep single unit price text for display reference, or calc total?
                // Let's store single price but calculate total raw
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

    // click outside product modal
    window.addEventListener('click', (e) => {
        if (e.target === productModal) {
            closeProductModal();
        }
    });


    function updateCartCount() {
        let totalCount = 0;
        cart.forEach(item => totalCount += item.quantity); // Count items by quantity or just lines? usually quantity
        // If client wants just distinct items, use cart.length. Let's use total units.
        // Actually simple (cart.length) is often less confusing unless it's a bulk store. 
        // Let's stick to cart.length (number of lines) for badge, or sum? 
        // Let's sum quantity for accurate "item count".

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

    // Modal Open/Close Logic (Cart)
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

    // Close on click outside
    if (cartModalOverlay) {
        cartModalOverlay.addEventListener('click', (e) => {
            if (e.target === cartModalOverlay) {
                closeCartModal();
            }
        });
    }

    // Render Cart Items
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

            // Format customization text
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
                <!-- Delete button always shows trash icon, but decrements if qty > 1 -->
                <button class="btn-remove-item" data-index="${index}" title="Azalt / Kaldır">
                    <i class="fas fa-trash"></i> 
                </button>
            `;
            cartItemsContainer.appendChild(itemDiv);
        });

        cartTotalPriceSpan.innerText = `${total} TL`;

        // Add event listeners to delete buttons
        const removeButtons = document.querySelectorAll('.btn-remove-item');
        removeButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(btn.getAttribute('data-index'));
                removeItemFromCart(index);
            });
        });
    }

    function removeItemFromCart(index) {
        const item = cart[index];
        if (item.quantity > 1) {
            item.quantity--;
            // Recalculate total price for this line
            item.rawTotalPrice = item.rawUnitPrice * item.quantity;
        } else {
            // Remove completely
            cart.splice(index, 1);
        }
        updateCartCount();
        renderCartItems();
    }

    // Clear All Logic
    if (btnClearCart) {
        btnClearCart.addEventListener('click', () => {
            if (confirm('Sepeti tamamen boşaltmak istediğinize emin misiniz?')) {
                cart = [];
                updateCartCount();
                renderCartItems();
                closeCartModal();

                // Redirect to menu logic
                const menuSection = document.getElementById('menu');
                if (menuSection) {
                    menuSection.scrollIntoView({ behavior: 'smooth' });
                }
            }
        });
    }

    // Checkout / WhatsApp Logic
    if (btnCheckout) {
        btnCheckout.addEventListener('click', () => {
            if (cart.length === 0) {
                alert("Sepetiniz boş! Lütfen önce menüden ürün seçin.");
                return;
            }

            // Phone number
            const phoneNumber = "905380562640";

            // Build the message
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
                message += '\n'; // spacing
            });

            message += `--------------------\n*TOPLAM TUTAR: ${total} TL*\n\n`;
            message += "Lütfen siparişimi onaylayın. Teşekkürler!";

            // Encode for URL
            const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

            // Redirect
            window.open(whatsappUrl, '_blank');
        });
    }
});
