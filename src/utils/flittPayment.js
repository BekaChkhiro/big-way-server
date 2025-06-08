/**
 * Flitt Payment Integration Utility
 * Provides methods to interact with Flitt payment gateway
 */
const axios = require('axios');
require('dotenv').config();

// Configuration for Flitt API
const FLITT_CONFIG = {
  merchantId: process.env.FLITT_MERCHANT_ID || '1549901', // Use test merchant ID as fallback
  secretKey: process.env.FLITT_SECRET_KEY || 'test',      // Use test key as fallback
  apiUrl: process.env.FLITT_API_URL || 'https://api.flitt.com/api'
};

/**
 * Creates a payment checkout session with Flitt
 * @param {Object} paymentData - Payment information
 * @param {string} paymentData.orderId - Unique order identifier
 * @param {string} paymentData.description - Description of the payment
 * @param {number} paymentData.amount - Amount in GEL (smallest currency unit)
 * @param {string} paymentData.redirectUrl - URL to redirect after payment
 * @returns {Promise<Object>} - Payment session data including checkout URL
 */
async function createPaymentSession(paymentData) {
  try {
    const { orderId, description, amount, redirectUrl } = paymentData;
    
    // Validate inputs
    if (!orderId || !description || !amount || amount <= 0) {
      throw new Error('Invalid payment data provided');
    }
    
    // Format request data according to Flitt API requirements
    const requestData = {
      merchant_id: FLITT_CONFIG.merchantId,
      order_id: orderId,
      order_desc: description,
      currency: 'GEL',
      amount: String(amount * 100), // Convert to lowest currency unit (tetri)
      redirect_url: redirectUrl
    };
    
    console.log('Creating Flitt payment session:', requestData);
    
    // Make API request to Flitt
    const response = await axios.post(`${FLITT_CONFIG.apiUrl}/checkout`, requestData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${FLITT_CONFIG.secretKey}`
      }
    });
    
    console.log('Flitt payment session created:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error creating Flitt payment session:', error.message);
    if (error.response) {
      console.error('Flitt API response:', error.response.data);
    }
    throw new Error(`Failed to create payment: ${error.message}`);
  }
}

/**
 * Verify a payment status with Flitt
 * @param {string} transactionId - Flitt transaction ID
 * @returns {Promise<Object>} - Payment verification result
 */
async function verifyPayment(transactionId) {
  try {
    if (!transactionId) {
      throw new Error('Transaction ID is required');
    }
    
    const requestData = {
      merchant_id: FLITT_CONFIG.merchantId,
      transaction_id: transactionId
    };
    
    console.log('Verifying Flitt payment:', requestData);
    
    // Make API request to Flitt
    const response = await axios.post(`${FLITT_CONFIG.apiUrl}/verify`, requestData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${FLITT_CONFIG.secretKey}`
      }
    });
    
    console.log('Flitt payment verification result:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error verifying Flitt payment:', error.message);
    if (error.response) {
      console.error('Flitt API response:', error.response.data);
    }
    throw new Error(`Failed to verify payment: ${error.message}`);
  }
}

module.exports = {
  createPaymentSession,
  verifyPayment
};
