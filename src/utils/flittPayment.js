/**
 * Flitt Payment Integration Utility
 * Provides methods to interact with Flitt payment gateway
 */
require('dotenv').config();
const CloudIpsp = require('cloudipsp-node-js-sdk');

// Configuration for Flitt API
const FLITT_CONFIG = {
  merchantId: process.env.FLITT_MERCHANT_ID || '1549901', // Use test merchant ID as fallback
  secretKey: process.env.FLITT_SECRET_KEY || 'test'      // Use test key as fallback
};

// Initialize the Flitt checkout instance
const checkout = new CloudIpsp({
  merchantId: FLITT_CONFIG.merchantId,
  secretKey: FLITT_CONFIG.secretKey
});

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
    
    // Format request data according to Flitt SDK requirements
    const requestData = {
      order_id: orderId,
      order_desc: description,
      currency: 'GEL',
      amount: String(amount * 100), // Convert to lowest currency unit (tetri)
      response_url: redirectUrl
    };
    
    console.log('Creating Flitt payment session with merchant ID:', FLITT_CONFIG.merchantId);
    console.log('Creating Flitt payment session:', requestData);
    
    // Log configuration
    console.log('Flitt configuration:', {
      merchantId: FLITT_CONFIG.merchantId,
      secretKey: FLITT_CONFIG.secretKey ? '******' : 'not set',
      testMode: FLITT_CONFIG.merchantId === '1549901' // Check if using test credentials
    });
    
    // Use Flitt SDK to create checkout
    let response;
    try {
      response = await checkout.Checkout(requestData);
      console.log('Flitt payment session created:', response);
    } catch (sdkError) {
      console.error('Flitt SDK error details:', {
        message: sdkError.message,
        stack: sdkError.stack,
        response: sdkError.response ? JSON.stringify(sdkError.response.data) : 'No response data'
      });
      throw sdkError;
    }
    
    return {
      redirect_url: response.checkout_url,
      checkout_url: response.checkout_url
    };
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
    
    const requestData = {
      transaction_id: transactionId
    };
    
    console.log('Verifying Flitt payment:', requestData);
    
    // Use Flitt SDK to verify the payment
    const response = await checkout.Status(requestData);
    
    console.log('Flitt payment verification result:', response);
    return {
      status: response.order_status || response.status,
      transaction_id: transactionId,
      order_id: response.order_id,
      payment_id: response.payment_id,
      amount: response.amount,
      currency: response.currency
    };
  } catch (error) {
    console.error('Error verifying Flitt payment:', error);
    throw new Error(`Failed to verify payment: ${error.message || JSON.stringify(error)}`);
  }
}

module.exports = {
  createPaymentSession,
  verifyPayment
};
