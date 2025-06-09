/**
 * Flitt Payment Integration Utility
 * Provides methods to interact with Flitt payment gateway
 * This implementation uses direct API calls to accommodate Georgian Flitt requirements
 */
require('dotenv').config();
const axios = require('axios');
const crypto = require('crypto');

// Determine environment
const isProduction = process.env.NODE_ENV === 'production';

// Configuration for Flitt API
const FLITT_CONFIG = {
  // Use test merchant ID as fallback for development, use .env values for production
  merchantId: process.env.FLITT_MERCHANT_ID || '1549901',
  secretKey: process.env.FLITT_SECRET_KEY || 'test',
  // Flitt API endpoints
  apiUrl: process.env.FLITT_API_URL || 'https://pay.flitt.com/api'
};

// Log configuration at startup (omitting sensitive data)
console.log('Initializing Flitt payment with config:', {
  merchantId: FLITT_CONFIG.merchantId,
  environment: isProduction ? 'production' : 'development',
  apiUrl: FLITT_CONFIG.apiUrl
});

// Validate configuration
if (!FLITT_CONFIG.merchantId || !FLITT_CONFIG.secretKey) {
  console.error('WARNING: Flitt payment is not properly configured. Check environment variables.');
}

/**
 * Generate signature for Flitt API authentication
 * @param {Object} data - The request data to sign
 * @returns {string} - The calculated signature
 */
function generateSignature(data) {
  // Sort the data keys alphabetically
  const orderedData = {};
  Object.keys(data)
    .sort()
    .forEach((key) => {
      if (data[key] !== '' && data[key] !== null && data[key] !== undefined) {
        orderedData[key] = data[key];
      }
    });

  // Create a string of key=value pairs
  const signString = Object.entries(orderedData)
    .map(([key, value]) => `${key}=${value}`)
    .join('|');

  // Add the secret key and calculate the hash
  const signatureBase = `${signString}|${FLITT_CONFIG.secretKey}`;
  const signature = crypto
    .createHash('sha1')
    .update(signatureBase)
    .digest('hex');

  return signature;
}

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
    
    // Format request data according to Flitt requirements
    const requestData = {
      merchant_id: FLITT_CONFIG.merchantId,
      order_id: orderId,
      order_desc: description,
      currency: 'GEL',
      amount: Math.round(amount * 100).toString(), // Convert to lowest currency unit (tetri)
      response_url: redirectUrl,
      server_callback_url: redirectUrl // Optional: specify if different from response_url
    };
    
    // Generate signature
    const signature = generateSignature(requestData);
    requestData.signature = signature;
    
    console.log('Creating Flitt payment session with merchant ID:', FLITT_CONFIG.merchantId);
    console.log('Creating Flitt payment session data:', requestData);
    
    // Make direct API request
    const response = await axios.post(`${FLITT_CONFIG.apiUrl}/payments/init`, requestData);
    
    console.log('Flitt API response:', response.data);
    
    // Check if the response is successful
    if (response.data && response.data.success) {
      return {
        redirect_url: response.data.checkout_url || response.data.payment_url,
        checkout_url: response.data.checkout_url || response.data.payment_url,
        payment_id: response.data.payment_id
      };
    } else {
      const errorMessage = response.data.error_message || 'Unknown error from payment gateway';
      throw new Error(`Payment initialization failed: ${errorMessage}`);
    }
  } catch (error) {
    console.error('Error creating Flitt payment session:', error.message);
    if (error.response) {
      console.error('API error response:', error.response.data);
    }
    console.error('Error stack:', error.stack);
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
    
    // Generate signature
    const signature = generateSignature(requestData);
    requestData.signature = signature;
    
    console.log('Verifying Flitt payment:', requestData);
    
    // Make direct API request
    const response = await axios.post(`${FLITT_CONFIG.apiUrl}/payments/status`, requestData);
    
    console.log('Flitt payment verification result:', response.data);
    
    // Check if the response is successful
    if (response.data) {
      return {
        status: response.data.order_status || response.data.status,
        transaction_id: transactionId,
        order_id: response.data.order_id,
        payment_id: response.data.payment_id,
        amount: response.data.amount,
        currency: response.data.currency
      };
    } else {
      throw new Error('Invalid response from payment gateway');
    }
  } catch (error) {
    console.error('Error verifying Flitt payment:', error.message);
    if (error.response) {
      console.error('API error response:', error.response.data);
    }
    console.error('Error stack:', error.stack);
    throw new Error(`Failed to verify payment: ${error.message}`);
  }
}

module.exports = {
  createPaymentSession,
  verifyPayment
};
