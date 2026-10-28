const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const path = require('path');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json({ limit: '10mb' })); // Image base64 ke liye limit barha di hai
app.use(express.static(path.join(__dirname)));

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'haroon_zarai_db'
});

db.connect((err) => {
  if (err) {
    console.error('Database connection failed: ' + err.stack);
    return;
  }
  console.log('Connected to MySQL Database successfully!');
});

// ================= PRODUCTS APIS =================
app.get('/api/products', (req, res) => {
  db.query('SELECT * FROM products', (err, results) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.status(200).json({ data: results });
  });
});

app.post('/api/products', (req, res) => {
  const { name, category, price, stock_quantity, image } = req.body;
  const query = 'INSERT INTO products (name, category, price, stock_quantity, image) VALUES (?, ?, ?, ?, ?)';
  db.query(query, [name, category, price, stock_quantity, image || ''], (err, result) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.status(201).json({ message: 'Product added successfully!', productId: result.insertId });
  });
});

app.delete('/api/products/:id', (req, res) => {
  db.query('DELETE FROM products WHERE id = ?', [req.params.id], (err, result) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.status(200).json({ message: 'Product deleted successfully!' });
  });
});

// ================= CUSTOMERS APIS =================
app.get('/api/customers', (req, res) => {
  db.query('SELECT * FROM customers', (err, results) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.status(200).json({ data: results });
  });
});

app.post('/api/customers', (req, res) => {
  const { name, phone, address, pin } = req.body;
  db.query('INSERT INTO customers (name, phone, address, pin) VALUES (?, ?, ?, ?)', [name, phone, address, pin || '1234'], (err, result) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.status(201).json({ message: 'Customer added successfully!', customerId: result.insertId });
  });
});

// ================= TRANSACTIONS APIS =================
app.get('/api/transactions', (req, res) => {
  const query = `
    SELECT transactions.id, transactions.customer_id AS fid, customers.name AS customer_name, 
           transactions.total_amount AS amount, transactions.type, transactions.description AS description, transactions.created_at AS date 
    FROM transactions 
    JOIN customers ON transactions.customer_id = customers.id
  `;
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.status(200).json({ data: results });
  });
});

app.post('/api/transactions', (req, res) => {
  const { customer_id, type, description, amount } = req.body;
  const query = 'INSERT INTO transactions (customer_id, type, description, total_amount) VALUES (?, ?, ?, ?)';
  db.query(query, [customer_id, type || 'udhar', description, amount], (err, result) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.status(201).json({ message: 'Transaction recorded successfully!' });
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});