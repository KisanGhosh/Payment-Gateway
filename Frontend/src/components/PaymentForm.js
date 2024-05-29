import React, { useState } from 'react'
import { useDispatch } from 'react-redux';
import { submitPayment } from '../features/payment/paymentSlice';
import '../App.css';
import axios from 'axios';


const PaymentForm = () => {

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);


  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  function isNumber(value) {
    return !isNaN(value) && !isNaN(parseFloat(value));
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (name === "" || email === "" || amount === "") {
      alert("Fill up all the fields")
    } else if (!isValidEmail(email)) {
      alert("Use a valid Email", "warning");
    } else if (!isNumber(amount)) {
      alert("Use a valid Amount", "warning");
    } else {
      setLoading(true);
      try {
        // Step 1: Create an order
        const orderResponse = await axios.post('http://localhost:5000/api/razorpay/order', { amount });
        const order = orderResponse.data;

        // Step 2: Open Razorpay payment gateway
        const options = {
          key: process.env.RAZORPAY_KEY_ID,
          amount: order.amount,
          currency: order.currency,
          name: 'Your Company',
          description: 'Test Transaction',
          order_id: order.id,
          handler: async (response) => {
            // Step 3: Capture the payment
            const paymentData = {
              name,
              email,
              amount,
              razorpayPaymentId: response.razorpay_payment_id,
            };

            try {
              const paymentResponse = await axios.post('http://localhost:5000/api/payment', paymentData);
              if (paymentResponse.data.success) {
                alert('Payment successful');
              } else {
                alert('Payment failed');
              }
            } catch (error) {
              console.error('Payment capture failed', error);
              alert('Payment capture failed');
            }
            setLoading(false);
          },
          prefill: {
            name,
            email,
          },
        };
        const rzp = new window.Razorpay(options);
        rzp.open();
      } catch (error) {
        console.error('Order creation failed', error);
        alert('Order creation failed');
        setLoading(false);
      }
    }
  };


  return (
    <div id="wrapper">
      <div className="container">
        <div className="both-side">

          <div className="left-side">
            <h1 id="left-side-heading">
              Welcome to
              <br />
              the
              <br />
              Payment
              <br />
              Page
            </h1>
            <p id="left-side-para">" Secure and simple: Your payment,Our priority "</p>
          </div>


          <div className="right-side">
            <form onSubmit={handleSubmit}>
              <h1>Let's pay!</h1>
              <p>Complete your payment...</p>
              <div className="content">
                <div className="form-content">
                  <label>Name:</label>
                  <input
                    type="text"
                    name="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="form-content">
                  <label>Email:</label>
                  <input
                    type="email"
                    name="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="form-content">
                  <label>Price:</label>
                  <input
                    type="text"
                    name="amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" disabled={loading} className={loading ? 'loading' : ''} >
                  {loading ? 'Processing...' : 'Pay Now'}
                </button>
              </div>
            </form>
          </div>

        </div>

        <div className="qr-code">
          <img src="images/qr.jpg" height="300px" alt="qr" className="qr" />
        </div>
      </div>
    </div>
  )
}

export default PaymentForm
