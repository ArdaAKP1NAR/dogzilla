document.addEventListener('DOMContentLoaded', () => {

    // ============================================
    // Toast Notification
    // ============================================
    let toastEl = document.createElement('div');
    toastEl.className = 'admin-toast';
    toastEl.innerHTML = '<i class="fas fa-check-circle"></i> <span></span>';
    document.body.appendChild(toastEl);

    function showToast(message, type = 'success') {
        toastEl.className = `admin-toast ${type}`;
        toastEl.querySelector('i').className = type === 'success'
            ? 'fas fa-check-circle'
            : 'fas fa-exclamation-circle';
        toastEl.querySelector('span').textContent = message;
        toastEl.classList.add('show');
        setTimeout(() => toastEl.classList.remove('show'), 3000);
    }

    // ============================================
    // Auth: Login / Logout / Check
    // ============================================
    const loginScreen = document.getElementById('login-screen');
    const adminPanel = document.getElementById('admin-panel');
    const loginForm = document.getElementById('login-form');
    const loginError = document.getElementById('login-error');
    const btnLogout = document.getElementById('btn-logout');

    async function checkAuth() {
        try {
            const res = await fetch('/api/admin/check');
            const data = await res.json();
            if (data.authenticated) {
                loginScreen.style.display = 'none';
                adminPanel.style.display = 'block';
                loadAllData();
            }
        } catch (err) {
            console.error('Auth check error:', err);
        }
    }

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        loginError.textContent = '';

        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;

        try {
            const res = await fetch('/api/admin/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await res.json();

            if (data.success) {
                loginScreen.style.display = 'none';
                adminPanel.style.display = 'block';
                loadAllData();
            } else {
                loginError.textContent = data.error || 'Giriş başarısız.';
            }
        } catch (err) {
            loginError.textContent = 'Sunucu hatası. Tekrar deneyin.';
        }
    });

    btnLogout.addEventListener('click', async () => {
        try {
            await fetch('/api/admin/logout', { method: 'POST' });
            adminPanel.style.display = 'none';
            loginScreen.style.display = 'flex';
            document.getElementById('login-username').value = '';
            document.getElementById('login-password').value = '';
        } catch (err) {
            console.error('Logout error:', err);
        }
    });

    // ============================================
    // Tab Navigation
    // ============================================
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
        });
    });

    // ============================================
    // Load All Data
    // ============================================
    function loadAllData() {
        loadCategories();
        loadProducts();
        loadOrders();
    }

    // ============================================
    // CATEGORIES
    // ============================================
    let categoriesCache = [];

    async function loadCategories() {
        try {
            const res = await fetch('/api/admin/categories');
            categoriesCache = await res.json();
            renderCategoriesTable();
            populateCategoryDropdown();
        } catch (err) {
            console.error('Categories load error:', err);
        }
    }

    function renderCategoriesTable() {
        const tbody = document.getElementById('categories-tbody');
        if (categoriesCache.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="loading-cell">Henüz kategori yok.</td></tr>';
            return;
        }

        tbody.innerHTML = categoriesCache.map(cat => `
            <tr>
                <td>${cat.id}</td>
                <td><strong>${cat.name}</strong></td>
                <td>${cat.sort_order}</td>
                <td>
                    <div class="action-btns">
                        <button class="btn-action" onclick="editCategory(${cat.id})" title="Düzenle">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-action delete" onclick="deleteCategory(${cat.id})" title="Sil">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    function populateCategoryDropdown() {
        const select = document.getElementById('product-category');
        const currentVal = select.value;
        select.innerHTML = '<option value="">-- Seçiniz --</option>';
        categoriesCache.forEach(cat => {
            select.innerHTML += `<option value="${cat.id}">${cat.name}</option>`;
        });
        if (currentVal) select.value = currentVal;
    }

    // Category Form
    const categoryForm = document.getElementById('category-form');
    const categoryEditId = document.getElementById('category-edit-id');
    const categoryFormTitle = document.getElementById('category-form-title');
    const categoryCancelBtn = document.getElementById('category-cancel-btn');
    const categorySubmitBtn = document.getElementById('category-submit-btn');

    categoryForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const data = {
            name: document.getElementById('category-name').value,
            sort_order: parseInt(document.getElementById('category-sort').value) || 0
        };

        const editId = categoryEditId.value;
        const url = editId ? `/api/admin/categories/${editId}` : '/api/admin/categories';
        const method = editId ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const result = await res.json();
            if (result.success) {
                showToast(result.message);
                resetCategoryForm();
                loadCategories();
            } else {
                showToast(result.error || 'Hata oluştu.', 'error');
            }
        } catch (err) {
            showToast('Sunucu hatası.', 'error');
        }
    });

    window.editCategory = function (id) {
        const cat = categoriesCache.find(c => c.id === id);
        if (!cat) return;

        categoryEditId.value = cat.id;
        document.getElementById('category-name').value = cat.name;
        document.getElementById('category-sort').value = cat.sort_order;

        categoryFormTitle.innerHTML = '<i class="fas fa-edit"></i> Kategori Düzenle';
        categorySubmitBtn.innerHTML = '<i class="fas fa-save"></i> Güncelle';
        categoryCancelBtn.style.display = 'flex';
    };

    window.deleteCategory = async function (id) {
        if (!confirm('Bu kategoriyi silmek istediğinize emin misiniz?')) return;
        try {
            const res = await fetch(`/api/admin/categories/${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
                showToast(data.message);
                loadCategories();
            } else {
                showToast(data.error || 'Hata oluştu.', 'error');
            }
        } catch (err) {
            showToast('Sunucu hatası.', 'error');
        }
    };

    categoryCancelBtn.addEventListener('click', resetCategoryForm);

    function resetCategoryForm() {
        categoryForm.reset();
        categoryEditId.value = '';
        categoryFormTitle.innerHTML = '<i class="fas fa-plus-circle"></i> Yeni Kategori Ekle';
        categorySubmitBtn.innerHTML = '<i class="fas fa-save"></i> Kategori Ekle';
        categoryCancelBtn.style.display = 'none';
    }

    // ============================================
    // PRODUCTS
    // ============================================
    let productsCache = [];

    async function loadProducts() {
        try {
            const res = await fetch('/api/admin/products');
            productsCache = await res.json();
            renderProductsTable();
        } catch (err) {
            console.error('Products load error:', err);
        }
    }

    function renderProductsTable() {
        const tbody = document.getElementById('products-tbody');
        if (productsCache.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="loading-cell">Henüz ürün yok.</td></tr>';
            return;
        }

        tbody.innerHTML = productsCache.map(p => {
            const imgHtml = p.image_url
                ? `<img src="/${p.image_url}" class="table-thumb" alt="${p.name}">`
                : `<div class="table-thumb-placeholder"><i class="fas fa-image"></i></div>`;

            const statusClass = p.is_active ? 'status-active' : 'status-inactive';
            const statusText = p.is_active ? 'Aktif' : 'Pasif';
            const categoryName = p.category_name || '-';
            const badgeHtml = p.badge ? `<span class="status-badge status-pending">${p.badge}</span>` : '-';

            return `
                <tr>
                    <td>${p.id}</td>
                    <td>${imgHtml}</td>
                    <td><strong>${p.name}</strong></td>
                    <td>${categoryName}</td>
                    <td>${parseFloat(p.price).toFixed(0)} TL</td>
                    <td>${badgeHtml}</td>
                    <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                    <td>
                        <div class="action-btns">
                            <button class="btn-action" onclick="editProduct(${p.id})" title="Düzenle">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn-action delete" onclick="deleteProduct(${p.id})" title="Sil">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    // Product Form Elements
    const productForm = document.getElementById('product-form');
    const productEditId = document.getElementById('product-edit-id');
    const productFormTitle = document.getElementById('product-form-title');
    const productSubmitBtn = document.getElementById('product-submit-btn');
    const productCancelBtn = document.getElementById('product-cancel-btn');
    const productImageUrl = document.getElementById('product-image-url');
    const productImageFile = document.getElementById('product-image-file');
    const uploadArea = document.getElementById('upload-area');
    const uploadPlaceholder = document.getElementById('upload-placeholder');
    const uploadPreview = document.getElementById('upload-preview');

    // Live Preview Elements
    const previewName = document.getElementById('preview-name');
    const previewDescription = document.getElementById('preview-description');
    const previewPrice = document.getElementById('preview-price');
    const previewBadge = document.getElementById('preview-badge');
    const previewImage = document.getElementById('preview-image');
    const previewImagePlaceholder = document.getElementById('preview-image-placeholder');

    // ============================================
    // LIVE PREVIEW — Real-time DOM Manipulation
    // ============================================
    const nameInput = document.getElementById('product-name');
    const descInput = document.getElementById('product-description');
    const priceInput = document.getElementById('product-price');
    const badgeInput = document.getElementById('product-badge');

    nameInput.addEventListener('input', () => {
        previewName.textContent = nameInput.value.toUpperCase() || 'ÜRÜN ADI';
    });

    descInput.addEventListener('input', () => {
        previewDescription.textContent = descInput.value || 'Ürün açıklaması burada görünecek...';
    });

    priceInput.addEventListener('input', () => {
        previewPrice.textContent = (priceInput.value || '0') + ' TL';
    });

    badgeInput.addEventListener('input', () => {
        const val = badgeInput.value.trim().toUpperCase();
        if (val) {
            previewBadge.textContent = val;
            previewBadge.style.display = 'block';
        } else {
            previewBadge.style.display = 'none';
        }
    });

    // ============================================
    // Image Upload
    // ============================================
    uploadArea.addEventListener('click', () => {
        productImageFile.click();
    });

    productImageFile.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Show local preview immediately
        const reader = new FileReader();
        reader.onload = (ev) => {
            uploadPreview.src = ev.target.result;
            uploadPreview.style.display = 'block';
            uploadPlaceholder.style.display = 'none';

            // Update live preview
            previewImage.src = ev.target.result;
            previewImage.style.display = 'block';
            previewImagePlaceholder.style.display = 'none';
        };
        reader.readAsDataURL(file);

        // Upload to server
        const formData = new FormData();
        formData.append('image', file);

        try {
            const res = await fetch('/api/admin/upload', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            if (data.success) {
                productImageUrl.value = data.image_url;
                showToast('Resim yüklendi.');
            } else {
                showToast(data.error || 'Resim yüklenemedi.', 'error');
            }
        } catch (err) {
            showToast('Resim yükleme hatası.', 'error');
        }
    });

    // ============================================
    // Product Form Submit
    // ============================================
    productForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const data = {
            name: nameInput.value,
            description: descInput.value,
            price: parseFloat(priceInput.value),
            image_url: productImageUrl.value || null,
            badge: badgeInput.value.trim() || null,
            category_id: document.getElementById('product-category').value || null,
            is_active: document.getElementById('product-active').value === 'true',
            sort_order: parseInt(document.getElementById('product-sort').value) || 0
        };

        const editId = productEditId.value;
        const url = editId ? `/api/admin/products/${editId}` : '/api/admin/products';
        const method = editId ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const result = await res.json();
            if (result.success) {
                showToast(result.message);
                resetProductForm();
                loadProducts();
            } else {
                showToast(result.error || 'Hata oluştu.', 'error');
            }
        } catch (err) {
            showToast('Sunucu hatası.', 'error');
        }
    });

    window.editProduct = function (id) {
        const p = productsCache.find(pr => pr.id === id);
        if (!p) return;

        productEditId.value = p.id;
        nameInput.value = p.name;
        descInput.value = p.description;
        priceInput.value = parseFloat(p.price);
        badgeInput.value = p.badge || '';
        document.getElementById('product-category').value = p.category_id || '';
        document.getElementById('product-sort').value = p.sort_order;
        document.getElementById('product-active').value = p.is_active ? 'true' : 'false';
        productImageUrl.value = p.image_url || '';

        // Update preview
        previewName.textContent = p.name;
        previewDescription.textContent = p.description;
        previewPrice.textContent = parseFloat(p.price).toFixed(0) + ' TL';

        if (p.badge) {
            previewBadge.textContent = p.badge;
            previewBadge.style.display = 'block';
        } else {
            previewBadge.style.display = 'none';
        }

        if (p.image_url) {
            uploadPreview.src = '/' + p.image_url;
            uploadPreview.style.display = 'block';
            uploadPlaceholder.style.display = 'none';
            previewImage.src = '/' + p.image_url;
            previewImage.style.display = 'block';
            previewImagePlaceholder.style.display = 'none';
        } else {
            uploadPreview.style.display = 'none';
            uploadPlaceholder.style.display = 'block';
            previewImage.style.display = 'none';
            previewImagePlaceholder.style.display = 'flex';
        }

        productFormTitle.innerHTML = '<i class="fas fa-edit"></i> Ürün Düzenle';
        productSubmitBtn.innerHTML = '<i class="fas fa-save"></i> Güncelle';
        productCancelBtn.style.display = 'flex';

        // Scroll to form
        document.getElementById('tab-products').scrollTo({ top: 0, behavior: 'smooth' });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    window.deleteProduct = async function (id) {
        if (!confirm('Bu ürünü silmek istediğinize emin misiniz?')) return;
        try {
            const res = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
                showToast(data.message);
                loadProducts();
            } else {
                showToast(data.error || 'Hata oluştu.', 'error');
            }
        } catch (err) {
            showToast('Sunucu hatası.', 'error');
        }
    };

    productCancelBtn.addEventListener('click', resetProductForm);

    function resetProductForm() {
        productForm.reset();
        productEditId.value = '';
        productImageUrl.value = '';
        productFormTitle.innerHTML = '<i class="fas fa-plus-circle"></i> Yeni Ürün Ekle';
        productSubmitBtn.innerHTML = '<i class="fas fa-save"></i> Ürün Ekle';
        productCancelBtn.style.display = 'none';

        // Reset preview
        previewName.textContent = 'ÜRÜN ADI';
        previewDescription.textContent = 'Ürün açıklaması burada görünecek...';
        previewPrice.textContent = '0 TL';
        previewBadge.style.display = 'none';
        previewImage.style.display = 'none';
        previewImagePlaceholder.style.display = 'flex';
        uploadPreview.style.display = 'none';
        uploadPlaceholder.style.display = 'block';
    }

    // ============================================
    // ORDERS
    // ============================================
    let ordersCache = [];

    async function loadOrders() {
        try {
            const res = await fetch('/api/admin/orders');
            ordersCache = await res.json();
            renderOrdersTable();
        } catch (err) {
            console.error('Orders load error:', err);
        }
    }

    const statusLabels = {
        pending: 'Bekliyor',
        confirmed: 'Onaylandı',
        preparing: 'Hazırlanıyor',
        ready: 'Hazır',
        delivered: 'Teslim Edildi',
        cancelled: 'İptal'
    };

    function renderOrdersTable() {
        const tbody = document.getElementById('orders-tbody');
        if (ordersCache.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="loading-cell">Henüz sipariş yok.</td></tr>';
            return;
        }

        tbody.innerHTML = ordersCache.map(order => {
            const date = new Date(order.created_at).toLocaleString('tr-TR');
            const itemsHtml = order.items
                ? order.items.map(i => `<strong>${i.product_name}</strong> x${i.quantity}`).join(', ')
                : '-';

            const statusOptions = Object.entries(statusLabels).map(([val, label]) =>
                `<option value="${val}" ${order.status === val ? 'selected' : ''}>${label}</option>`
            ).join('');

            return `
                <tr>
                    <td>#${order.id}</td>
                    <td>${date}</td>
                    <td><div class="order-items-list">${itemsHtml}</div></td>
                    <td><strong>${parseFloat(order.total_price).toFixed(0)} TL</strong></td>
                    <td>
                        <select class="status-select" onchange="updateOrderStatus(${order.id}, this.value)">
                            ${statusOptions}
                        </select>
                    </td>
                    <td>
                        <div class="action-btns">
                            <button class="btn-action delete" onclick="deleteOrder(${order.id})" title="Sil">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    window.updateOrderStatus = async function (id, status) {
        try {
            const res = await fetch(`/api/admin/orders/${id}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });
            const data = await res.json();
            if (data.success) {
                showToast('Sipariş durumu güncellendi.');
            } else {
                showToast(data.error || 'Hata oluştu.', 'error');
            }
        } catch (err) {
            showToast('Sunucu hatası.', 'error');
        }
    };

    window.deleteOrder = async function (id) {
        if (!confirm('Bu siparişi silmek istediğinize emin misiniz?')) return;
        try {
            const res = await fetch(`/api/admin/orders/${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
                showToast(data.message);
                loadOrders();
            } else {
                showToast(data.error || 'Hata oluştu.', 'error');
            }
        } catch (err) {
            showToast('Sunucu hatası.', 'error');
        }
    };

    // ============================================
    // Initialize
    // ============================================
    checkAuth();
});
