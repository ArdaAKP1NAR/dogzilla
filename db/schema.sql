-- ============================================
-- DOGZILLA — Database Schema & Seed Data
-- ============================================

CREATE DATABASE IF NOT EXISTS ardaarza_dogzilla
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE ardaarza_dogzilla;

-- ============================================
-- Categories Table
-- ============================================
CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Products Table
-- ============================================
CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    image_url VARCHAR(255) DEFAULT NULL,
    badge VARCHAR(50) DEFAULT NULL COMMENT 'e.g. ACILI, VEGAN, YENİ',
    category_id INT DEFAULT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Orders Table
-- ============================================
CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_name VARCHAR(100) DEFAULT NULL,
    customer_phone VARCHAR(20) DEFAULT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    status ENUM('pending','confirmed','preparing','ready','delivered','cancelled') DEFAULT 'pending',
    notes TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Order Items Table
-- ============================================
CREATE TABLE IF NOT EXISTS order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    product_name VARCHAR(100) NOT NULL COMMENT 'Snapshot at order time',
    quantity INT DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    removed_ingredients JSON DEFAULT NULL,
    note TEXT DEFAULT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Site Settings Table
-- ============================================
CREATE TABLE IF NOT EXISTS site_settings (
    setting_key VARCHAR(50) PRIMARY KEY,
    setting_value TEXT NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Seed Data — Categories
-- ============================================
INSERT INTO categories (name, sort_order) VALUES
('Hot Dogs', 1),
('İçecekler', 2),
('Yan Ürünler', 3);

-- ============================================
-- Seed Data — Products
-- ============================================
INSERT INTO products (name, description, price, image_url, badge, category_id, is_active, sort_order) VALUES
('HOTZILLA', 'Jalapeño sosu, hayalet biber sosu, çıtır soğan.', 250.00, 'images/502403211_17843818911518208_1151664137941882884_n.webp', 'ACILI', 1, TRUE, 1),
('BBQ KONG', 'Tütsülenmiş döş, burbon barbekü sosu, lahana salatası.', 280.00, 'images/506344686_17843714214518208_5840138339913417182_n.webp', NULL, 1, TRUE, 2),
('THE KAIJU', 'Wasabi mayonez, zencefil turşusu, nori şeritleri, teriyaki.', 260.00, 'images/511686867_17843825880518208_4398335957288087136_n.webp', NULL, 1, TRUE, 3),
('ATOMIC DOG', 'Mac & cheese kaplı, pastırma kırıntıları, acı bal.', 240.00, NULL, NULL, 1, TRUE, 4),
('MECHA-CHEESE', 'Üç peynirli karışım, sarımsaklı mayonez, parmesan cipsi.', 220.00, NULL, NULL, 1, TRUE, 5),
('SWAMP THING', 'Bitki bazlı sosis, guacamole, pico de gallo.', 270.00, NULL, 'VEGAN', 1, TRUE, 6);

-- ============================================
-- Seed Data — Site Settings
-- ============================================
INSERT INTO site_settings (setting_key, setting_value) VALUES
('whatsapp_phone', '905380562640'),
('hero_title', 'LEZZETİ SERBEST BIRAK'),
('hero_subtitle', 'Canavar İştahlar İçin Premium Gurme Sosisliler.'),
('site_name', 'DOGZILLA');
