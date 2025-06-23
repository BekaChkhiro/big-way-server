const pool = require('../../config/db.config');
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
    
    // Initialize payment based on selected bank
    switch (selectedBank) {
      case 'bog':
        try {
          // Update transaction record with payment provider
          await pool.query(
            'UPDATE balance_transactions SET payment_provider = $1 WHERE id = $2',
            ['bog', transactionId]
          );
          
          // Create order data for BOG API
          // Use frontend URL for redirect to ensure proper client-side handling
          const clientBaseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
          const apiBaseUrl = `${req.protocol}://${req.get('host')}`;
          
          console.log('Client base URL for redirect:', clientBaseUrl);
          console.log('API base URL:', apiBaseUrl);
          
          const orderData = {
            amount: amount,
            description: `Balance top-up for user #${userId}`,
            shopOrderId: orderId,
            // Use client URL for redirect back to frontend
            redirectUrl: `${clientBaseUrl}/profile/balance?orderId=${orderId}&status=success&provider=bog`
          };
          
          // Create payment session with BOG API
          const bogPayment = await bogPaymentService.createOrder(orderData);
          
          // Store BOG payment hash for callback validation
          await pool.query(
            'UPDATE balance_transactions SET payment_data = $1 WHERE id = $2',
            [JSON.stringify({ paymentHash: bogPayment.paymentHash }), transactionId]
          );
          
          paymentSession = {
            bank: 'bog',
            orderId: bogPayment.orderId,
            status: 'pending',
            paymentHash: bogPayment.paymentHash
          };
          
          paymentUrl = bogPayment.paymentUrl;
        } catch (error) {
          console.error('BOG payment initialization error:', error);
          // Fallback to basic payment URL if API integration fails
          paymentUrl = `${BASE_URL}/api/balance/bog-payment?orderId=${orderId}&userId=${userId}`;
          
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
        // Initialize payment with Flitt (default)
        const paymentData = {
          orderId,
          description: `Big Way Balance Top-up (${amount} GEL)`,
          amount, // Amount in GEL
          redirectUrl: `${BASE_URL}/api/balance/payment-complete?orderId=${orderId}&userId=${userId}`
        };
        
        // Create payment session with Flitt
        paymentSession = await createPaymentSession(paymentData);
        paymentUrl = paymentSession.redirect_url || paymentSession.checkout_url;
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
    return res.status(500).json({ 
      message: 'Server error while initializing payment',
      error: error.message
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
    const { transaction_id, order_id, status } = req.body;
    
    console.log('Payment callback received:', req.body);
    
    if (!transaction_id || !order_id) {
      return res.status(400).json({ message: 'Missing required parameters' });
    }
    
    // Verify payment status with Flitt
    const paymentVerification = await verifyPayment(transaction_id);
    
    // Find the corresponding transaction in our database
    const transactionQuery = `
      SELECT * FROM balance_transactions WHERE external_reference = $1
    `;
    const transactionResult = await pool.query(transactionQuery, [order_id]);
    
    if (transactionResult.rows.length === 0) {
      console.error('Transaction not found for order_id:', order_id);
      return res.status(404).json({ message: 'Transaction not found' });
    }
    
    const transaction = transactionResult.rows[0];
    
    // Process based on payment status
    if (paymentVerification.status === 'success' || status === 'success') {
      // Start transaction
      await pool.query('BEGIN');
      
      // Update transaction status to completed
      await pool.query(
        `UPDATE balance_transactions SET status = 'completed', payment_data = $1 WHERE id = $2`,
        [JSON.stringify({...req.body, verification: paymentVerification}), transaction.id]
      );
      
      // Update user balance
      await pool.query(
        `UPDATE users SET balance = balance + $1 WHERE id = $2`,
        [transaction.amount, transaction.user_id]
      );
      
      // Commit transaction
      await pool.query('COMMIT');
      
      console.log(`Payment successful: Added ${transaction.amount} GEL to user ${transaction.user_id}`);
    } else {
      // Update transaction status to failed
      await pool.query(
        `UPDATE balance_transactions SET status = 'failed', payment_data = $1 WHERE id = $2`,
        [JSON.stringify({...req.body, verification: paymentVerification}), transaction.id]
      );
      
      console.log(`Payment failed for transaction ${transaction.id}`);
    }
    
    // Always respond with success to Flitt to acknowledge receipt
    return res.status(200).json({ success: true });
    
  } catch (error) {
    console.error('Error processing payment callback:', error);
    return res.status(500).json({ message: 'Server error processing payment callback' });
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
 * Handle Bank of Georgia payment page (legacy/backup route)
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
    
    // Try to redirect through BOG API if possible
    try {
      // Create order data for BOG API
      // Use frontend URL for redirect to ensure proper client-side handling
      const clientBaseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const apiBaseUrl = `${req.protocol}://${req.get('host')}`;
      
      console.log('Client base URL for redirect:', clientBaseUrl);
      console.log('API base URL:', apiBaseUrl);
      
      const orderData = {
        amount: transaction.amount,
        description: `Balance top-up for user #${userId}`,
        shopOrderId: orderId,
        // Use client URL for redirect back to frontend
        redirectUrl: `${clientBaseUrl}/profile/balance?orderId=${orderId}&status=success&provider=bog`
      };
      
      // Create payment session with BOG API
      const bogPayment = await bogPaymentService.createOrder(orderData);
      
      // Store BOG payment hash for callback validation
      await pool.query(
        'UPDATE balance_transactions SET payment_data = $1 WHERE id = $2',
        [JSON.stringify({ paymentHash: bogPayment.paymentHash }), transaction.id]
      );
      
      // Redirect to the BOG payment page
      return res.redirect(bogPayment.paymentUrl);
    } catch (error) {
      console.error('Failed to create BOG payment order, falling back to demo page:', error);
      // Continue with demo payment page if BOG API fails
    }
    
    // For demonstration purposes, we'll render a simple HTML page with Bank of Georgia payment form
    // This is a fallback if the BOG API integration fails
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>საქართველოს ბანკით გადახდა</title>
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
            max-width: 200px;
          }
          h1 {
            text-align: center;
            color: #0055a5;
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
            color: #0055a5;
          }
          button {
            background-color: #0055a5;
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
            background-color: #003d7a;
          }
        </style>
      </head>
      <body>
        <div class="payment-container">
          <div class="bank-logo">
            <img src="https://bog.ge/img/xlogo.svg.pagespeed.ic.KR-zg_zuDw.webp" alt="Bank of Georgia Logo">
          </div>
          <h1>გადახდა საქართველოს ბანკით</h1>
          <div class="amount-display">
            ${transaction.amount} GEL
          </div>
          <form id="payment-form" action="/api/balance/bog-payment-callback" method="post">
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
              // In a real application, you'd integrate with the actual BOG API here
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
    console.error('Error processing BOG payment page:', error);
    res.status(500).json({ message: 'Server error while processing payment page' });
  }
};

/**
 * Handle Bank of Georgia payment callback
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.handleBogPaymentCallback = async (req, res) => {
  const paymentData = req.body;
  const client = await pool.connect();
  console.log('BOG Callback received:', paymentData);
  
  try {
    // If payment data doesn't have the necessary fields, return error
    if (!paymentData || !paymentData.order_id) {
      console.error('BOG callback missing required fields:', paymentData);
      return res.status(400).json({ success: false, message: 'Invalid payment data' });
    }
    
    // Get order ID from various possible fields
    const orderId = paymentData.order_id || paymentData.shop_order_id || paymentData.orderId;
    
    // Check if this is a status update notification - if so, acknowledge it and process
    if (paymentData.notification_type === 'payment.status.changed' || 
        paymentData.resource_type === 'payment' || 
        paymentData.event === 'payment.status.changed') {
      // This is an async notification - acknowledge receipt immediately
      res.status(200).json({ success: true, message: 'Notification received' });
    }
    
    // Find the transaction record
    const transactionQuery = `
      SELECT * FROM balance_transactions WHERE external_reference = $1
    `;
    const transactionResult = await pool.query(transactionQuery, [orderId]);
    
    if (transactionResult.rows.length === 0) {
      console.error('Transaction not found for order_id:', orderId);
      
      // Don't return error immediately if we already sent acknowledgement
      if (!res.headersSent) {
        return res.status(404).json({ success: false, message: 'Transaction not found' });
      }
      return;
    }
    
    const transaction = transactionResult.rows[0];
    
    // Get payment details from BOG API to verify status
    let paymentVerified = false;
    try {
      const paymentDetails = await bogPaymentService.getPaymentDetails(paymentData.order_id || orderId);
      
      // Check payment status - should be COMPLETED or APPROVED
      if (paymentDetails && 
          (paymentDetails.status === 'COMPLETED' || 
           paymentDetails.status === 'APPROVED' || 
           paymentDetails.status === 'CAPTURE' || 
           paymentDetails.payment_status === 'PAID')) {
        paymentVerified = true;
      } else {
        console.log('Payment not verified, status:', paymentDetails ? paymentDetails.status : 'unknown');
      }
    } catch (verifyError) {
      console.error('Failed to verify payment with BOG API:', verifyError);
      
      // If the verification request failed but we have a valid transaction,
      // check if we have a payment hash for validation
      if (transaction.payment_data && transaction.payment_data.paymentHash) {
        paymentVerified = bogPaymentService.validateCallback(paymentData, transaction.payment_data.paymentHash);
      }
    }
    
    // If payment is verified, proceed with transaction
    if (paymentVerified) {
      // Skip if transaction is already completed
      if (transaction.status === 'completed') {
        console.log('Transaction already completed for order_id:', orderId);
        
        if (!res.headersSent) {
          return res.redirect(`${process.env.CLIENT_BASE_URL || ''}/profile/balance/payment-complete?orderId=${orderId}&status=success`);
        }
        return;
      }
      
      // Start database transaction
      await pool.query('BEGIN');
      
      try {
        // Update transaction status to completed
        await pool.query(
          `UPDATE balance_transactions SET status = 'completed', payment_data = payment_data || $1::jsonb WHERE id = $2`,
          [JSON.stringify({
            provider: 'bog',
            payment_time: new Date().toISOString(),
            payment_id: paymentData.id || paymentData.payment_id,
            payment_status: paymentData.status || 'completed',
            payment_details: paymentData
          }), transaction.id]
        );
        
        // Update user balance
        await pool.query(
          `UPDATE users SET balance = balance + $1 WHERE id = $2`,
          [transaction.amount, transaction.user_id]
        );
        
        // Commit transaction
        await pool.query('COMMIT');
        
        console.log(`BOG Payment successful: Added ${transaction.amount} GEL to user ${transaction.user_id}`);
        
        // Only redirect if we haven't sent headers yet (wasn't an async notification)
        if (!res.headersSent) {
          return res.redirect(`${process.env.CLIENT_BASE_URL || ''}/profile/balance/payment-complete?orderId=${orderId}&status=success`);
        }
      } catch (dbError) {
        // Rollback transaction on database error
        await pool.query('ROLLBACK');
        console.error('Database error processing payment:', dbError);
        
        if (!res.headersSent) {
          return res.redirect(`${process.env.CLIENT_BASE_URL || ''}/profile/balance?error=payment-processing-failed`);
        }
      }
    } else {
      // Payment verification failed
      console.error('Payment verification failed for order_id:', orderId);
      
      if (!res.headersSent) {
        return res.redirect(`${process.env.CLIENT_BASE_URL || ''}/profile/balance?error=payment-verification-failed`);
      }
    }
  } catch (error) {
    // Handle unexpected errors
    try { await pool.query('ROLLBACK'); } catch (e) { /* ignore */ }
    
    console.error('Error processing BOG payment callback:', error);
    
    if (!res.headersSent) {
      res.redirect(`${process.env.CLIENT_BASE_URL || ''}/profile/balance?error=payment-processing-failed`);
    }
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
    
    // მთავარი მოთხოვნა
    const transactionsQuery = `
      SELECT id, amount, transaction_type as type, description, status, 
            created_at, reference_id, user_id 
      FROM balance_transactions
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
  const { carId, vipStatus, days } = req.body;
  const userId = req.user.id;
  
  console.log('purchaseVipStatus received request:', { carId, vipStatus, days, userId });
  console.log('days type:', typeof days);
  console.log('days value:', days);
  console.log('Request body:', req.body);
  console.log('Raw request body:', JSON.stringify(req.body));
  
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
    console.log('Invalid request parameters detected');
    return res.status(400).json({ message: 'Invalid request parameters' });
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
    const carQuery = `SELECT id, title FROM cars WHERE id = $1 AND user_id = $2`;
    const carResult = await pool.query(carQuery, [carId, userId]);
    
    if (carResult.rows.length === 0) {
      await pool.query('ROLLBACK');
      return res.status(404).json({ message: 'Car not found or does not belong to user' });
    }
    
    // Get VIP price
    let pricePerDay;
    switch (vipStatus) {
      case 'vip':
        pricePerDay = 2.5;
        break;
      case 'vip_plus':
        pricePerDay = 5;
        break;
      case 'super_vip':
        pricePerDay = 8;
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
    
    // ვრწმუნდებით რომ გამოვიყენებთ რიცხვით ტიპებს გამრავლებისთვის
    // ვრწმუნდებით რომ ყველა მნიშვნელობა არის რიცხვითი ტიპის
    const pricePerDayNum = parseFloat(pricePerDay);
    const validDaysNum = parseInt(validDays, 10);
    
    // ვრწმუნდებით რომ დღეების რაოდენობა არის მინიმუმ 1
    const finalDays = Math.max(1, validDaysNum);
    
    // გამოვთვალოთ ჯამური ფასი
    const totalPrice = pricePerDayNum * finalDays;
    
    console.log(`FIXED PRICE CALCULATION:`);
    console.log(`Price per day (number): ${pricePerDayNum}, type: ${typeof pricePerDayNum}`);
    console.log(`Days (number): ${finalDays}, type: ${typeof finalDays}`);
    console.log(`Total price: ${pricePerDayNum} * ${finalDays} = ${totalPrice}`);
    
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
    
    // CRITICAL FIX: ვრწმუნდებით რომ სწორად გამოვთვალოთ ფასი დღეების მიხედვით
    console.log('DIRECT PRICE CALCULATION:');
    console.log(`Raw price per day: ${pricePerDay}`);
    console.log(`Raw days count: ${validDays}`);
    
    // გამოვთვალოთ ფასი პირდაპირი მეთოდით
    let directPrice;
    if (pricePerDay === 2.5) {
      directPrice = 2.5 * validDays;
    } else if (pricePerDay === 5) {
      directPrice = 5 * validDays;
    } else if (pricePerDay === 8) {
      directPrice = 8 * validDays;
    } else {
      directPrice = pricePerDay * validDays;
    }
    
    console.log(`Direct calculation result: ${pricePerDay} * ${validDays} = ${directPrice}`);
    
    // CRITICAL FIX: ღირებულების პირდაპირი გამოთვლა ვიპ სტატუსის მიხედვით
    // ვიყენებთ ფიქსირებულ ფასებს და არა ცვლადებს
    let fixedPricePerDay = 0;
    if (vipStatus === 'vip') {
      fixedPricePerDay = 2.5;
    } else if (vipStatus === 'vip_plus') {
      fixedPricePerDay = 5;
    } else if (vipStatus === 'super_vip') {
      fixedPricePerDay = 8;
    }
    
    // გამოვთვალოთ ჯამური ფასი ფიქსირებული სადღეღამისო განაკვეთით
    const fixedCalculatedPrice = fixedPricePerDay * validDays;
    console.log(`FIXED price calculation: ${fixedPricePerDay} * ${validDays} = ${fixedCalculatedPrice}`);
    
    // ვრწმუნდებით რომ ფასი არის დადებითი რიცხვი
    const hardcodedPrice = fixedCalculatedPrice > 0 ? fixedCalculatedPrice : directPrice;
    console.log('Final price to deduct (MANUAL calculation):', hardcodedPrice);
    console.log(`VIP type: ${vipStatus}, Days: ${validDays}, Fixed price: ${hardcodedPrice}`);
    
    // გამოვიყენოთ პარამეტრიზებული მოთხოვნა ბალანსის განახლებისთვის
    // EMERGENCY FIX: გამოვიყენოთ ხელით გამოთვლილი ფასი
    // ვიყენებთ პირდაპირ მნიშვნელობებს
    const hardcodedPriceTable = {
      'vip': 2.5,
      'vip_plus': 5,
      'super_vip': 8
    };
    
    // შევირჩიოთ სადღეღამისო განაკვეთი
    const selectedPricePerDay = hardcodedPriceTable[vipStatus] || fixedPricePerDay;
    
    // გამოვთვალოთ სრული ფასი არჩეული დღეებისთვის
    const totalAmount = selectedPricePerDay * validDays;
    
    // ვიყენებთ ხელით გამოთვლილ ფასს
    const deductionAmount = totalAmount;
    console.log('ABSOLUTE FINAL DEDUCTION AMOUNT:', deductionAmount);
    console.log('Price per day:', selectedPricePerDay);
    console.log(`Days: ${validDays} (integer: ${parseInt(validDays, 10)})`);
    console.log(`For VIP type '${vipStatus}' total cost: ${selectedPricePerDay} * ${validDays} = ${deductionAmount} GEL`);
    
    // მთელი სესიის მონაცემების დამატება დებაგისთვის
    console.log('SESSION DATA:');
    console.log('User ID:', userId);
    console.log('Car ID:', carId);
    console.log('VIP Status:', vipStatus);
    console.log('Days requested:', validDays);
    console.log('Price per day:', pricePerDay);
    console.log('Total price calculated:', deductionAmount);
    console.log('Current balance:', currentBalance);
    
    // FINAL EMERGENCY FIX: ვიყენებთ სამხრივ მიდგომას ბალანსის განახლებისთვის
    // პირდაპირი SQL მოთხოვნა ბალანსის განახლებისთვის
    // Fixed database-friendly values
    const PRICES = {
      'vip': 2.5,
      'vip_plus': 5,
      'super_vip': 8
    };
    
    // იხმარება Number() ფუნქცია რომ დარწმუნდე რომ გვაქვს რიცხვი
    // არასოდეს არ უნდა გამოვიყენოთ parseInt() შეცდომაა
    const cleanDays = Math.max(1, Math.round(Number(validDays))); // მინიმუმ 1 დღე
    
    // ვართ დარწმუნებული რომ გვაქვს უსაფრთხო VIP სტატუსი
    const fixedPrice = PRICES[vipStatus] || 2.5; // ნაგულისხმევად სტანდარტული VIP ფასი თუ არ არის ნაპოვნი
    
    // ABSOLUTE FINAL CALCULATION - საბოლოო გამოთვლა
    const effectivePrice = fixedPrice * cleanDays;
    
    // დავლოგოთ საბოლოო გამოთვლა
    console.log('=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=');
    console.log('ABSOLUTELY FINAL PRICE CALCULATION:');
    console.log(`VIP type: ${vipStatus} (price per day: ${fixedPrice} GEL)`);
    console.log(`Days: ${cleanDays} (validated from ${validDays})`);
    console.log(`TOTAL: ${fixedPrice} GEL * ${cleanDays} days = ${effectivePrice} GEL`);
    console.log('=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=');
    
    // ფიქსირებული ფასები VIP სტატუსებისთვის
    const fixedPrices = {
      'vip': 2.5,
      'vip_plus': 5.0,
      'super_vip': 8.0
    };
    
    // ვიყენებთ ფიქსირებულ ფასს დღიური განაკვეთისთვის
    const dailyPrice = fixedPrices[vipStatus] || 2.5; // გამოვიყენოთ ნაგულისხმევი ფასი თუ სტატუსი არ არის ნაპოვნი
    
    // ვრწმუნდებით, რომ დღეების რაოდენობა არის მთელი რიცხვი
    const numberOfDays = Math.max(1, Math.round(validDays));
    
    // გამოვთვალით ჯამური ფასი
    const totalCharge = dailyPrice * numberOfDays;
    
    console.log(`FINAL PRICE CALCULATION: ${dailyPrice} ლარი * ${numberOfDays} დღე = ${totalCharge} ლარი`);
    
    try {
      // პირდაპირი ბალანსის განახლება პარამეტრიზებული მოთხოვნით
      const updateBalanceQuery = `UPDATE users SET balance = balance - $1 WHERE id = $2 RETURNING balance`;
      
      console.log(`Deducting ${totalCharge} GEL from balance for ${numberOfDays} days of ${vipStatus} status`);
      console.log('Original balance:', currentBalance);
      
      const updateBalanceResult = await pool.query(updateBalanceQuery, [totalCharge, userId]);
      
      // გადავამოწმოთ შედეგი
      if (updateBalanceResult.rows.length === 0) {
        throw new Error('Failed to update balance');
      }
      
      const newBalance = updateBalanceResult.rows[0].balance;
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
    
    // Update car VIP status
    const updateCarQuery = `
      UPDATE cars 
      SET vip_status = $1, vip_expiration_date = $2 
      WHERE id = $3 
      RETURNING vip_status, vip_expiration_date
    `;
    const updateCarResult = await pool.query(updateCarQuery, [vipStatus, expirationDate, carId]);
    
    // Record transaction
    const transactionQuery = `
      INSERT INTO balance_transactions (user_id, amount, transaction_type, description, status, reference_id)
      VALUES ($1, $2, $3, $4, $5, $6)
    `;
    await pool.query(transactionQuery, [
      userId,
      -totalPrice,
      'vip_purchase',
      `VIP status purchase: ${vipStatus} for ${validDays} days`,
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
      message: `Successfully purchased ${vipStatus} status for ${numberOfDays} days`,
      daysRequested: numberOfDays,
      totalPrice: totalCharge,  // ვიყენებთ ახალ სწორ ფასს პასუხში
      deductedAmount: currentBalance - newBalance,
      priceInfo: {
        pricePerDay: dailyPrice,
        days: numberOfDays,
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
