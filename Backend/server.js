const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mysql = require('mysql2/promise');
const Razorpay = require('razorpay');
require('dotenv').config();

const app = express();
const port = 5000;

app.use(bodyParser.json());
app.use(cors());

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const dbConfig = {
  host: '127.0.0.1',
  port: 3307,
  user: 'root',
  password: 'Kisan@2000',
  database: 'payment_db',
};

async function initializeDatabase() {
  const connection = await mysql.createConnection(dbConfig);
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS payments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      amount INT NOT NULL,
      razorpay_payment_id VARCHAR(255) NOT NULL
    )
  `);
  connection.end();
}

initializeDatabase();

app.post('/api/razorpay/order', async (req, res) => {
  const { amount } = req.body;

  const options = {
    amount: amount * 100,
    currency: 'INR',
    receipt: 'receipt_order_${Date.now()}',
  };

  console.log("I am here")
  try {
    const order = await razorpay.orders.create(options);
    console.log("order", order)
    res.json(order);
  } catch (error) {
    console.log("shit")
    res.status(500).json({ error: 'Failed to create order' });
  }
});


app.post('/api/payment', async (req, res) => {
  const { name, email, amount } = req.body;

  try {
    const options = {
      amount: amount * 100,
      currency: 'INR',
      receipt: 'receipt_order_${Date.now()}',
    };
    const order = await razorpay.orders.create(options);
    console.log("order", order);
    const razorpayPaymentId = order.id;
    console.log("razorpayPaymentId", razorpayPaymentId);
    const payment = await razorpay.payments.fetch(razorpayPaymentId);
    console.log("payment", payment);
    if (payment.status === 'captured') {
      console.log("payment.status", payment.status);
      const connection = await mysql.createConnection(dbConfig);
      await connection.execute(
        'INSERT INTO payments (name, email, amount, razorpay_payment_id) VALUES (?, ?, ?, ?)',
        [name, email, amount, razorpayPaymentId]
      );
      connection.end();

      res.status(200).json({ success: true });
    } else {
      console.log("abcdef");
      res.status(500).json({ error: 'Payment not captured' });
    }
  } catch (error) {
    console.error('Payment error:', error);
    res.status(500).json({ error: 'Payment failed', message: error.message });
  }
});


app.listen(port, () => {
  console.log(`Server running on ${port}`);
});

