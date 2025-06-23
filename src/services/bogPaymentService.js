/**
 * Bank of Georgia Payment Integration Service
 * Updated according to BOG API v1 documentation (June 2025)
 */
const axios = require('axios');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

// BOG API Configuration - Updated URLs according to BOG API v1 documentation
const BOG_AUTH_URL = 'https://oauth2.bog.ge/auth/realms/bog/protocol/openid-connect/token';
const BOG_API_BASE_URL = 'https://api.bog.ge/payments/v1';
const BOG_ECOMMERCE_URL = 'https://api.bog.ge/payments/v1/ecommerce';
const BOG_RECEIPT_URL = 'https://api.bog.ge/payments/v1/receipt';

// Using credentials from environment variables
const BOG_CLIENT_ID = process.env.BOG_CLIENT_ID || '10001626';
const BOG_SECRET_KEY = process.env.BOG_SECRET_KEY || 'rc7zrDXcrsXU';

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
    console.log(`BOG Auth URL: ${BOG_AUTH_URL}`);
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
      url: BOG_AUTH_URL,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': getBasicAuthHeader()
      },
      data: 'grant_type=client_credentials'
    });

    if (response.data && response.data.access_token) {
      console.log('BOG API authenticate - Successfully authenticated');
      bogToken = response.data.access_token;
      // Set token expiry with 5 minute buffer
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
 * @param {number} orderData.amount Amount to pay
 * @param {string} orderData.description Payment description
 * @param {string} orderData.shopOrderId Shop order ID (transaction ID)
 * @param {string} orderData.redirectUrl URL to redirect after payment
 * @param {string} [orderData.callbackUrl] Callback URL for payment notifications
 * @param {number} [orderData.ttl=30] Order time to live in minutes
 * @param {string} [orderData.currency='GEL'] Payment currency
 * @param {Array} [orderData.paymentMethods] Allowed payment methods
 * @param {Object} [orderData.buyer] Buyer information
 * @returns {Promise<Object>} Payment order details with redirect URL
 */
async function createOrder(orderData) {
  try {
    console.log('BOG API createOrder - Starting with data:', JSON.stringify(orderData));
    const { 
      amount, 
      description, 
      shopOrderId, 
      redirectUrl,
      callbackUrl = "https://autovend.ge/api/balance/bog-callback",
      ttl = 30,
      currency = "GEL",
      paymentMethods = null,
      buyer = null
    } = orderData;
    
    // Get auth token
    console.log('BOG API createOrder - Getting auth token');
    const token = await authenticate();
    console.log('BOG API createOrder - Token received');
    
    // Format the payment request according to BOG API documentation
    console.log('BOG API createOrder - Formatting payment request');
    const paymentData = {
      callback_url: callbackUrl,
      external_order_id: shopOrderId,
      capture: "automatic", // or "manual" for pre-authorization
      purchase_units: {
        currency: currency,
        total_amount: parseFloat(amount),
        basket: [
          {
            quantity: 1,
            unit_price: parseFloat(amount),
            product_id: `balance-topup-${shopOrderId}`,
            description: description || 'Balance Top-up'
          }
        ]
      },
      redirect_urls: {
        success: redirectUrl,
        fail: redirectUrl.replace('status=success', 'status=failed')
      },
      ttl: ttl // Order expiry time in minutes
    };

    // Add payment methods if specified
    if (paymentMethods && Array.isArray(paymentMethods)) {
      paymentData.payment_method = paymentMethods;
    }
    
    // Add buyer information if provided
    if (buyer) {
      paymentData.buyer = buyer;
    }
    
    console.log('BOG API createOrder - Sending request to BOG API');
    console.log(`BOG API URL: ${BOG_ECOMMERCE_URL}/orders`);
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
      
      return {
        orderId: response.data.order_id,
        paymentHash: shopOrderId, // For backward compatibility
        paymentUrl: response.data._links,
        status: response.data.status,
        expiryDate: response.data.zoned_expire_date
      };
    } else {
      throw new Error('Invalid response from BOG payment API');
    }
  } catch (error) {
    console.error('BOG Create Order Error:', error.response ? error.response.data : error.message);
    if (error.response && error.response.data) {
      throw new Error(`BOG API Error: ${JSON.stringify(error.response.data)}`);
    }
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
    console.log(`BOG API getPaymentDetails - Getting details for order: ${orderId}`);
    const token = await authenticate();
    
    const response = await axios({
      method: 'get',
      url: `${BOG_RECEIPT_URL}/${orderId}`,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept-Language': 'ka'
      }
    });
    
    console.log('BOG API getPaymentDetails - Response received');
    console.log('Payment Details:', JSON.stringify(response.data, null, 2));
    
    return response.data;
  } catch (error) {
    console.error('BOG Get Payment Details Error:', error.response ? error.response.data : error.message);
    throw new Error('Failed to get BOG payment details');
  }
}

/**
 * Validate BOG callback signature using RSA SHA256
 * @param {string} requestBody Raw request body
 * @param {string} signature Callback signature from header
 * @returns {boolean} Is valid signature
 */
function validateCallbackSignature(requestBody, signature) {
  try {
    const publicKey = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAu4RUyAw3+CdkS3ZNILQh
zHI9Hemo+vKB9U2BSabppkKjzjjkf+0Sm76hSMiu/HFtYhqWOESryoCDJoqffY0Q
1VNt25aTxbj068QNUtnxQ7KQVLA+pG0smf+EBWlS1vBEAFbIas9d8c9b9sSEkTrr
TYQ90WIM8bGB6S/KLVoT1a7SnzabjoLc5Qf/SLDG5fu8dH8zckyeYKdRKSBJKvhx
tcBuHV4f7qsynQT+f2UYbESX/TLHwT5qFWZDHZ0YUOUIvb8n7JujVSGZO9/+ll/g
4ZIWhC1MlJgPObDwRkRd8NFOopgxMcMsDIZIoLbWKhHVq67hdbwpAq9K9WMmEhPn
PwIDAQAB
-----END PUBLIC KEY-----`;

    const verifier = crypto.createVerify('RSA-SHA256');
    verifier.update(requestBody);
    return verifier.verify(publicKey, signature, 'base64');
  } catch (error) {
    console.error('Signature validation error:', error);
    return false;
  }
}

/**
 * Validate BOG callback data
 * @param {Object} callbackData Callback data from BOG
 * @param {string} signature Callback signature from header
 * @param {string} rawBody Raw request body for signature validation
 * @param {string} [expectedOrderId] Expected external order ID
 * @returns {Object} Validation result with status and details
 */
function validateCallback(callbackData, signature, rawBody, expectedOrderId = null) {
  console.log('BOG Callback validation - Starting validation');
  console.log('Callback data:', JSON.stringify(callbackData));
  
  const validation = {
    isValid: false,
    signatureValid: false,
    dataValid: false,
    orderMatches: false,
    errors: []
  };

  // Validate signature if provided
  if (signature && rawBody) {
    validation.signatureValid = validateCallbackSignature(rawBody, signature);
    if (!validation.signatureValid) {
      validation.errors.push('Invalid callback signature');
    }
  }

  // Validate callback data structure
  if (!callbackData || !callbackData.event || !callbackData.body) {
    validation.errors.push('Invalid callback data structure');
  } else if (callbackData.event !== 'order_payment') {
    validation.errors.push('Invalid callback event type');
  } else {
    validation.dataValid = true;
  }

  // Validate order ID if provided
  if (expectedOrderId && callbackData.body && callbackData.body.external_order_id) {
    validation.orderMatches = callbackData.body.external_order_id === expectedOrderId;
    if (!validation.orderMatches) {
      validation.errors.push('Order ID mismatch');
    }
  } else if (expectedOrderId) {
    validation.errors.push('Missing external_order_id in callback');
  } else {
    validation.orderMatches = true; // No specific order to match
  }

  validation.isValid = validation.dataValid && 
                      (signature ? validation.signatureValid : true) && 
                      validation.orderMatches;

  console.log('BOG Callback validation result:', validation);
  return validation;
}

/**
 * Parse BOG callback and extract payment status
 * @param {Object} callbackData Callback data from BOG
 * @returns {Object} Parsed payment information
 */
function parseCallback(callbackData) {
  if (!callbackData || !callbackData.body) {
    throw new Error('Invalid callback data');
  }

  const orderData = callbackData.body;
  
  return {
    orderId: orderData.order_id,
    externalOrderId: orderData.external_order_id,
    status: orderData.order_status ? orderData.order_status.key : 'unknown',
    statusDescription: orderData.order_status ? orderData.order_status.value : 'Unknown status',
    amount: orderData.purchase_units ? orderData.purchase_units.transfer_amount : null,
    currency: orderData.purchase_units ? orderData.purchase_units.currency_code : null,
    paymentMethod: orderData.payment_detail ? orderData.payment_detail.transfer_method.key : null,
    transactionId: orderData.payment_detail ? orderData.payment_detail.transaction_id : null,
    payerIdentifier: orderData.payment_detail ? orderData.payment_detail.payer_identifier : null,
    rejectReason: orderData.reject_reason,
    timestamp: callbackData.zoned_request_time
  };
}

/**
 * Generate a UUID v4 for Idempotency-Key
 * @returns {string} UUID v4
 */
function generateIdempotencyKey() {
  return uuidv4();
}

/**
 * Check if payment is successful based on status
 * @param {string} status Payment status
 * @returns {boolean} Is payment successful
 */
function isPaymentSuccessful(status) {
  return status === 'completed' || status === 'partial_completed';
}

/**
 * Check if payment failed
 * @param {string} status Payment status
 * @returns {boolean} Is payment failed
 */
function isPaymentFailed(status) {
  return status === 'rejected';
}

/**
 * Check if payment is pending
 * @param {string} status Payment status
 * @returns {boolean} Is payment pending
 */
function isPaymentPending(status) {
  return status === 'created' || status === 'processing' || status === 'blocked';
}

module.exports = {
  authenticate,
  createOrder,
  getPaymentDetails,
  validateCallback,
  validateCallbackSignature,
  parseCallback,
  generateIdempotencyKey,
  isPaymentSuccessful,
  isPaymentFailed,
  isPaymentPending,
  
  // Constants for payment methods
  PAYMENT_METHODS: {
    CARD: 'card',
    GOOGLE_PAY: 'google_pay',
    APPLE_PAY: 'apple_pay',
    BOG_P2P: 'bog_p2p',
    BOG_LOYALTY: 'bog_loyalty',
    BNPL: 'bnpl',
    BOG_LOAN: 'bog_loan',
    GIFT_CARD: 'gift_card'
  },
  
  // Constants for payment statuses
  PAYMENT_STATUS: {
    CREATED: 'created',
    PROCESSING: 'processing',
    COMPLETED: 'completed',
    REJECTED: 'rejected',
    REFUND_REQUESTED: 'refund_requested',
    REFUNDED: 'refunded',
    REFUNDED_PARTIALLY: 'refunded_partially',
    AUTH_REQUESTED: 'auth_requested',
    BLOCKED: 'blocked',
    PARTIAL_COMPLETED: 'partial_completed'
  }
};