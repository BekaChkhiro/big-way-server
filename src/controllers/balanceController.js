const pool = require('../../config/db.config');
const { createPaymentSession, verifyPayment } = require('../utils/flittPayment');
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
 * Initialize online payment with Flitt
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.initializeOnlinePayment = async (req, res) => {
  const { amount } = req.body;
  const userId = req.user.id;
  
  if (!amount || isNaN(amount) || amount <= 0) {
    return res.status(400).json({ message: 'Invalid amount' });
  }
  
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
      'Online payment - balance top-up',
      'pending',
      orderId
    ]);
    
    const transactionId = transactionResult.rows[0].id;
    
    // Initialize payment with Flitt
    const paymentData = {
      orderId,
      description: `Big Way Balance Top-up (${amount} GEL)`,
      amount, // Amount in GEL
      redirectUrl: `${BASE_URL}/api/balance/payment-complete?orderId=${orderId}&userId=${userId}`
    };
    
    // Create payment session with Flitt
    const paymentSession = await createPaymentSession(paymentData);
    
    // Update the transaction with payment session information
    await pool.query(
      `UPDATE balance_transactions SET payment_data = $1 WHERE id = $2`,
      [JSON.stringify(paymentSession), transactionId]
    );
    
    // Return payment URL to client
    return res.status(200).json({
      success: true,
      orderId,
      paymentUrl: paymentSession.redirect_url || paymentSession.checkout_url,
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
