/**
 * Bank of Georgia Payment Integration Service
 */
const axios = require('axios');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

// BOG API Configuration
const BOG_API_BASE_URL = 'https://api.bog.ge/payments/v1';
const BOG_ECOMMERCE_URL = 'https://api.bog.ge/payments/v1/ecommerce';
// Using real credentials
const BOG_CLIENT_ID = process.env.BOG_CLIENT_ID || '10001626'; // Real merchant ID
const BOG_SECRET_KEY = process.env.BOG_SECRET_KEY || 'rc7zrDXcrsXU'; // Real secret key

// Token storage
let bogToken = null;
let tokenExpiry = null;

/**
 * Get Basic auth header for BOG API
 * @returns {string} Basic auth header
 */
function getBasicAuthHeader() {
  const credentials = `${BOG_CLIENT_ID}:${BOG_SECRET_KEY}`;
  return `Basic ${Buffer.from(credentials).toString('base64')}`;
}

/**
 * Authenticate with BOG API and get access token
 * @returns {Promise<string>} Access token
 */
async function authenticate() {
  try {
    console.log('BOG API authenticate - Starting authentication');
    console.log(`BOG API Base URL: ${BOG_API_BASE_URL}`);
    console.log(`BOG Client ID available: ${!!BOG_CLIENT_ID}`);
    console.log(`BOG Secret Key available: ${!!BOG_SECRET_KEY}`);
    
    // Check if we have a valid token
    if (bogToken && tokenExpiry && tokenExpiry > Date.now()) {
      console.log('BOG API authenticate - Using cached token');
      return bogToken;
    }

    console.log('BOG API authenticate - Requesting new token');
    const response = await axios({
      method: 'post',
      url: `${BOG_API_BASE_URL}/oauth/token`,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': getBasicAuthHeader()
      },
      data: 'grant_type=client_credentials'
    });

    if (response.data && response.data.access_token) {
      bogToken = response.data.access_token;
      // Set token expiry (typically 1 hour but we use a buffer)
      tokenExpiry = Date.now() + (response.data.expires_in * 1000 - 5 * 60 * 1000);
      return bogToken;
    } else {
      throw new Error('Failed to get BOG access token');
    }
  } catch (error) {
    console.error('BOG Authentication Error:', error.response ? error.response.data : error.message);
    throw new Error('BOG Authentication failed');
  }
}

/**
 * Create payment order in BOG system
 * @param {Object} orderData Order data
 * @param {number} amount Amount to pay
 * @param {string} description Payment description
 * @param {string} shopOrderId Shop order ID (transaction ID)
 * @param {string} redirectUrl URL to redirect after payment
 * @returns {Promise<Object>} Payment order details with redirect URL
 */
async function createOrder(orderData) {
  try {
    console.log('BOG API createOrder - Starting with data:', JSON.stringify(orderData));
    const { amount, description, shopOrderId, redirectUrl } = orderData;
    
    // Get auth token
    console.log('BOG API createOrder - Getting auth token');
    const token = await authenticate();
    console.log('BOG API createOrder - Token received');
    
    // Format the payment request according to BOG API
    console.log('BOG API createOrder - Formatting payment request');
    // Adapt old parameters to new API format
    const paymentData = {
      callback_url: "https://autovend.ge/api/balance/bog-callback", // Hardcoded callback URL
      external_order_id: shopOrderId,
      purchase_units: {
        currency: "GEL",
        total_amount: parseFloat(amount),
        basket: [
          {
            quantity: 1,
            unit_price: parseFloat(amount),
            product_id: shopOrderId,
            description: description || "Balance top-up"
          }
        ]
      },
      redirect_urls: {
        success: redirectUrl,
        fail: redirectUrl.replace('status=success', 'status=failed')
      },
      ttl: 30 // 30 minutes expiry
    };
    
    console.log('BOG API createOrder - Sending request to BOG API');
    console.log(`BOG API URL: ${BOG_API_BASE_URL}/ecommerce/orders`);
    console.log('BOG API Request Payload:', JSON.stringify(paymentData, null, 2));
    
    const idempotencyKey = uuidv4();
    
    const response = await axios({
      method: 'post',
      url: `${BOG_ECOMMERCE_URL}/orders`,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Idempotency-Key': idempotencyKey,
        'Accept-Language': 'ka',
        'Theme': 'light'
      },
      data: paymentData
    });
    
    console.log('BOG API createOrder - Response received');
    console.log('BOG API Response Status:', response.status);
    console.log('BOG API Response Data:', JSON.stringify(response.data, null, 2));
    
    if (response.data && response.data._links) {
      // Extract the payment URL from _links
      console.log('BOG API _links:', JSON.stringify(response.data._links, null, 2));
      
      // The _links parameter should contain the redirect URL
      const paymentUrl = response.data._links;
      
      return {
        orderId: response.data.order_id,
        paymentHash: shopOrderId, // For backward compatibility
        paymentUrl: paymentUrl,
        status: response.data.status
      };
    } else {
      throw new Error('Invalid response from BOG payment API');
    }
  } catch (error) {
    console.error('BOG Create Order Error:', error.response ? error.response.data : error.message);
    throw new Error('Failed to create BOG payment order');
  }
}

/**
 * Get payment details from BOG
 * @param {string} orderId BOG order ID
 * @returns {Promise<Object>} Payment details
 */
async function getPaymentDetails(orderId) {
  try {
    const token = await authenticate();
    
    const response = await axios({
      method: 'get',
      url: `${BOG_ECOMMERCE_URL}/orders/${orderId}`,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept-Language': 'ka'
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('BOG Get Payment Details Error:', error.response ? error.response.data : error.message);
    throw new Error('Failed to get BOG payment details');
  }
}

/**
 * Validate BOG callback data
 * @param {Object} callbackData Callback data from BOG
 * @param {string} externalOrderId Expected external order ID
 * @returns {boolean} Is valid callback
 */
function validateCallback(callbackData, externalOrderId) {
  // Implement callback validation logic based on BOG documentation
  if (!callbackData || !callbackData.external_order_id || !externalOrderId) {
    return false;
  }
  
  return callbackData.external_order_id === externalOrderId;
}

/**
 * Generate a UUID v4 for Idempotency-Key
 * @returns {string} UUID v4
 */
function generateIdempotencyKey() {
  return uuidv4();
}

module.exports = {
  authenticate,
  createOrder,
  getPaymentDetails,
  validateCallback,
  generateIdempotencyKey
};
