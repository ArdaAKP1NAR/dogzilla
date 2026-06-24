require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// Ensure uploads directory exists
// ============================================
const uploadsDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// ============================================
// Middleware
// ============================================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'dogzilla_default_secret_change_me',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // true for HTTPS in production
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// ============================================
// Routes
// ============================================
const apiRoutes = require('./routes/api');
const adminRoutes = require('./routes/admin');

app.use('/api', apiRoutes);
app.use('/api/admin', adminRoutes);

// Admin panel page
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin', 'index.html'));
});

// SPA fallback — serve index.html for unmatched routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ============================================
// Start Server
// ============================================
app.listen(PORT, () => {
    console.log(`\n🌭 DOGZILLA Server`);
    console.log(`   Ana Sayfa   → http://localhost:${PORT}`);
    console.log(`   Admin Panel → http://localhost:${PORT}/admin`);
    console.log(`   API         → http://localhost:${PORT}/api/products`);
    console.log(`                  http://localhost:${PORT}/api/categories\n`);
});
