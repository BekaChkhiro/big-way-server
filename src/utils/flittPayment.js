/**
 * Flitt Payment Integration Utility
 * Provides methods to interact with Flitt payment gateway
 * Based on the official Flitt API documentation: https://docs.flitt.com/api/create-order/
 */
require('dotenv').config();
const axios = require('axios');
const crypto = require('crypto');

// Configuration for Flitt API
const FLITT_CONFIG = {
  merchantId: process.env.FLITT_MERCHANT_ID || '1549901', // Use test merchant ID as fallback
  secretKey: process.env.FLITT_SECRET_KEY || 'test',      // Use test key as fallback
  apiUrl: 'https://pay.flitt.com/api/checkout/url'
};

// Log the configuration being used (without exposing the actual secret key)
console.log('Flitt configuration being used:', {
  merchantId: FLITT_CONFIG.merchantId,
  secretKeyProvided: !!FLITT_CONFIG.secretKey,
  usingTestCredentials: FLITT_CONFIG.merchantId === '1549901'
});

/**
 * Generate signature for Flitt API request
 * @param {Object} data - Request data
 * @returns {string} - Generated signature
 */
function generateSignature(data) {
  // Convert merchant ID to string to ensure consistent concatenation
  const merchantId = String(data.merchant_id);
  
  // Create signature string according to Flitt documentation
  // Order is important: merchant_id + order_id + amount + currency + secret_key
  const signatureString = merchantId + data.order_id + data.amount + data.currency + FLITT_CONFIG.secretKey;
  
  // Generate SHA-1 hash
  return crypto.createHash('sha1').update(signatureString).digest('hex');
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
    
    // Format amount - convert to lowest currency unit (tetri)
    const amountInTetri = Math.round(amount * 100).toString();
    
    // Prepare request data according to Flitt API requirements
    const requestParams = {
      order_id: orderId,
      order_desc: description,
      currency: 'GEL',
      amount: amountInTetri,
      merchant_id: parseInt(FLITT_CONFIG.merchantId, 10),
      response_url: redirectUrl,
      server_callback_url: redirectUrl // Also use as callback URL
    };
    
    // Generate signature for the request
    const signature = generateSignature(requestParams);
    requestParams.signature = signature;
    
    // Create the full request body as required by Flitt API
    const requestBody = {
      request: requestParams
    };
    
    console.log('Creating Flitt payment session with data:', {
      ...requestParams,
      signature: signature.substring(0, 6) + '...' // Only show part of the signature for security
    });
    
    // Make the API request to Flitt
    const response = await axios.post(FLITT_CONFIG.apiUrl, requestBody, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Flitt API response:', response.data);
    
    // Check if the response was successful
    if (response.data && 
        response.data.response && 
        response.data.response.response_status === 'success' && 
        response.data.response.checkout_url) {
      
      return {
        checkout_url: response.data.response.checkout_url,
        redirect_url: response.data.response.checkout_url
      };
    } else {
      // Handle error response
      const errorMessage = response.data?.response?.error_message || 'Unknown error';
      const errorCode = response.data?.response?.error_code || 'UNKNOWN';
      throw new Error(`Flitt payment error (${errorCode}): ${errorMessage}`);
    }
  } catch (error) {
    console.error('Error creating Flitt payment session:', error);
    console.error('Error creating Flitt payment stack:', error.stack);
    throw new Error(`Failed to create payment: ${error.message || JSON.stringify(error)}`);
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
    
    // Prepare request data according to Flitt API requirements for status check
    const requestParams = {
      transaction_id: transactionId,
      merchant_id: parseInt(FLITT_CONFIG.merchantId, 10)
    };
    
    // Generate signature for the request
    const signature = generateSignature({
      merchant_id: requestParams.merchant_id,
      order_id: 'status', // Special value for status check
      amount: '0',
      currency: 'GEL'
    });
    
    requestParams.signature = signature;
    
    // Create the full request body as required by Flitt API
    const requestBody = {
      request: requestParams
    };
    
    console.log('Verifying Flitt payment:', requestParams);
    
    // Make the API request to Flitt status endpoint
    const response = await axios.post('https://pay.flitt.com/api/status', requestBody, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Flitt payment verification result:', response.data);
    
    // Check if the response was successful
    if (response.data && response.data.response) {
      const paymentData = response.data.response;
      
      return {
        status: paymentData.order_status || paymentData.status || 'unknown',
        transaction_id: transactionId,
        order_id: paymentData.order_id,
        payment_id: paymentData.payment_id,
        amount: paymentData.amount,
        currency: paymentData.currency
      };
    } else {
      throw new Error('Invalid response from Flitt status API');
    }
  } catch (error) {
    console.error('Error verifying Flitt payment:', error);
    throw new Error(`Failed to verify payment: ${error.message || JSON.stringify(error)}`);
  }
}

module.exports = {
  createPaymentSession,
  verifyPayment
};
