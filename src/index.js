const dotenv = require('dotenv');
// Load environment variables first
dotenv.config();

// Log environment variables to debug
console.log('Environment variables loaded:');
console.log('- GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? 'Defined' : 'NOT DEFINED');
console.log('- GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? 'Defined' : 'NOT DEFINED');

const express = require('express');
const cors = require('cors');
const passport = require('passport');
const swaggerUi = require('swagger-ui-express');
const winston = require('winston');

// Initialize passport configuration before loading routes
require('../config/passport.config');

const authRoutes = require('./routes/auth.routes');
const carsRoutes = require('./routes/cars.routes');
const partsRoutes = require('./routes/parts.routes');
const wishlistRoutes = require('./routes/wishlist.routes');
const advertisementsRoutes = require('./routes/advertisements.routes');
const vipRoutes = require('./routes/vip.routes');
const balanceRoutes = require('./routes/balance.routes');
const adminVipRoutes = require('./routes/adminVip.routes');
const userRoutes = require('./routes/user.routes');
const vipPricingRoutes = require('./routes/vipPricingRoutes');
const analyticsRoutes = require('./routes/analytics.routes');
const dealersRoutes = require('./routes/dealers.routes');
const autosalonsRoutes = require('./routes/autosalons.routes');
const autoRenewalRoutes = require('./routes/autoRenewal.routes');
const termsRoutes = require('./routes/terms.routes');
const specs = require('./docs/swagger');
const { pg: pool } = require('../config/db.config');
const VipPricing = require('./models/VipPricing');
const autoRenewalScheduler = require('./schedulers/autoRenewalScheduler');
const vipExpirationScheduler = require('./schedulers/vipExpirationScheduler');
const { startColorHighlightingScheduler } = require('./scripts/color-highlighting-scheduler');

// Configure logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
  }));
}

// Initialize express app
const app = express();

// CORS Configuration
const whitelist = [
  'http://localhost:3000',  // React development server
  'http://localhost:5173',  // Vite development server
  process.env.FRONTEND_URL
].filter(Boolean);

const corsOptions = {
  origin: true, // დროებითი ცვლილება: დაუშვას ყველა წყარო
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Range', 'X-Total-Count']
};

// Apply CORS before other middleware
app.use(cors(corsOptions));

// Enable pre-flight requests for all routes
app.options('*', cors(corsOptions));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize Passport
app.use(passport.initialize());

// Logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`, {
    ip: req.ip,
    query: req.query,
    body: req.body
  });
  next();
});

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/cars', carsRoutes); 
app.use('/api/parts', partsRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/advertisements', advertisementsRoutes);
app.use('/api/vip', vipRoutes);
app.use('/api/balance', balanceRoutes);
app.use('/api/admin', adminVipRoutes);
app.use('/api/user', userRoutes);
app.use('/api', vipPricingRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/dealers', dealersRoutes);
app.use('/api/autosalons', autosalonsRoutes);
app.use('/api/auto-renewal', autoRenewalRoutes);
app.use('/api/terms', termsRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Big Way API' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Initialize database tables
const initializeDatabase = async () => {
  try {
    await VipPricing.createTableIfNotExists();
    logger.info('Database tables initialized successfully');
  } catch (error) {
    logger.error('Error initializing database tables:', error);
  }
};

// Only start the server if this file is run directly
if (require.main === module) {
  const PORT = process.env.PORT || 5000; // Changed from 5000 to 5001 to avoid conflict
  
  // Initialize database tables before starting server
  initializeDatabase();
  
  // Start the server without waiting for database connection
  // The database connection is already tested in db.config.js
  app.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`);
    
    // Start the auto-renewal scheduler
    autoRenewalScheduler.start();
    logger.info('Auto-renewal scheduler started');
    
    // Start the VIP expiration scheduler
    vipExpirationScheduler.start();
    logger.info('VIP expiration scheduler started');
    
    // Start the color highlighting scheduler
    startColorHighlightingScheduler();
    logger.info('Color highlighting scheduler started');
  }).on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      logger.error(`Port ${PORT} is already in use. Please free up the port and try again.`);
    } else {
      logger.error('Error starting server:', error);
    }
    process.exit(1);
  });
}

module.exports = app;