const { pg: pool } = require('../../config/db.config');
const { createPaymentSession, verifyPayment } = require('../utils/flittPayment');
const bogPaymentService = require('../services/bogPaymentService');
const crypto = require('crypto');

// Constants for VIP pricing
const VIP_STATUS_PRICES = {
  bronze: 50,
  silver: 100,
  gold: 200,
  platinum: 500
};

// Get base URL from environment variable or use a default for development
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

/**
 * Get user balance
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getBalance = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const balanceQuery = `SELECT balance FROM users WHERE id = $1`;
    const balanceResult = await pool.query(balanceQuery, [userId]);
    
    if (balanceResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    return res.status(200).json({ balance: balanceResult.rows[0].balance });
  } catch (error) {
    console.error('Error fetching balance:', error);
    return res.status(500).json({ message: 'Server error while fetching balance' });
  }
};

/**
 * Add funds to user balance
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.addFunds = async (req, res) => {
  const { amount } = req.body;
  const userId = req.user.id;
  
  if (!amount || isNaN(amount) || amount <= 0) {
    return res.status(400).json({ message: 'Invalid amount' });
  }
  
  try {
    // Start transaction
    await pool.query('BEGIN');
    
    // Update user balance
    const updateQuery = `UPDATE users SET balance = balance + $1 WHERE id = $2 RETURNING balance`;
    const updateResult = await pool.query(updateQuery, [amount, userId]);
    
    if (updateResult.rows.length === 0) {
      await pool.query('ROLLBACK');
      return res.status(404).json({ message: 'User not found' });
    }
    
    const newBalance = updateResult.rows[0].balance;
    
    // Record transaction
    const transactionQuery = `
      INSERT INTO balance_transactions (user_id, amount, transaction_type, description, status)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, amount, transaction_type, description, status, created_at
    `;
    const transactionResult = await pool.query(transactionQuery, [
      userId,
      amount,
      'deposit',
      'Balance top-up',
      'completed'
    ]);
    
    const transaction = transactionResult.rows[0];
    
    // Commit transaction
    await pool.query('COMMIT');
    
    return res.status(200).json({ 
      success: true,
      balance: newBalance,
      message: 'Funds added successfully'
    });
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Error adding funds:', error);
    return res.status(500).json({ message: 'Server error while adding funds' });
  }
};

/**
 * Initialize online payment with selected payment provider
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.initializeOnlinePayment = async (req, res) => {
  const { amount, bank } = req.body;
  const userId = req.user.id;
  
  if (!amount || isNaN(amount) || amount <= 0) {
    return res.status(400).json({ message: 'Invalid amount' });
  }
  
  // Validate bank selection
  const validBanks = ['flitt', 'bog', 'tbc']; // Add more banks as needed
  const selectedBank = bank && validBanks.includes(bank.toLowerCase()) ? bank.toLowerCase() : 'flitt'; // Default to Flitt
  
  try {
    // Generate a unique order ID
    const orderId = `BW-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    
    // Create a pending transaction record
    const transactionQuery = `
      INSERT INTO balance_transactions (user_id, amount, transaction_type, description, status, external_reference)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
    `;
    
    const transactionResult = await pool.query(transactionQuery, [
      userId,
      amount,
      'deposit',
      `Online payment (${selectedBank}) - balance top-up`,
      'pending',
      orderId
    ]);
    
    const transactionId = transactionResult.rows[0].id;
    
    let paymentSession;
    let paymentUrl;
    
    // Define common variables for all payment providers
    const clientBaseUrl = process.env.FRONTEND_URL || 'https://autovend.ge';
    // Use production server URL for callbacks (must be publicly accessible)
    const apiBaseUrl = process.env.BASE_URL || 'https://big-way-server.onrender.com';

    console.log('Client base URL for redirect:', clientBaseUrl);
    console.log('API base URL for callbacks:', apiBaseUrl);
    
    // Initialize payment based on selected bank
    switch (selectedBank) {
      case 'bog':
        try {
          // Update transaction record with payment provider
          await pool.query(
            'UPDATE balance_transactions SET payment_provider = $1 WHERE id = $2',
            ['bog', transactionId]
          );
          
          // Get user information for the payment
          const userQuery = `SELECT username, email, phone FROM users WHERE id = $1`;
          const userResult = await pool.query(userQuery, [userId]);
          const user = userResult.rows[0] || {};
          
          // Create order data for BOG API
          const orderData = {
            amount: amount,
            description: `Balance top-up for user #${userId}`,
            shopOrderId: orderId,
            // Use server URL for redirect (BOG will redirect here, then we redirect to frontend)
            redirectUrl: `${apiBaseUrl}/api/balance/bog-redirect?orderId=${orderId}`,
            // Specify callback URL for payment notifications
            callbackUrl: `${apiBaseUrl}/api/balance/bog-callback`,
            // Order expiry time in minutes (30 minutes)
            ttl: 30,
            // Default currency
            currency: "GEL",
            // Enable all payment methods
            paymentMethods: [
              bogPaymentService.PAYMENT_METHODS.CARD,
              bogPaymentService.PAYMENT_METHODS.APPLE_PAY,
              bogPaymentService.PAYMENT_METHODS.GOOGLE_PAY,
              bogPaymentService.PAYMENT_METHODS.BOG_P2P
            ],
            // Add buyer information if available
            buyer: user.email || user.phone ? {
              masked_email: user.email ? user.email.replace(/(^.{2})(.*)(@.*$)/, '$1****$3') : undefined,
              masked_phone: user.phone ? user.phone.replace(/(^.{4})(.*)(.{2}$)/, '$1****$3') : undefined,
              full_name: user.username || undefined
            } : undefined
          };
          
          // Create payment session with BOG API
          const bogPayment = await bogPaymentService.createOrder(orderData);
          
          // Store payment data for callback validation
          await pool.query(
            'UPDATE balance_transactions SET payment_data = $1 WHERE id = $2',
            [JSON.stringify({ 
              orderId: bogPayment.orderId,
              expiryDate: bogPayment.expiryDate,
              status: bogPayment.status
            }), transactionId]
          );
          
          paymentSession = {
            bank: 'bog',
            orderId: bogPayment.orderId,
            status: 'pending',
            expiryDate: bogPayment.expiryDate
          };
          
          paymentUrl = bogPayment.paymentUrl;
        } catch (error) {
          console.error('BOG payment initialization error:', error);
          // Fallback to basic payment URL if API integration fails
          paymentUrl = `${apiBaseUrl}/api/balance/bog-payment?orderId=${orderId}&userId=${userId}`;
          
          paymentSession = {
            bank: 'bog',
            orderId,
            status: 'pending',
            error: true
          };
        }
        break;
        
      case 'tbc':
        // Initialize payment with TBC Bank
        // This would implement TBC Bank's payment API
        paymentSession = {
          bank: 'tbc',
          orderId,
          status: 'pending'
        };
        paymentUrl = `${BASE_URL}/api/balance/tbc-payment?orderId=${orderId}&userId=${userId}`;
        break;
        
      case 'flitt':
      default:
        try {
          console.log('Starting Flitt payment initialization...');

          // Initialize payment with Flitt (default)
          const clientBaseUrl = process.env.FRONTEND_URL || 'https://autovend.ge';
          const paymentData = {
            orderId,
            description: `Big Way Balance Top-up (${amount} GEL)`,
            amount, // Amount in GEL
            redirectUrl: `${apiBaseUrl}/api/balance/flitt-redirect?orderId=${orderId}`, // Response URL (POST from Flitt, then redirect user)
            callbackUrl: `${apiBaseUrl}/api/balance/flitt-callback` // Server webhook (POST for payment confirmation)
          };

          console.log('Flitt payment data prepared:', {
            ...paymentData,
            baseUrl: BASE_URL,
            apiBaseUrl: apiBaseUrl
          });

          // Create payment session with Flitt
          paymentSession = await createPaymentSession(paymentData);
          console.log('Flitt payment session created successfully:', paymentSession);
          
          paymentUrl = paymentSession.redirect_url || paymentSession.checkout_url;
          
          if (!paymentUrl) {
            throw new Error('No checkout URL returned from Flitt');
          }
        } catch (flittError) {
          console.error('Flitt payment initialization error:', flittError);
          console.error('Flitt error stack:', flittError.stack);
          
          // Re-throw the error to be caught by the outer try-catch
          throw new Error(`Flitt payment error: ${flittError.message}`);
        }
        break;
    }
    
    // Update the transaction with payment session information
    await pool.query(
      `UPDATE balance_transactions SET payment_data = $1, payment_provider = $2 WHERE id = $3`,
      [JSON.stringify(paymentSession), selectedBank, transactionId]
    );
    
    // Return payment URL to client
    return res.status(200).json({
      success: true,
      orderId,
      bank: selectedBank,
      paymentUrl,
      message: 'Payment session created successfully'
    });
    
  } catch (error) {
    console.error('Error initializing online payment:', error);
    console.error('Error stack:', error.stack);
    
    // Log additional information for debugging
    console.error('Request details:', {
      userId: req.user?.id,
      amount,
      bank: selectedBank,
      baseUrl: BASE_URL,
      apiBaseUrl: req.protocol + '://' + req.get('host')
    });
    
    return res.status(500).json({ 
      message: 'Server error while initializing payment',
      error: error.message,
      details: process.env.NODE_ENV === 'production' ? undefined : error.stack
    });
  }
};

/**
 * Handle payment callback from Flitt
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.handlePaymentCallback = async (req, res) => {
  try {
    console.log('=== FLITT PAYMENT CALLBACK RECEIVED ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    console.log('Request query:', JSON.stringify(req.query, null, 2));
    console.log('Request headers:', JSON.stringify(req.headers, null, 2));

    // Flitt may send data in different formats, check both body and query
    const callbackData = req.body.response || req.body;
    const { transaction_id, order_id, payment_id, order_status, status } = callbackData;

    console.log('Extracted data:', { transaction_id, order_id, payment_id, order_status, status });

    // Try to find order_id from different possible fields
    const orderId = order_id || callbackData.order_id || callbackData.merchant_order_id;

    if (!orderId) {
      console.error('Missing order_id in callback. Full callback data:', callbackData);
      return res.status(400).json({ message: 'Missing order_id parameter' });
    }

    // Find the corresponding transaction in our database
    const transactionQuery = `
      SELECT * FROM balance_transactions WHERE external_reference = $1
    `;
    const transactionResult = await pool.query(transactionQuery, [orderId]);

    if (transactionResult.rows.length === 0) {
      console.error('Transaction not found for order_id:', orderId);
      return res.status(404).json({ message: 'Transaction not found' });
    }

    const transaction = transactionResult.rows[0];
    console.log('Found transaction:', transaction.id);

    // Check payment status - Flitt uses 'approved' or 'order_status'
    const isSuccessful =
      order_status === 'approved' ||
      order_status === 'APPROVED' ||
      status === 'success' ||
      status === 'approved' ||
      callbackData.response_status === 'success';

    console.log('Payment status check:', { order_status, status, isSuccessful });

    if (isSuccessful) {
      // Start transaction
      await pool.query('BEGIN');

      try {
        // Update transaction status to completed
        await pool.query(
          `UPDATE balance_transactions SET status = 'completed', payment_data = $1 WHERE id = $2`,
          [JSON.stringify({
            callback_data: callbackData,
            processed_at: new Date().toISOString(),
            provider: 'flitt'
          }), transaction.id]
        );

        // Update user balance
        await pool.query(
          `UPDATE users SET balance = balance + $1 WHERE id = $2`,
          [transaction.amount, transaction.user_id]
        );

        // Commit transaction
        await pool.query('COMMIT');

        console.log(`✅ Payment successful: Added ${transaction.amount} GEL to user ${transaction.user_id}`);
      } catch (dbError) {
        await pool.query('ROLLBACK');
        console.error('Database error:', dbError);
        throw dbError;
      }
    } else {
      // Update transaction status to failed
      await pool.query(
        `UPDATE balance_transactions SET status = 'failed', payment_data = $1 WHERE id = $2`,
        [JSON.stringify({
          callback_data: callbackData,
          processed_at: new Date().toISOString(),
          provider: 'flitt'
        }), transaction.id]
      );

      console.log(`❌ Payment failed for transaction ${transaction.id}`);
    }

    // Always respond with success to Flitt to acknowledge receipt
    console.log('Sending 200 OK response to Flitt');
    return res.status(200).json({ success: true });

  } catch (error) {
    console.error('Error processing payment callback:', error);
    return res.status(500).json({ message: 'Server error processing payment callback' });
  }
};

/**
 * Handle Flitt redirect after payment (receives POST from Flitt)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.handleFlittRedirect = async (req, res) => {
  try {
    console.log('=== FLITT REDIRECT RECEIVED ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    console.log('Request query:', JSON.stringify(req.query, null, 2));

    // Get orderId from query or body
    const orderId = req.query.orderId || req.body.order_id || req.body.orderId;
    const orderStatus = req.body.order_status || req.body.status;

    console.log('Extracted:', { orderId, orderStatus });

    // Determine status for frontend
    const status = (orderStatus === 'approved' || orderStatus === 'APPROVED') ? 'success' : 'pending';

    // Get frontend URL
    const clientBaseUrl = process.env.FRONTEND_URL || 'https://autovend.ge';
    const redirectUrl = `${clientBaseUrl}/profile/balance?orderId=${orderId}&status=${status}&provider=flitt`;

    console.log('Redirecting user to:', redirectUrl);

    // Redirect user to frontend
    return res.redirect(redirectUrl);
  } catch (error) {
    console.error('Error handling Flitt redirect:', error);
    const clientBaseUrl = process.env.FRONTEND_URL || 'https://autovend.ge';
    return res.redirect(`${clientBaseUrl}/profile/balance?error=payment-processing-failed`);
  }
};

/**
 * Handle payment completion redirect
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.paymentComplete = async (req, res) => {
  try {
    // Check both query params (GET) and body (POST)
    const orderId = req.query.orderId || req.body.orderId;
    const userId = req.query.userId || req.body.userId;
    const status = req.query.status || req.body.status || 'pending';

    // Redirect to the client-side payment completion page
    res.redirect(`${BASE_URL.replace('/api', '')}/profile/balance/payment-complete?orderId=${orderId}&status=${status}`);
  } catch (error) {
    console.error('Error handling payment completion:', error);
    res.redirect(`${BASE_URL.replace('/api', '')}/profile/balance?error=payment-processing-failed`);
  }
};

/**
 * Handle BOG redirect after payment (receives redirect from BOG)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.handleBogRedirect = async (req, res) => {
  try {
    console.log('=== BOG REDIRECT RECEIVED ===');
    console.log('Request query:', JSON.stringify(req.query, null, 2));
    console.log('Request body:', JSON.stringify(req.body, null, 2));

    // Get orderId from query
    const orderId = req.query.orderId || req.body.orderId;
    const status = req.query.status || req.body.status || 'success';

    console.log('Extracted:', { orderId, status });

    // Get frontend URL
    const clientBaseUrl = process.env.FRONTEND_URL || 'https://autovend.ge';
    const redirectUrl = `${clientBaseUrl}/profile/balance?orderId=${orderId}&status=${status}&provider=bog`;

    console.log('Redirecting user to:', redirectUrl);

    // Redirect user to frontend
    return res.redirect(redirectUrl);
  } catch (error) {
    console.error('Error handling BOG redirect:', error);
    const clientBaseUrl = process.env.FRONTEND_URL || 'https://autovend.ge';
    return res.redirect(`${clientBaseUrl}/profile/balance?error=payment-processing-failed&provider=bog`);
  }
};

/**
 * Handle Bank of Georgia payment page (direct redirect to BOG payment page)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.bogPaymentPage = async (req, res) => {
  try {
    const { orderId, userId } = req.query;
    
    if (!orderId || !userId) {
      return res.status(400).json({ message: 'Missing required parameters' });
    }
    
    // Find the transaction
    const transactionQuery = `
      SELECT * FROM balance_transactions WHERE external_reference = $1 AND user_id = $2
    `;
    const transactionResult = await pool.query(transactionQuery, [orderId, userId]);
    
    if (transactionResult.rows.length === 0) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    
    const transaction = transactionResult.rows[0];
    
    // Define common variables
    const clientBaseUrl = process.env.FRONTEND_URL || 'https://autovend.ge';
    
    // Create order data for BOG API
    const orderData = {
      amount: transaction.amount,
      description: `Balance top-up for user #${userId}`,
      shopOrderId: orderId,
      // Use client URL for redirect back to frontend
      redirectUrl: `${clientBaseUrl}/profile/balance?orderId=${orderId}&status=success&provider=bog`
    };
    
    // Create payment session with BOG API
    const bogPayment = await bogPaymentService.createOrder(orderData);
    
    // Store payment data for callback validation
    await pool.query(
      'UPDATE balance_transactions SET payment_data = $1 WHERE id = $2',
      [JSON.stringify({ 
        orderId: bogPayment.orderId,
        expiryDate: bogPayment.expiryDate,
        status: bogPayment.status 
      }), transaction.id]
    );
    
    // Immediately redirect to the BOG payment page
    return res.redirect(bogPayment.paymentUrl);
  } catch (error) {
    console.error('Error processing BOG payment redirect:', error);
    
    // Redirect to frontend with error status
    const clientBaseUrl = process.env.FRONTEND_URL || 'https://autovend.ge';
    return res.redirect(`${clientBaseUrl}/profile/balance?status=failed&error=payment-initialization-failed&provider=bog`);
  }
};

/**
 * Handle Bank of Georgia payment callback
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.handleBogPaymentCallback = async (req, res) => {
  // Get raw body for signature validation
  const rawBody = req.rawBody || JSON.stringify(req.body);
  const callbackSignature = req.headers['callback-signature'];
  const paymentData = req.body;
  
  console.log('=== BOG CALLBACK RECEIVED ===');
  console.log('BOG Callback body:', JSON.stringify(paymentData, null, 2));
  console.log('BOG Callback signature:', callbackSignature);
  console.log('BOG Raw body length:', rawBody ? rawBody.length : 'N/A');
  
  try {
    // Immediately acknowledge receipt to meet BOG's requirements
    // BOG expects a 200 response to confirm that we received the callback
    res.status(200).json({ success: true, message: 'Notification received' });
    
    // Begin processing the callback after responding
    const client = await pool.connect();
    
    try {
      // Validate structure and signature of the callback
      if (!paymentData || !paymentData.event || !paymentData.body) {
        console.error('BOG callback has invalid structure:', paymentData);
        return;
      }
      
      // Validate it's a payment event
      if (paymentData.event !== 'order_payment') {
        console.log(`Ignoring non-payment event: ${paymentData.event}`);
        return;
      }
      
      // Parse the callback data to extract payment information
      const parsedData = bogPaymentService.parseCallback(paymentData);
      
      // Verify the signature if provided
      let signatureValid = true;
      if (callbackSignature) {
        signatureValid = bogPaymentService.validateCallbackSignature(rawBody, callbackSignature);
        if (!signatureValid) {
          console.error('BOG callback signature validation failed');
          return; // Exit if signature validation fails
        }
      }
      
      // Extract the external order ID (from our system)
      const externalOrderId = parsedData.externalOrderId;
      if (!externalOrderId) {
        console.error('BOG callback missing external_order_id in body');
        return;
      }
      
      // Find the transaction record
      const transactionQuery = `
        SELECT * FROM balance_transactions WHERE external_reference = $1
      `;
      const transactionResult = await client.query(transactionQuery, [externalOrderId]);
      
      if (transactionResult.rows.length === 0) {
        console.error('Transaction not found for external_order_id:', externalOrderId);
        return;
      }
      
      const transaction = transactionResult.rows[0];
      
      // Check payment status
      const paymentStatus = parsedData.status;
      const isSuccess = bogPaymentService.isPaymentSuccessful(paymentStatus);
      const isFailed = bogPaymentService.isPaymentFailed(paymentStatus);
      const isPending = bogPaymentService.isPaymentPending(paymentStatus);
      
      console.log(`BOG payment status: ${paymentStatus}, Success: ${isSuccess}, Failed: ${isFailed}, Pending: ${isPending}`);
      
      // Skip if transaction is already completed or failed
      if (transaction.status === 'completed') {
        console.log('Transaction already completed, ignoring callback');
        return;
      }
      
      if (isSuccess) {
        // Start database transaction
        await client.query('BEGIN');

        try {
          console.log(`Processing successful BOG payment for transaction ${transaction.id}`);
          console.log(`Amount to add: ${transaction.amount} GEL`);
          console.log(`User ID: ${transaction.user_id}`);

          // Update transaction status to completed
          const updateTxResult = await client.query(
            `UPDATE balance_transactions SET status = 'completed', payment_data = payment_data || $1::jsonb WHERE id = $2 RETURNING id, status`,
            [JSON.stringify({
              provider: 'bog',
              payment_time: new Date().toISOString(),
              order_id: parsedData.orderId,
              external_order_id: parsedData.externalOrderId,
              payment_status: paymentStatus,
              payment_method: parsedData.paymentMethod,
              transaction_id: parsedData.transactionId,
              callback_data: paymentData
            }), transaction.id]
          );

          console.log(`Transaction updated:`, updateTxResult.rows[0]);

          // Update user balance
          const updateBalanceResult = await client.query(
            `UPDATE users SET balance = balance + $1 WHERE id = $2 RETURNING balance`,
            [transaction.amount, transaction.user_id]
          );

          console.log(`User balance updated. New balance: ${updateBalanceResult.rows[0]?.balance} GEL`);

          // Commit transaction
          await client.query('COMMIT');

          console.log(`✅ BOG Payment successful: Added ${transaction.amount} GEL to user ${transaction.user_id}`);
        } catch (dbError) {
          // Rollback transaction on database error
          await client.query('ROLLBACK');
          console.error('Database error processing payment:', dbError);
        }
      } else if (isFailed) {
        // Update transaction status to failed
        await client.query(
          `UPDATE balance_transactions SET status = 'failed', payment_data = payment_data || $1::jsonb WHERE id = $2`,
          [JSON.stringify({
            provider: 'bog',
            payment_time: new Date().toISOString(),
            order_id: parsedData.orderId,
            external_order_id: parsedData.externalOrderId,
            payment_status: paymentStatus,
            reject_reason: parsedData.rejectReason,
            callback_data: paymentData
          }), transaction.id]
        );
        
        console.log(`BOG Payment failed for transaction ${transaction.id}: ${parsedData.rejectReason || 'Unknown reason'}`);
      } else if (isPending) {
        console.log(`BOG Payment is still pending for transaction ${transaction.id}, status: ${paymentStatus}`);
      }
    } catch (error) {
      console.error('Error processing BOG payment callback:', error);
      try { await client.query('ROLLBACK'); } catch (e) { /* ignore */ }
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Unexpected error in BOG callback handler:', error);
  }
};

/**
 * Render TBC Bank payment page
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.tbcPaymentPage = async (req, res) => {
  try {
    const { orderId, userId } = req.query;
    
    if (!orderId || !userId) {
      return res.status(400).json({ message: 'Missing required parameters' });
    }
    
    // Find the transaction
    const transactionQuery = `
      SELECT * FROM balance_transactions WHERE external_reference = $1 AND user_id = $2
    `;
    const transactionResult = await pool.query(transactionQuery, [orderId, userId]);
    
    if (transactionResult.rows.length === 0) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    
    const transaction = transactionResult.rows[0];
    
    // For demonstration purposes, we'll render a simple HTML page with TBC payment form
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>TBC ბანკით გადახდა</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            background-color: #f5f5f5;
            margin: 0;
            padding: 20px;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
          }
          .payment-container {
            background-color: white;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            padding: 30px;
            width: 100%;
            max-width: 500px;
          }
          .bank-logo {
            text-align: center;
            margin-bottom: 20px;
          }
          .bank-logo img {
            max-width: 140px;
          }
          h1 {
            text-align: center;
            color: #00A3E0;
            margin-bottom: 30px;
          }
          .form-group {
            margin-bottom: 20px;
          }
          label {
            display: block;
            margin-bottom: 8px;
            font-weight: bold;
            color: #333;
          }
          input {
            width: 100%;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 16px;
            box-sizing: border-box;
          }
          .amount-display {
            background-color: #f0f8ff;
            padding: 15px;
            border-radius: 4px;
            margin-bottom: 20px;
            text-align: center;
            font-size: 24px;
            font-weight: bold;
            color: #00A3E0;
          }
          button {
            background-color: #00A3E0;
            color: white;
            border: none;
            border-radius: 4px;
            padding: 12px 20px;
            font-size: 16px;
            cursor: pointer;
            width: 100%;
            transition: background-color 0.3s;
          }
          button:hover {
            background-color: #0082b3;
          }
        </style>
      </head>
      <body>
        <div class="payment-container">
          <div class="bank-logo">
            <img src="https://www.tbcbank.ge/web/static/media/tbc.c89cbb5a.svg" alt="TBC Bank Logo">
          </div>
          <h1>გადახდა თიბისი ბანკით</h1>
          <div class="amount-display">
            ${transaction.amount} GEL
          </div>
          <form id="payment-form" action="/api/balance/tbc-payment-callback" method="post">
            <input type="hidden" name="orderId" value="${orderId}">
            <input type="hidden" name="userId" value="${userId}">
            <input type="hidden" name="amount" value="${transaction.amount}">
            
            <div class="form-group">
              <label for="card-number">ბარათის ნომერი</label>
              <input type="text" id="card-number" placeholder="XXXX XXXX XXXX XXXX" required>
            </div>
            
            <div class="form-group">
              <label for="expiry">მოქმედების ვადა</label>
              <input type="text" id="expiry" placeholder="MM/YY" required>
            </div>
            
            <div class="form-group">
              <label for="cvv">CVV/CVC</label>
              <input type="text" id="cvv" placeholder="XXX" required>
            </div>
            
            <button type="submit">გადახდა</button>
          </form>
          
          <script>
            document.getElementById('payment-form').addEventListener('submit', function(e) {
              e.preventDefault();
              // This is a demonstration, so we'll just simulate a successful payment
              const form = this;
              setTimeout(() => {
                form.submit();
              }, 2000);
            });
          </script>
        </div>
      </body>
      </html>
    `;
    
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (error) {
    console.error('Error processing TBC payment page:', error);
    res.status(500).json({ message: 'Server error while processing payment page' });
  }
};

/**
 * Handle TBC Bank payment callback
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.handleTbcPaymentCallback = async (req, res) => {
  try {
    const { orderId, userId } = req.body;
    
    // For demonstration purposes, we'll assume the payment was successful
    // In a real implementation, you would verify the payment with TBC API
    
    // Find the corresponding transaction
    const transactionQuery = `
      SELECT * FROM balance_transactions WHERE external_reference = $1
    `;
    const transactionResult = await pool.query(transactionQuery, [orderId]);
    
    if (transactionResult.rows.length === 0) {
      console.error('Transaction not found for order_id:', orderId);
      return res.status(404).json({ message: 'Transaction not found' });
    }
    
    const transaction = transactionResult.rows[0];
    
    // Start transaction
    await pool.query('BEGIN');
    
    // Update transaction status to completed
    await pool.query(
      `UPDATE balance_transactions SET status = 'completed', payment_data = payment_data || $1::jsonb WHERE id = $2`,
      [JSON.stringify({provider: 'tbc', payment_time: new Date().toISOString()}), transaction.id]
    );
    
    // Update user balance
    await pool.query(
      `UPDATE users SET balance = balance + $1 WHERE id = $2`,
      [transaction.amount, transaction.user_id]
    );
    
    // Commit transaction
    await pool.query('COMMIT');
    
    console.log(`TBC Payment successful: Added ${transaction.amount} GEL to user ${transaction.user_id}`);
    
    // Redirect to success page
    res.redirect(`${BASE_URL.replace('/api', '')}/profile/balance/payment-complete?orderId=${orderId}&status=success`);
    
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Error processing TBC payment callback:', error);
    res.redirect(`${BASE_URL.replace('/api', '')}/profile/balance?error=payment-processing-failed`);
  }
};

/**
 * Get transaction history for a user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getTransactionHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const transactionsQuery = `
      SELECT id, amount, transaction_type as type, description, status, created_at
      FROM balance_transactions
      WHERE user_id = $1
        AND transaction_type NOT IN ('auto_renewal_car', 'auto_renewal_part')
      ORDER BY created_at DESC
    `;
    
    const transactionsResult = await pool.query(transactionsQuery, [userId]);
    
    return res.status(200).json({ 
      transactions: transactionsResult.rows 
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return res.status(500).json({ message: 'Server error while fetching transactions' });
  }
};

/**
 * Purchase VIP status using balance
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
/**
 * Get transaction history for all users (admin only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getAdminTransactions = async (req, res) => {
  try {
    // დროებითი ლოგი მოთხოვნის შესახებ
    console.log('User requesting admin transactions:', { 
      id: req.user.id, 
      role: req.user.role || 'unknown',
      firstName: req.user.first_name || 'Unknown',
      lastName: req.user.last_name || 'Unknown'
    });
    
    // პირდაპირ მოვიძიოთ ყველა ტრანზაქცია
    // დავამატოთ ცხრილის არსებობის შემოწმება
    const checkTableQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'balance_transactions'
      );
    `;
    
    const tableExists = await pool.query(checkTableQuery);
    console.log('balance_transactions table exists:', tableExists.rows[0].exists);
    
    // ცხრილის სტრუქტურის შემოწმება
    const tableStructureQuery = `
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'balance_transactions';
    `;
    
    const tableStructure = await pool.query(tableStructureQuery);
    console.log('balance_transactions structure:', tableStructure.rows);
    
    // ტრანზაქციების რაოდენობა
    const countQuery = `SELECT COUNT(*) FROM balance_transactions;`;
    const countResult = await pool.query(countQuery);
    console.log('Total balance_transactions count:', countResult.rows[0].count);
    
    // თუ ტრანზაქციები არსებობს, მოვითხოვოთ ერთი ნიმუში
    const sampleQuery = `SELECT * FROM balance_transactions LIMIT 1;`;
    const sampleResult = await pool.query(sampleQuery);
    console.log('Sample transaction:', sampleResult.rows[0]);
    
    // მთავარი მოთხოვნა - exclude auto-renewal transactions by default
    const includeAutoRenewals = req.query.includeAutoRenewals === 'true';
    const transactionsQuery = `
      SELECT id, amount, transaction_type as type, description, status, 
            created_at, reference_id, user_id 
      FROM balance_transactions
      ${includeAutoRenewals ? '' : "WHERE transaction_type NOT IN ('auto_renewal_car', 'auto_renewal_part')"}
      ORDER BY created_at DESC
    `;
    
    const transactionsResult = await pool.query(transactionsQuery);
    console.log(`Found ${transactionsResult.rows.length} transactions in main query`);
    
    // მოვიძიოთ მომხმარებლები მაგრამ გავითვალისწინოთ სწორი სვეტები
    const usersQuery = `SELECT id, email, first_name, last_name, role FROM users`;
    const usersResult = await pool.query(usersQuery);
    console.log(`Found ${usersResult.rows.length} users`); // მომხმარებლების რაოდენობის ლოგი
    
    // შევქმნათ მომხმარებლების მაპი
    const usersMap = {};
    usersResult.rows.forEach(user => {
      usersMap[user.id] = {
        id: user.id,
        name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Unknown User',
        email: user.email,
        is_admin: user.role === 'admin' // დავუშვათ რომ role===admin არის ადმინისტრატორი
      };
    });
    
    // გადავაფორმატოთ მონაცემები კლიენტის API-სთვის
    const formattedTransactions = transactionsResult.rows.map(row => {
      const user = usersMap[row.user_id] || {
        id: row.user_id,
        name: `მომხმარებელი #${row.user_id}`,
        email: `user${row.user_id}@example.com`,
        is_admin: false
      };
      
      return {
        id: row.id,
        amount: row.amount,
        type: row.type,
        description: row.description,
        status: row.status,
        created_at: row.created_at,
        reference_id: row.reference_id,
        user: user
      };
    });
    
    // სერიალიზაციის პრობლემის დიაგნოსტიკა
    console.log('Formatted transactions count:', formattedTransactions.length);
    if (formattedTransactions.length > 0) {
      console.log('First formatted transaction (sample):', 
        JSON.stringify(formattedTransactions[0], null, 2)
      );
    }
    
    // შედეგის დაბრუნება
    const response = { transactions: formattedTransactions };
    console.log('Final response structure:', Object.keys(response));
    console.log('transactions array is array?', Array.isArray(response.transactions));
    console.log('transactions array length:', response.transactions.length);
    
    return res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching admin transactions:', error);
    return res.status(500).json({ message: 'Server error while fetching admin transactions' });
  }
};

/**
 * Purchase VIP status using balance
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.purchaseVipStatus = async (req, res) => {
  const { carId, vipStatus, days, colorHighlighting, colorHighlightingDays, autoRenewal, autoRenewalDays } = req.body;
  const userId = req.user.id;
  
  console.log('🔍 purchaseVipStatus received request:', { carId, vipStatus, days, colorHighlighting, colorHighlightingDays, autoRenewal, autoRenewalDays, userId });
  console.log('🔍 days type:', typeof days);
  console.log('🔍 days value:', days);
  console.log('🔍 Additional services:', { colorHighlighting, colorHighlightingDays, autoRenewal, autoRenewalDays });
  console.log('🔍 colorHighlighting type:', typeof colorHighlighting);
  console.log('🔍 colorHighlighting value:', colorHighlighting);
  console.log('🔍 colorHighlightingDays type:', typeof colorHighlightingDays);
  console.log('🔍 colorHighlightingDays value:', colorHighlightingDays);
  console.log('🔍 Request body:', req.body);
  console.log('🔍 Raw request body:', JSON.stringify(req.body, null, 2));
  
  // Convert boolean parameters that might come as strings
  const colorHighlightingBool = colorHighlighting === true || colorHighlighting === 'true';
  const autoRenewalBool = autoRenewal === true || autoRenewal === 'true';
  
  console.log('🔍 Boolean conversion:');
  console.log('   - colorHighlighting original:', colorHighlighting, '(type:', typeof colorHighlighting + ')');
  console.log('   - colorHighlighting converted:', colorHighlightingBool, '(type:', typeof colorHighlightingBool + ')');
  console.log('   - autoRenewal original:', autoRenewal, '(type:', typeof autoRenewal + ')');
  console.log('   - autoRenewal converted:', autoRenewalBool, '(type:', typeof autoRenewalBool + ')');
  
  // დავრწმუნდეთ, რომ days არის მთელი რიცხვი და დადებითი
  // ყოველთვის გადავიყვანოთ რიცხვად, რადგან შეიძლება მოვიდეს სტრიქონის სახით
  const daysNumber = Number(days);
  // ვრწმუნდებით რომ days არის მინიმუმ 1 და მთელი რიცხვი
  const validDays = Math.max(1, Math.round(daysNumber));
  
  // დამატებითი ლოგი დებაგისთვის
  console.log('DEBUGGING VIP PURCHASE:');
  console.log('Original days parameter from request:', days);
  console.log('Days parameter type:', typeof days);
  console.log('Converted days to number:', daysNumber);
  console.log('Final validated days to be used:', validDays);
  console.log('Converted days to number:', daysNumber);
  console.log('Validated days:', validDays);
  
  if (!vipStatus || isNaN(daysNumber) || daysNumber <= 0) {
    console.log('Invalid request parameters detected:', { vipStatus, vipStatusType: typeof vipStatus, days, daysNumber, daysType: typeof daysNumber });
    return res.status(400).json({ message: 'Invalid request parameters' });
  }
  
  // Validate VIP status is one of the allowed values
  const validVipStatuses = ['none', 'vip', 'vip_plus', 'super_vip'];
  if (!validVipStatuses.includes(vipStatus)) {
    console.log('Invalid VIP status received:', vipStatus, 'Valid options:', validVipStatuses);
    return res.status(400).json({ message: `Invalid VIP status. Valid options are: ${validVipStatuses.join(', ')}` });
  }
  
  try {
    // Start transaction
    await pool.query('BEGIN');
    
    // Check if the status has already been purchased
    const existingVipQuery = `
      SELECT t.id
      FROM balance_transactions t
      WHERE t.user_id = $1 AND t.reference_id = $2 AND t.transaction_type = 'vip_purchase' AND t.status = 'completed'
      LIMIT 1
    `;
    const existingVipResult = await pool.query(existingVipQuery, [userId, carId]);
    
    if (existingVipResult.rows.length > 0) {
      await pool.query('ROLLBACK');
      return res.status(400).json({ message: 'VIP status already purchased for this car' });
    }
    
    // Check if car exists and belongs to user
    const carQuery = `SELECT id, title FROM cars WHERE id = $1 AND seller_id = $2`;
    const carResult = await pool.query(carQuery, [carId, userId]);
    
    if (carResult.rows.length === 0) {
      await pool.query('ROLLBACK');
      return res.status(404).json({ message: 'Car not found or does not belong to user' });
    }
    
    // Get VIP price - Use database pricing
    let pricePerDay;
    switch (vipStatus) {
      case 'none':
        pricePerDay = 0; // No VIP package, only additional services
        break;
      case 'vip':
        pricePerDay = 2; // Match database pricing
        break;
      case 'vip_plus':
        pricePerDay = 5;
        break;
      case 'super_vip':
        pricePerDay = 7; // Match database pricing
        break;
      default:
        await pool.query('ROLLBACK');
        return res.status(400).json({ message: 'Invalid VIP status' });
    }
    
    // გამოვიყენოთ ვალიდური დღეების რაოდენობა ფასის გამოსათვლელად
    // ვრწმუნდებით რომ ფასის გამოთვლისას ვიყენებთ ზუსტად იმ რაოდენობის დღეებს, რაც მომხმარებელმა აირჩია
    console.log('PRICE CALCULATION DETAILS:');
    console.log('Price per day:', pricePerDay);
    console.log('Valid days for calculation:', validDays);
    console.log('Days type:', typeof validDays);
    
    // Calculate additional services cost using converted boolean values
    let additionalServicesCost = 0;
    if (colorHighlightingBool) {
      const colorDays = Number(colorHighlightingDays) || validDays;
      additionalServicesCost += 0.5 * colorDays;
      console.log(`Color highlighting: 0.5 GEL/day × ${colorDays} days = ${0.5 * colorDays} GEL`);
    }
    if (autoRenewalBool) {
      const renewalDays = Number(autoRenewalDays) || validDays;
      additionalServicesCost += 0.5 * renewalDays;
      console.log(`Auto renewal: 0.5 GEL/day × ${renewalDays} days = ${0.5 * renewalDays} GEL`);
    }
    
    // ვრწმუნდებით რომ გამოვიყენებთ რიცხვით ტიპებს გამრავლებისთვის
    // ვრწმუნდებით რომ ყველა მნიშვნელობა არის რიცხვითი ტიპის
    const pricePerDayNum = parseFloat(pricePerDay);
    const validDaysNum = parseInt(validDays, 10);
    
    // ვრწმუნდებით რომ დღეების რაოდენობა არის მინიმუმ 1
    const finalDays = Math.max(1, validDaysNum);
    
    // Calculate base VIP price
    const baseVipPrice = pricePerDayNum * finalDays;
    
    // გამოვთვალოთ ჯამური ფასი (VIP + დამატებითი სერვისები)
    const totalPrice = baseVipPrice + additionalServicesCost;
    
    // Validate that at least one service is selected
    // User can choose: 1) Only VIP, 2) Only additional services, 3) Both
    console.log('🔍 VALIDATION CHECK:');
    console.log('   - vipStatus:', vipStatus);
    console.log('   - additionalServicesCost:', additionalServicesCost);
    console.log('   - colorHighlighting original:', colorHighlighting, '(type:', typeof colorHighlighting + ')');
    console.log('   - colorHighlighting converted:', colorHighlightingBool, '(type:', typeof colorHighlightingBool + ')');
    console.log('   - colorHighlightingDays:', colorHighlightingDays, '(type:', typeof colorHighlightingDays + ')');
    console.log('   - autoRenewal original:', autoRenewal, '(type:', typeof autoRenewal + ')');
    console.log('   - autoRenewal converted:', autoRenewalBool, '(type:', typeof autoRenewalBool + ')');
    console.log('   - autoRenewalDays:', autoRenewalDays, '(type:', typeof autoRenewalDays + ')');
    
    // Check if at least one service is selected
    const hasVipService = vipStatus !== 'none';
    const hasColorHighlighting = colorHighlightingBool && colorHighlightingDays > 0;
    const hasAutoRenewal = autoRenewalBool && autoRenewalDays > 0;
    const hasAnyService = hasVipService || hasColorHighlighting || hasAutoRenewal;
    
    console.log('   - hasVipService:', hasVipService);
    console.log('   - hasColorHighlighting:', hasColorHighlighting);
    console.log('   - hasAutoRenewal:', hasAutoRenewal);
    console.log('   - hasAnyService:', hasAnyService);
    console.log('   - validation will fail:', !hasAnyService);
    
    if (!hasAnyService) {
      console.log('❌ VALIDATION FAILED: No services selected');
      await pool.query('ROLLBACK');
      return res.status(400).json({ 
        message: 'At least one service must be selected (VIP package or additional services)',
        debug: {
          vipStatus,
          hasVipService,
          colorHighlighting,
          colorHighlightingBool,
          colorHighlightingDays,
          hasColorHighlighting,
          autoRenewal,
          autoRenewalBool,
          autoRenewalDays,
          hasAutoRenewal,
          additionalServicesCost,
          hasAnyService
        }
      });
    }
    
    console.log('✅ VALIDATION PASSED: At least one service selected');
    
    console.log(`FIXED PRICE CALCULATION WITH ADDITIONAL SERVICES:`);
    console.log(`Price per day (number): ${pricePerDayNum}, type: ${typeof pricePerDayNum}`);
    console.log(`Days (number): ${finalDays}, type: ${typeof finalDays}`);
    console.log(`Base VIP price: ${pricePerDayNum} * ${finalDays} = ${baseVipPrice}`);
    console.log(`Additional services cost: ${additionalServicesCost}`);
    console.log(`Total price: ${baseVipPrice} + ${additionalServicesCost} = ${totalPrice}`);
    
    // Check user balance
    const balanceQuery = `SELECT balance FROM users WHERE id = $1 FOR UPDATE`;
    const balanceResult = await pool.query(balanceQuery, [userId]);
    
    if (balanceResult.rows.length === 0) {
      await pool.query('ROLLBACK');
      return res.status(404).json({ message: 'User not found' });
    }
    
    const currentBalance = balanceResult.rows[0].balance;
    
    if (currentBalance < totalPrice) {
      await pool.query('ROLLBACK');
      return res.status(400).json({ 
        message: 'Insufficient balance',
        requiredAmount: totalPrice,
        currentBalance: currentBalance
      });
    }
    
    // Deduct from balance - ვრწმუნდებით რომ სწორი თანხა გამოვიანგარიშოთ
    console.log('BALANCE DEDUCTION:');
    console.log('Current balance before deduction:', currentBalance);
    console.log('Amount to deduct (total price):', totalPrice);
    
    // ვრწმუნდებით რომ totalPrice არის რიცხვითი ტიპის და არა NaN
    if (isNaN(totalPrice)) {
      console.error('ERROR: totalPrice is NaN, using default price per day');
      // თუ ფასი არასწორად გამოთვლილია, გამოვიყენოთ მხოლოდ დღიური ფასი
      totalPrice = pricePerDayNum;
    }
    
    // Use the totalPrice that includes additional services
    const deductionAmount = totalPrice;
    
    console.log('FINAL DEDUCTION AMOUNT (INCLUDING ADDITIONAL SERVICES):');
    console.log(`Base VIP price: ${baseVipPrice} GEL`);
    console.log(`Additional services cost: ${additionalServicesCost} GEL`);
    console.log(`Total amount to deduct: ${deductionAmount} GEL`);
    
    // Use the already calculated totalPrice that includes additional services
    const totalCharge = deductionAmount;
    
    console.log(`FINAL PRICE CALCULATION (INCLUDING ADDITIONAL SERVICES): ${totalCharge} ლარი`);
    
    let newBalance;
    try {
      // პირდაპირი ბალანსის განახლება პარამეტრიზებული მოთხოვნით
      const updateBalanceQuery = `UPDATE users SET balance = balance - $1 WHERE id = $2 RETURNING balance`;
      
      console.log(`Deducting ${totalCharge} GEL from balance for ${finalDays} days of ${vipStatus} status`);
      console.log('Original balance:', currentBalance);
      
      const updateBalanceResult = await pool.query(updateBalanceQuery, [totalCharge, userId]);
      
      // გადავამოწმოთ შედეგი
      if (updateBalanceResult.rows.length === 0) {
        throw new Error('Failed to update balance');
      }
      
      newBalance = updateBalanceResult.rows[0].balance;
      const actualDeduction = currentBalance - newBalance;
      
      console.log('Result:');
      console.log('- New balance:', newBalance);
      console.log('- Actual deduction:', actualDeduction);
      console.log('- Expected deduction:', totalCharge);
      
      // გადავამოწმოთ თუ სწორი თანხა იქნა გამოკლებული
      if (Math.abs(actualDeduction - totalCharge) > 0.01) {
        console.error('WARNING: Deduction differs from expected amount!');
        console.error(`Expected: ${totalCharge}, Actual: ${actualDeduction}`);
      } else {
        console.log('SUCCESS: Deducted amount matches expected amount');
      }
    } catch (error) {
      console.error('ERROR DURING DIRECT SQL BALANCE UPDATE:', error);
      throw error;
    }
    
    // Calculate expiration date
    const expirationDate = new Date();
    // დავაყენოთ დრო დღის ბოლოზე (23:59:59), რომ მთელი დღე იყოს გათვალისწინებული
    expirationDate.setHours(23, 59, 59, 999);
    
    // გამოვიყენოთ ვალიდური დღეების რაოდენობა ვადის გასვლის თარიღის გამოსათვლელად
    // ვრწმუნდებით რომ ვიყენებთ იმავე დღეების რაოდენობას, რაც გამოვიყენეთ ფასის გამოსათვლელად
    expirationDate.setDate(expirationDate.getDate() + finalDays);
    console.log(`Setting expiration date to ${finalDays} days from now: ${expirationDate.toISOString()}`);
    console.log(`IMPORTANT: Using final days count: ${finalDays} for expiration date calculation`);
    
    // დავლოგოთ დეტალური ინფორმაცია დებაგინგისთვის
    console.log('VIP PURCHASE SUMMARY:');
    console.log('- Car ID:', carId);
    console.log('- VIP Status:', vipStatus);
    console.log('- Days requested (original):', days);
    console.log('- Days used for calculation:', validDays);
    console.log('- Price per day:', pricePerDay);
    console.log('- Total price calculated:', totalPrice);
    console.log('- Total price deducted:', currentBalance - newBalance);
    console.log('- Original balance:', currentBalance);
    console.log('- New balance:', newBalance);
    console.log('- Expiration date:', expirationDate.toISOString());
    
    // Update car VIP status - handle missing VIP columns gracefully
    let updateCarResult;
    try {
      if (vipStatus === 'none') {
        // For 'none' status, only update additional services, don't change VIP status
        const selectCarQuery = `SELECT id FROM cars WHERE id = $1`;
        updateCarResult = await pool.query(selectCarQuery, [carId]);
        // Mock the expected response structure
        updateCarResult.rows[0] = {
          vip_status: 'none',
          vip_expiration_date: null
        };
      } else {
        // Try to update VIP status and expiration date for actual VIP packages
        const updateCarQuery = `
          UPDATE cars 
          SET vip_status = $1, vip_expiration_date = $2 
          WHERE id = $3 
          RETURNING vip_status, vip_expiration_date
        `;
        updateCarResult = await pool.query(updateCarQuery, [vipStatus, expirationDate, carId]);
      }
    } catch (columnError) {
      console.log('VIP columns not found in database, skipping VIP status update:', columnError.message);
      // Mock response for missing columns
      updateCarResult = {
        rows: [{
          vip_status: vipStatus,
          vip_expiration_date: vipStatus === 'none' ? null : expirationDate
        }]
      };
    }
    
    // Create detailed transaction description with breakdown
    let transactionDescription = `Additional Services Purchase - Car #${carId}\n`;
    if (vipStatus !== 'none') {
      transactionDescription = `VIP Purchase - Car #${carId}\n`;
      transactionDescription += `${vipStatus.toUpperCase().replace('_', ' ')} Package (${finalDays} day${finalDays > 1 ? 's' : ''}): ${baseVipPrice.toFixed(2)} GEL`;
    } else {
      transactionDescription += `Standard Package (no VIP upgrade): ${baseVipPrice.toFixed(2)} GEL`;
    }
    
    if (colorHighlighting || autoRenewal) {
      transactionDescription += `\nAdditional Services:`;
      
      if (colorHighlighting) {
        const colorDays = Number(colorHighlightingDays) || validDays;
        const colorCost = 0.5 * colorDays;
        transactionDescription += `\n• Color Highlighting (${colorDays} day${colorDays > 1 ? 's' : ''}): ${colorCost.toFixed(2)} GEL`;
      }
      
      if (autoRenewal) {
        const renewalDays = Number(autoRenewalDays) || validDays;
        const renewalCost = 0.5 * renewalDays;
        transactionDescription += `\n• Auto Renewal (${renewalDays} day${renewalDays > 1 ? 's' : ''}): ${renewalCost.toFixed(2)} GEL`;
      }
    }
    
    transactionDescription += `\nTotal Amount: ${totalCharge.toFixed(2)} GEL`;
    
    // Update color highlighting settings if color highlighting is enabled
    console.log('🔍 Checking color highlighting condition:');
    console.log('   - colorHighlighting original:', colorHighlighting, '(type:', typeof colorHighlighting + ')');
    console.log('   - colorHighlighting converted:', colorHighlightingBool, '(type:', typeof colorHighlightingBool + ')');
    console.log('   - colorHighlightingDays:', colorHighlightingDays, '(type:', typeof colorHighlightingDays + ')');
    console.log('   - condition result:', colorHighlightingBool && colorHighlightingDays > 0);
    
    if (colorHighlightingBool && colorHighlightingDays > 0) {
      try {
        console.log(`Setting up color highlighting for car ${carId}: ${colorHighlightingDays} days`);
        
        // First check if color highlighting columns exist
        const columnCheckQuery = `
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'cars' 
          AND column_name IN ('color_highlighting_enabled', 'color_highlighting_expiration_date', 'color_highlighting_total_days', 'color_highlighting_remaining_days')
        `;
        
        const columnCheck = await pool.query(columnCheckQuery);
        
        if (columnCheck.rows.length < 4) {
          console.error('❌ Color highlighting columns are missing from cars table!');
          console.error('Missing columns. Found columns:', columnCheck.rows.map(row => row.column_name));
          console.error('💡 Run this command to add the columns:');
          console.error('   node run-color-highlighting-migrations.js');
          
          // Don't fail the entire purchase, but log the issue
          console.log('⚠️  Continuing VIP purchase without color highlighting due to missing database columns');
        } else {
          console.log('✅ All color highlighting columns found, proceeding with update');
          
          // Calculate color highlighting expiration date
          const colorHighlightingExpirationDate = new Date();
          colorHighlightingExpirationDate.setHours(23, 59, 59, 999);
          colorHighlightingExpirationDate.setDate(colorHighlightingExpirationDate.getDate() + colorHighlightingDays);
          
          const colorHighlightingUpdateQuery = `
            UPDATE cars 
            SET 
              color_highlighting_enabled = $1,
              color_highlighting_expiration_date = $2,
              color_highlighting_total_days = $3,
              color_highlighting_remaining_days = $4
            WHERE id = $5
            RETURNING id, color_highlighting_enabled, color_highlighting_expiration_date, color_highlighting_total_days
          `;
          
          const updateResult = await pool.query(colorHighlightingUpdateQuery, [
            true, // color_highlighting_enabled
            colorHighlightingExpirationDate.toISOString(), // when color highlighting service expires
            colorHighlightingDays, // total days purchased
            colorHighlightingDays, // remaining days (initially same as total)
            carId
          ]);
          
          if (updateResult.rowCount > 0) {
            console.log(`✅ Color highlighting configured successfully for car ${carId}:`);
            console.log('   - Enabled:', updateResult.rows[0].color_highlighting_enabled);
            console.log('   - Expires:', updateResult.rows[0].color_highlighting_expiration_date);
            console.log('   - Total days:', updateResult.rows[0].color_highlighting_total_days);
          } else {
            console.error(`❌ Failed to update color highlighting for car ${carId} - no rows affected`);
          }
        }
        
      } catch (colorHighlightingError) {
        console.error('❌ Error setting up color highlighting:', colorHighlightingError.message);
        console.error('Full error:', colorHighlightingError);
        
        if (colorHighlightingError.message.includes('column') && colorHighlightingError.message.includes('does not exist')) {
          console.error('💡 The color highlighting columns do not exist in the cars table.');
          console.error('   Run the migration: node run-color-highlighting-migrations.js');
        }
        
        // Don't fail the entire purchase if color highlighting setup fails
        console.log('⚠️  Continuing VIP purchase without color highlighting due to error');
      }
    }

    // Update auto-renewal settings if auto-renewal is enabled
    if (autoRenewalBool && autoRenewalDays > 0) {
      try {
        console.log(`Setting up auto-renewal for car ${carId}: ${autoRenewalDays} days`);
        
        // Calculate auto-renewal expiration date
        const autoRenewalExpirationDate = new Date();
        autoRenewalExpirationDate.setHours(23, 59, 59, 999);
        autoRenewalExpirationDate.setDate(autoRenewalExpirationDate.getDate() + autoRenewalDays);
        
        const autoRenewalUpdateQuery = `
          UPDATE cars 
          SET 
            auto_renewal_enabled = $1,
            auto_renewal_days = $2,
            auto_renewal_expiration_date = $3,
            auto_renewal_total_days = $4,
            auto_renewal_remaining_days = $5
          WHERE id = $6
        `;
        
        await pool.query(autoRenewalUpdateQuery, [
          true, // auto_renewal_enabled
          autoRenewalDays, // auto_renewal_days (how often to refresh)
          autoRenewalExpirationDate.toISOString(), // when auto-renewal service expires
          autoRenewalDays, // total days purchased
          autoRenewalDays, // remaining days (initially same as total)
          carId
        ]);
        
        console.log(`✓ Auto-renewal configured for car ${carId} - ${autoRenewalDays} days`);
        
      } catch (autoRenewalError) {
        console.error('Error setting up auto-renewal (continuing with VIP purchase):', autoRenewalError.message);
        // Don't fail the entire purchase if auto-renewal setup fails
      }
    }
    
    // Record transaction
    const transactionQuery = `
      INSERT INTO balance_transactions (user_id, amount, transaction_type, description, status, reference_id)
      VALUES ($1, $2, $3, $4, $5, $6)
    `;
    await pool.query(transactionQuery, [
      userId,
      -totalCharge, // Use totalCharge which includes additional services
      'vip_purchase',
      transactionDescription,
      'completed',
      carId
    ]);
    
    // Commit transaction
    await pool.query('COMMIT');
    
    // დავამატოთ დეტალური ინფორმაცია პასუხში
    const response = {
      success: true,
      newBalance: newBalance,
      vipStatus: updateCarResult.rows[0].vip_status,
      vipExpiration: updateCarResult.rows[0].vip_expiration_date,
      message: `Successfully purchased ${vipStatus} status for ${finalDays} days`,
      daysRequested: finalDays,
      totalPrice: totalCharge,  // ვიყენებთ ახალ სწორ ფასს პასუხში
      deductedAmount: currentBalance - newBalance,
      priceInfo: {
        pricePerDay: pricePerDayNum,
        days: finalDays,
        calculatedTotal: totalCharge
      }
    };
    
    console.log('Response being sent to client:', response);
    return res.status(200).json(response);
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Error purchasing VIP status:', error);
    return res.status(500).json({ message: 'Server error while purchasing VIP status' });
  }
};

/**
 * Check payment status by orderId
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.checkPaymentStatus = async (req, res) => {
  const { orderId } = req.params;
  const userId = req.user.id;
  
  if (!orderId) {
    return res.status(400).json({
      success: false,
      status: 'failed',
      message: 'Order ID is required'
    });
  }
  
  try {
    // Find the transaction in database
    const query = `
      SELECT * FROM balance_transactions 
      WHERE external_reference = $1 AND user_id = $2
    `;
    const result = await pool.query(query, [orderId, userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        status: 'failed',
        message: 'Transaction not found'
      });
    }
    
    const transaction = result.rows[0];
    
    // If the transaction is from Bank of Georgia, verify with BOG API
    if (transaction.payment_provider === 'bog') {
      try {
        // Get payment details from BOG API
        const paymentDetails = await bogPaymentService.getPaymentDetails(orderId);
        
        if (paymentDetails) {
          // Map BOG payment status to our status
          let status = 'pending';
          
          if (['COMPLETED', 'APPROVED', 'CAPTURE'].includes(paymentDetails.status) || 
              paymentDetails.payment_status === 'PAID') {
            status = 'completed';
          } else if (['REJECTED', 'FAILED', 'EXPIRED', 'CANCELED'].includes(paymentDetails.status)) {
            status = 'failed';
          }
          
          // If status is different from what we have in DB, update it
          if (status !== transaction.status && status === 'completed') {
            // Start transaction
            const client = await pool.connect();
            
            try {
              await client.query('BEGIN');
              
              // Update transaction status
              const updateTransactionQuery = `
                UPDATE balance_transactions
                SET status = $1, updated_at = NOW()
                WHERE id = $2
              `;
              await client.query(updateTransactionQuery, ['completed', transaction.id]);
              
              // Update user's balance if status changed to completed
              if (status === 'completed' && transaction.status !== 'completed') {
                const updateBalanceQuery = `
                  UPDATE users
                  SET balance = balance + $1
                  WHERE id = $2
                `;
                await client.query(updateBalanceQuery, [parseFloat(transaction.amount), userId]);
              }
              
              await client.query('COMMIT');
              
              // Update local transaction status for response
              transaction.status = status;
            } catch (err) {
              await client.query('ROLLBACK');
              console.error('Error updating transaction status:', err);
            } finally {
              client.release();
            }
          }
          
          // Return payment status details
          return res.json({
            success: true,
            status: transaction.status,
            orderId,
            amount: transaction.amount,
            provider: transaction.payment_provider,
            updated: transaction.updated_at
          });
        }
      } catch (error) {
        console.error('Error checking BOG payment status:', error);
        // Fall back to database status on error
      }
    }
    
    // Return the status from our database if we couldn't verify with the payment provider
    return res.json({
      success: true,
      status: transaction.status,
      orderId,
      amount: transaction.amount,
      provider: transaction.payment_provider,
      updated: transaction.updated_at
    });
  } catch (error) {
    console.error('Error checking payment status:', error);
    res.status(500).json({
      success: false,
      status: 'failed',
      message: 'Failed to check payment status'
    });
  }
};
