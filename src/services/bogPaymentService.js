/**
 * Bank of Georgia Payment Integration Service
 */
const axios = require('axios');
const crypto = require('crypto');

// BOG API Configuration
const BOG_API_BASE_URL = 'https://ipay.ge/opay/api/v1';
const BOG_CLIENT_ID = process.env.BOG_CLIENT_ID || 'test_client_id'; // Set correct client_id in .env
const BOG_SECRET_KEY = process.env.BOG_SECRET_KEY || 'test_secret_key'; // Set correct secret_key in .env

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
    // Check if we have a valid token
    if (bogToken && tokenExpiry && tokenExpiry > Date.now()) {
      return bogToken;
    }

    const response = await axios({
      method: 'post',
      url: `${BOG_API_BASE_URL}/oauth2/token`,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': getBasicAuthHeader()
      }
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
    const { amount, description, shopOrderId, redirectUrl } = orderData;
    
    // Get auth token
    const token = await authenticate();
    
    // Format the payment request according to BOG API
    const paymentData = {
      intent: "CAPTURE",
      items: [
        {
          amount: amount.toString(),
          description: description || "Balance top-up",
          quantity: "1",
          product_id: shopOrderId
        }
      ],
      locale: "ka",
      shop_order_id: shopOrderId,
      redirect_url: redirectUrl,
      show_shop_order_id_on_extract: true,
      capture_method: "AUTOMATIC",
      purchase_units: [
        {
          amount: {
            currency_code: "GEL",
            value: amount.toString()
          }
        }
      ]
    };
    
    const response = await axios({
      method: 'post',
      url: `${BOG_API_BASE_URL}/checkout/orders`,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      data: paymentData
    });
    
    if (response.data && response.data.links) {
      // Find the approve link for redirect
      const approveLink = response.data.links.find(link => link.rel === 'approve');
      if (!approveLink) {
        throw new Error('No approval URL found in BOG response');
      }
      
      return {
        orderId: response.data.order_id,
        paymentHash: response.data.payment_hash,
        paymentUrl: approveLink.href,
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
      url: `${BOG_API_BASE_URL}/checkout/payment/${orderId}`,
      headers: {
        'Authorization': `Bearer ${token}`
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
 * @param {string} expectedHash Expected payment hash
 * @returns {boolean} Is valid callback
 */
function validateCallback(callbackData, expectedHash) {
  // Implement callback validation logic based on BOG documentation
  if (!callbackData || !callbackData.payment_hash || !expectedHash) {
    return false;
  }
  
  return callbackData.payment_hash === expectedHash;
}

module.exports = {
  authenticate,
  createOrder,
  getPaymentDetails,
  validateCallback
};
