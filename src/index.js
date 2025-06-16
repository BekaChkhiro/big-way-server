const dotenv = require('dotenv');
// Load environment variables first
dotenv.config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const passport = require('passport');
const swaggerUi = require('swagger-ui-express');
const winston = require('winston');
const authRoutes = require('./routes/auth.routes');
const carsRoutes = require('./routes/cars.routes');
const partsRoutes = require('./routes/parts.routes');
const wishlistRoutes = require('./routes/wishlist.routes');
const advertisementsRoutes = require('./routes/advertisements.routes');
const vipRoutes = require('./routes/vip.routes');
const balanceRoutes = require('./routes/balance.routes');
const adminVipRoutes = require('./routes/adminVip.routes');
const userRoutes = require('./routes/user.routes');
const specs = require('./docs/swagger');
const pool = require('../config/db.config');

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

// Serve static files from the uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
console.log('Serving static files from:', path.join(__dirname, '../uploads'));

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

app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Big Way API' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Only start the server if this file is run directly
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  
  // Test database connection before starting server
  pool.query('SELECT NOW()')
    .then(() => {
      logger.info('Database connection successful');
      
      app.listen(PORT, () => {
        logger.info(`Server is running on port ${PORT}`);
      }).on('error', (error) => {
        if (error.code === 'EADDRINUSE') {
          logger.error(`Port ${PORT} is already in use. Please free up the port and try again.`);
        } else {
          logger.error('Error starting server:', error);
        }
        process.exit(1);
      });
    })
    .catch(err => {
      logger.error('Database connection failed:', err);
      process.exit(1);
    });
}

module.exports = app;