const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const swaggerUi = require('swagger-ui-express');
const winston = require('winston');
const authRoutes = require('./routes/auth.routes');
const transportsRoutes = require('./routes/transports.routes');
const wishlistRoutes = require('./routes/wishlist.routes');
const specs = require('./docs/swagger');
const db = require('../config/db.config');

// Load environment variables
dotenv.config();

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
  process.env.FRONTEND_URL,
].filter(Boolean); // Remove any undefined values

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      return callback(null, true);
    }
    if (whitelist.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'x-csrf-token',
    'csrf-token'
  ],
  exposedHeaders: ['Content-Range', 'X-Total-Count'],
  maxAge: 86400
};

// Apply CORS before other middleware
app.use(cors(corsOptions));

// Enable pre-flight requests for all routes
app.options('*', cors(corsOptions));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
app.use('/api/transports', transportsRoutes);
app.use('/api/wishlist', wishlistRoutes);

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
  const PORT = process.env.PORT || 10000;
  
  // Test database connection before starting server
  db.connect()
    .then(client => {
      client.release();
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