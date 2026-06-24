const express = require('express');
const router = express.Router();
const pool = require('../db/connection');

// ============================================
// GET /api/products — Tüm aktif ürünleri getir
// ============================================
router.get('/products', async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT p.*, c.name AS category_name
             FROM products p
             LEFT JOIN categories c ON p.category_id = c.id
             WHERE p.is_active = TRUE
             ORDER BY p.sort_order ASC`
        );
        res.json(rows);
    } catch (err) {
        console.error('Products fetch error:', err);
        res.status(500).json({ error: 'Ürünler alınamadı.' });
    }
});

// ============================================
// GET /api/products/:id — Tek ürün detay
// ============================================
router.get('/products/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await pool.query(
            `SELECT p.*, c.name AS category_name
             FROM products p
             LEFT JOIN categories c ON p.category_id = c.id
             WHERE p.id = ?`,
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Ürün bulunamadı.' });
        }

        res.json(rows[0]);
    } catch (err) {
        console.error('Product fetch error:', err);
        res.status(500).json({ error: 'Ürün alınamadı.' });
    }
});

// ============================================
// GET /api/categories — Tüm kategorileri getir
// ============================================
router.get('/categories', async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT * FROM categories ORDER BY sort_order ASC'
        );
        res.json(rows);
    } catch (err) {
        console.error('Categories fetch error:', err);
        res.status(500).json({ error: 'Kategoriler alınamadı.' });
    }
});

// ============================================
// POST /api/orders — Yeni sipariş oluştur
// ============================================
router.post('/orders', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const { customer_name, customer_phone, notes, items } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({ error: 'Sipariş kalemleri boş olamaz.' });
        }

        // Calculate total
        let totalPrice = 0;
        items.forEach(item => {
            totalPrice += item.unit_price * item.quantity;
        });

        await connection.beginTransaction();

        // Insert order
        const [orderResult] = await connection.query(
            `INSERT INTO orders (customer_name, customer_phone, total_price, notes, status)
             VALUES (?, ?, ?, ?, 'pending')`,
            [customer_name || null, customer_phone || null, totalPrice, notes || null]
        );

        const orderId = orderResult.insertId;

        // Insert order items
        for (const item of items) {
            const removedJson = item.removed_ingredients && item.removed_ingredients.length > 0
                ? JSON.stringify(item.removed_ingredients)
                : null;

            await connection.query(
                `INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, removed_ingredients, note)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [orderId, item.product_id, item.product_name, item.quantity, item.unit_price, removedJson, item.note || null]
            );
        }

        await connection.commit();

        res.json({
            success: true,
            order_id: orderId,
            total_price: totalPrice,
            message: 'Sipariş başarıyla oluşturuldu.'
        });
    } catch (err) {
        await connection.rollback();
        console.error('Order create error:', err);
        res.status(500).json({ error: 'Sipariş oluşturulamadı.' });
    } finally {
        connection.release();
    }
});

module.exports = router;
