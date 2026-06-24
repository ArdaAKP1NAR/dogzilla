const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const pool = require('../db/connection');
const { requireAuth } = require('../middleware/auth');

// ============================================
// Multer Configuration — Image Upload
// ============================================
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '..', 'public', 'uploads'));
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'product-' + uniqueSuffix + ext);
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Sadece JPEG, PNG, WebP ve GIF dosyaları yüklenebilir.'), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// ============================================
// POST /api/admin/login — Admin giriş
// ============================================
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const adminUser = process.env.ADMIN_USER || 'admin';
        const adminPass = process.env.ADMIN_PASS || 'admin123';

        if (username === adminUser && password === adminPass) {
            req.session.isAdmin = true;
            return res.json({ success: true, message: 'Giriş başarılı.' });
        }

        return res.status(401).json({ error: 'Kullanıcı adı veya şifre hatalı.' });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Sunucu hatası.' });
    }
});

// ============================================
// POST /api/admin/logout — Admin çıkış
// ============================================
router.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({ error: 'Çıkış yapılamadı.' });
        }
        res.json({ success: true, message: 'Çıkış yapıldı.' });
    });
});

// ============================================
// GET /api/admin/check — Oturum kontrolü
// ============================================
router.get('/check', (req, res) => {
    if (req.session && req.session.isAdmin) {
        return res.json({ authenticated: true });
    }
    return res.json({ authenticated: false });
});

// ============================================
// CATEGORY CRUD
// ============================================

// GET — Tüm kategoriler
router.get('/categories', requireAuth, async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM categories ORDER BY sort_order ASC');
        res.json(rows);
    } catch (err) {
        console.error('Categories fetch error:', err);
        res.status(500).json({ error: 'Kategoriler alınamadı.' });
    }
});

// POST — Yeni kategori ekle
router.post('/categories', requireAuth, async (req, res) => {
    try {
        const { name, sort_order } = req.body;
        const [result] = await pool.query(
            'INSERT INTO categories (name, sort_order) VALUES (?, ?)',
            [name, sort_order || 0]
        );
        res.json({ success: true, id: result.insertId, message: 'Kategori eklendi.' });
    } catch (err) {
        console.error('Category create error:', err);
        res.status(500).json({ error: 'Kategori eklenemedi.' });
    }
});

// PUT — Kategori güncelle
router.put('/categories/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, sort_order } = req.body;
        await pool.query(
            'UPDATE categories SET name=?, sort_order=? WHERE id=?',
            [name, sort_order || 0, id]
        );
        res.json({ success: true, message: 'Kategori güncellendi.' });
    } catch (err) {
        console.error('Category update error:', err);
        res.status(500).json({ error: 'Kategori güncellenemedi.' });
    }
});

// DELETE — Kategori sil
router.delete('/categories/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM categories WHERE id=?', [id]);
        res.json({ success: true, message: 'Kategori silindi.' });
    } catch (err) {
        console.error('Category delete error:', err);
        res.status(500).json({ error: 'Kategori silinemedi.' });
    }
});

// ============================================
// PRODUCT CRUD
// ============================================

// GET — Tüm ürünler (aktif + pasif)
router.get('/products', requireAuth, async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT p.*, c.name AS category_name
             FROM products p
             LEFT JOIN categories c ON p.category_id = c.id
             ORDER BY p.sort_order ASC`
        );
        res.json(rows);
    } catch (err) {
        console.error('Products fetch error:', err);
        res.status(500).json({ error: 'Ürünler alınamadı.' });
    }
});

// POST — Yeni ürün ekle
router.post('/products', requireAuth, async (req, res) => {
    try {
        const { name, description, price, image_url, badge, category_id, is_active, sort_order } = req.body;

        const [result] = await pool.query(
            `INSERT INTO products (name, description, price, image_url, badge, category_id, is_active, sort_order)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [name, description || '', price, image_url || null, badge || null, category_id || null, is_active !== false, sort_order || 0]
        );

        res.json({ success: true, id: result.insertId, message: 'Ürün eklendi.' });
    } catch (err) {
        console.error('Product create error:', err);
        res.status(500).json({ error: 'Ürün eklenemedi.' });
    }
});

// PUT — Ürün güncelle
router.put('/products/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, price, image_url, badge, category_id, is_active, sort_order } = req.body;

        await pool.query(
            `UPDATE products SET name=?, description=?, price=?, image_url=?, badge=?, category_id=?, is_active=?, sort_order=?
             WHERE id=?`,
            [name, description || '', price, image_url || null, badge || null, category_id || null, is_active !== false, sort_order || 0, id]
        );

        res.json({ success: true, message: 'Ürün güncellendi.' });
    } catch (err) {
        console.error('Product update error:', err);
        res.status(500).json({ error: 'Ürün güncellenemedi.' });
    }
});

// DELETE — Ürün sil
router.delete('/products/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM products WHERE id=?', [id]);
        res.json({ success: true, message: 'Ürün silindi.' });
    } catch (err) {
        console.error('Product delete error:', err);
        res.status(500).json({ error: 'Ürün silinemedi.' });
    }
});

// ============================================
// IMAGE UPLOAD
// ============================================
router.post('/upload', requireAuth, upload.single('image'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Dosya yüklenemedi.' });
        }

        const imageUrl = 'uploads/' + req.file.filename;
        res.json({
            success: true,
            image_url: imageUrl,
            message: 'Resim yüklendi.'
        });
    } catch (err) {
        console.error('Upload error:', err);
        res.status(500).json({ error: 'Resim yüklenemedi.' });
    }
});

// ============================================
// ORDER MANAGEMENT
// ============================================

// GET — Tüm siparişler
router.get('/orders', requireAuth, async (req, res) => {
    try {
        const [orders] = await pool.query(
            'SELECT * FROM orders ORDER BY created_at DESC'
        );

        // Fetch items for each order
        for (let order of orders) {
            const [items] = await pool.query(
                `SELECT oi.*, p.image_url
                 FROM order_items oi
                 LEFT JOIN products p ON oi.product_id = p.id
                 WHERE oi.order_id = ?`,
                [order.id]
            );
            order.items = items.map(item => ({
                ...item,
                removed_ingredients: typeof item.removed_ingredients === 'string'
                    ? JSON.parse(item.removed_ingredients)
                    : item.removed_ingredients
            }));
        }

        res.json(orders);
    } catch (err) {
        console.error('Orders fetch error:', err);
        res.status(500).json({ error: 'Siparişler alınamadı.' });
    }
});

// PUT — Sipariş durumu güncelle
router.put('/orders/:id/status', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Geçersiz sipariş durumu.' });
        }

        await pool.query(
            'UPDATE orders SET status=? WHERE id=?',
            [status, id]
        );

        res.json({ success: true, message: 'Sipariş durumu güncellendi.' });
    } catch (err) {
        console.error('Order status update error:', err);
        res.status(500).json({ error: 'Sipariş durumu güncellenemedi.' });
    }
});

// DELETE — Sipariş sil
router.delete('/orders/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM orders WHERE id=?', [id]);
        res.json({ success: true, message: 'Sipariş silindi.' });
    } catch (err) {
        console.error('Order delete error:', err);
        res.status(500).json({ error: 'Sipariş silinemedi.' });
    }
});

module.exports = router;
