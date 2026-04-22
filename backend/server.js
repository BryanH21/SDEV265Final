require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { pool, initDB } = require('./db');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Serve frontend files
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// GET all clients
app.get('/api/clients', async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT * FROM clients ORDER BY created_at DESC');
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch clients.' });
    }
});

// GET single client
app.get('/api/clients/:id', async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT * FROM clients WHERE id = ?', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ error: 'Client not found.' });
        res.json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch client.' });
    }
});

// POST create client
app.post('/api/clients', async (req, res) => {
    const { first_name, last_name, company, email, phone, renewal_date, contract_details, notes, additional_data } = req.body;
    if (!first_name || !last_name || !email) {
        return res.status(400).json({ error: 'first_name, last_name, and email are required.' });
    }
    const id = require('crypto').randomUUID();
    try {
        await pool.execute(
            `INSERT INTO clients (id, first_name, last_name, company, email, phone, renewal_date, contract_details, notes, additional_data)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [id, first_name, last_name, company || null, email, phone || null, renewal_date || null, contract_details || null, notes || null, additional_data || null]
        );
        const [rows] = await pool.execute('SELECT * FROM clients WHERE id = ?', [id]);
        res.status(201).json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create client.' });
    }
});

// PUT update client
app.put('/api/clients/:id', async (req, res) => {
    const { first_name, last_name, company, email, phone, renewal_date, contract_details, notes, additional_data } = req.body;
    if (!first_name || !last_name || !email) {
        return res.status(400).json({ error: 'first_name, last_name, and email are required.' });
    }
    try {
        const [result] = await pool.execute(
            `UPDATE clients SET
        first_name = ?, last_name = ?, company = ?, email = ?, phone = ?,
        renewal_date = ?, contract_details = ?, notes = ?, additional_data = ?
       WHERE id = ?`,
            [first_name, last_name, company || null, email, phone || null, renewal_date || null, contract_details || null, notes || null, additional_data || null, req.params.id]
        );
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Client not found.' });
        const [rows] = await pool.execute('SELECT * FROM clients WHERE id = ?', [req.params.id]);
        res.json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update client.' });
    }
});

// DELETE client
app.delete('/api/clients/:id', async (req, res) => {
    try {
        const [result] = await pool.execute('DELETE FROM clients WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Client not found.' });
        res.json({ message: 'Client deleted.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete client.' });
    }
});

// Fallback: serve index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

// Start server
initDB().then(() => {
    app.listen(PORT, () => {
        console.log(`CMS server running at http://localhost:${PORT}`);
    });
}).catch(err => {
    console.error('Could not connect to database:', err.message);
    process.exit(1);
});