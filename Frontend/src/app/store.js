import { configureStore } from '@reduxjs/toolkit';
import paymentReducer from '../features/payment/paymentSlice';

const store = configureStore({
  reducer: {
    payment: paymentReducer,
  },
});

export default store;