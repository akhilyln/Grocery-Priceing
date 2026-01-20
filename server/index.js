const express = require('express');
const cors = require('cors');
const db = require('./db');
const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// GET /api/prices - Get all products with history (Alias)
app.get('/api/prices', (req, res) => {
    try {
        const products = db.prepare('SELECT * FROM products ORDER BY item_name, brand_name').all();
        res.json(products);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/products - Original endpoint
app.get('/api/products', (req, res) => {
    try {
        const products = db.prepare('SELECT * FROM products ORDER BY item_name, brand_name').all();
        res.json(products);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/update - Update price indicator logic (Alias/Specific)
app.post('/api/update', (req, res) => {
    const { id, item_name, brand_name, price } = req.body;
    try {
        const stmt = db.prepare('UPDATE products SET item_name = ?, brand_name = ?, prev_price = CASE WHEN price != ? THEN price ELSE prev_price END, price = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
        const info = stmt.run(item_name, brand_name, price, price, id);
        if (info.changes === 0) return res.status(404).json({ error: 'Product not found' });
        const updated = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
        res.json(updated);
    } catch (error) {
        if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
            return res.status(409).json({ error: 'Item and Brand combination already exists' });
        }
        res.status(500).json({ error: error.message });
    }
});

// POST /api/products - Add new product
app.post('/api/products', (req, res) => {
    const { item_name, brand_name, price } = req.body;
    try {
        const stmt = db.prepare('INSERT INTO products (item_name, brand_name, price, prev_price) VALUES (?, ?, ?, ?)');
        const info = stmt.run(item_name, brand_name, price, price); // Set both same initially
        res.json({ id: info.lastInsertRowid, item_name, brand_name, price, prev_price: price });
    } catch (error) {
        if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
            return res.status(409).json({ error: 'Item and Brand combination already exists' });
        }
        res.status(500).json({ error: error.message });
    }
});

// PUT /api/products/:id - Update product (Standard)
app.put('/api/products/:id', (req, res) => {
    const { id } = req.params;
    const { item_name, brand_name, price } = req.body;
    try {
        const stmt = db.prepare('UPDATE products SET item_name = ?, brand_name = ?, prev_price = CASE WHEN price != ? THEN price ELSE prev_price END, price = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
        const info = stmt.run(item_name, brand_name, price, price, id);
        if (info.changes === 0) return res.status(404).json({ error: 'Product not found' });

        const updated = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
        res.json(updated);
    } catch (error) {
        if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
            return res.status(409).json({ error: 'Item and Brand combination already exists' });
        }
        res.status(500).json({ error: error.message });
    }
});

// DELETE /api/products/:id - Delete product
app.delete('/api/products/:id', (req, res) => {
    const { id } = req.params;
    try {
        const stmt = db.prepare('DELETE FROM products WHERE id = ?');
        const info = stmt.run(id);
        if (info.changes === 0) return res.status(404).json({ error: 'Product not found' });
        res.json({ message: 'Deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/products/bulk - Bulk update (Upsert)
app.post('/api/products/bulk', (req, res) => {
    const productsArray = req.body;
    if (!Array.isArray(productsArray)) return res.status(400).json({ error: 'Invalid input, expected array' });

    const upsert = db.prepare(`
    INSERT INTO products (item_name, brand_name, price, prev_price) 
    VALUES (@item_name, @brand_name, @price, @price)
    ON CONFLICT(item_name, brand_name) DO UPDATE SET
    prev_price = price,
    price = excluded.price,
    updated_at = CURRENT_TIMESTAMP
  `);

    const insertMany = db.transaction((list) => {
        for (const p of list) upsert.run(p);
    });

    try {
        insertMany(productsArray);
        res.json({ message: 'Bulk update successful' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Simple Login Check (Mock)
app.post('/api/login', (req, res) => {
    const { password } = req.body;
    // Hardcoded for simplicity as per requirements
    if (password === 'admin123') {
        res.json({ success: true, token: 'mock-token' });
    } else {
        res.status(401).json({ success: false, message: 'Invalid password' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
