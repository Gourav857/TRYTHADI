require('dotenv').config();
const express = require('express');
const { Pool } = require('pg'); // MySQL ki jagah ab hum 'pg' use kar rahe hain
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Yeh line tumhari HTML/CSS files ko load karne me madad karegi
app.use(express.static(__dirname)); 

// Render PostgreSQL Connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false // Render ke liye yeh zaroori hai
    }
});

// AUTO-CREATE TABLE: Yeh code check karega ki table hai ya nahi, aur nahi hogi toh khud bana dega!
const createTableQuery = `
    CREATE TABLE IF NOT EXISTS contacts (
        id SERIAL PRIMARY KEY,
        full_name VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        company VARCHAR(100),
        message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
`;

pool.query(createTableQuery)
    .then(() => console.log('Contacts table is ready!'))
    .catch(err => console.error('Error creating table:', err));

// POST Route for Form Submission
app.post('/api/contact', async (req, res) => {
    const { name, email, phone, company, message } = req.body;
    
    // PostgreSQL mein '?' ki jagah '$1, $2' use hota hai
    const sql = 'INSERT INTO contacts (full_name, email, phone, company, message) VALUES ($1, $2, $3, $4, $5)';
    const values = [name, email, phone, company, message];

    try {
        await pool.query(sql, values);
        res.status(200).json({ success: true, message: 'Form submitted successfully!' });
    } catch (err) {
        console.error('Failed to insert data:', err);
        res.status(500).json({ error: 'Database error' });
    }
});

// Start Server
const PORT = process.env.PORT || 3000;
// Data dekhne ke liye naya link
app.get('/api/leads', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM contacts ORDER BY created_at DESC');
        res.status(200).json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Database error' });
    }
});
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
