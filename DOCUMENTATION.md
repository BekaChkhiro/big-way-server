# Big Way Project Documentation

## Overview
Big Way is a car marketplace application with a robust backend API built using Node.js, Express, and PostgreSQL. The platform allows users to browse, search, and manage car listings, create accounts, and maintain wishlists of favorite vehicles.

## System Architecture

### Tech Stack
- **Backend**: Node.js with Express.js
- **Database**: PostgreSQL
- **Authentication**: JWT (JSON Web Tokens)
- **Documentation**: Swagger/OpenAPI
- **Logging**: Winston
- **File Storage**: Local file system (with capability for cloud storage)

### Directory Structure
```
server/
├── config/              # Configuration files
├── database/            # Database setup and seed data
├── scripts/             # Utility scripts
├── src/
│   ├── docs/            # API documentation (Swagger)
│   ├── middlewares/     # Express middlewares
│   ├── models/          # Data models
│   │   ├── car/         # Car-related operations
│   │   ├── user/        # User-related operations
│   │   └── wishlist/    # Wishlist-related operations
│   └── routes/          # API routes
│       └── __tests__/   # Route tests
```

## Core Functionality

### Authentication System
The system provides a comprehensive authentication mechanism including:

- **User Registration**: Create new accounts with email/password
- **Login**: Authenticate using email and password
- **JWT Authentication**: Token-based authentication for API access
- **Refresh Tokens**: Support for token refreshing for continued access
- **Email Verification**: Verification of user emails
- **Password Management**: Reset and change password functionality
- **User Profiles**: Viewing and updating user information
- **Account Management**: Delete account functionality
- **Role-based Authorization**: Admin-specific routes and capabilities

### Car Listings Management
The core of the application revolves around car listings with these features:

- **Car Browsing**: View all cars with filtering and pagination
- **Advanced Search**: Search cars based on multiple criteria
- **Car Details**: Detailed view of individual car listings
- **Car Creation**: Add new car listings with images and specifications
- **Car Updates**: Edit existing car listings
- **Car Deletion**: Remove car listings
- **Image Management**: Upload and manage multiple car images
- **View Counting**: Track views for each car listing
- **Featured Cars**: Highlight selected cars on the platform
- **Similar Cars**: Find similar cars based on specifications

### Car Data Organization
Cars are organized using:

- **Brands**: Manufacturer brands (e.g., Toyota, BMW)
- **Models**: Car models associated with brands
- **Categories**: Vehicle types/categories (e.g., SUV, Sedan)

### Wishlist Functionality
Users can manage favorites through:

- **Wishlist Creation**: Add cars to personal wishlist
- **Wishlist Viewing**: See all wishlist items
- **Wishlist Management**: Remove items from wishlist

### API Documentation
The system includes built-in API documentation using Swagger/OpenAPI available at the `/api-docs` endpoint, providing:

- Detailed endpoint descriptions
- Required parameters
- Response formats
- Authentication requirements

## Technical Implementation Details

### Database Connection
- Connection pooling for efficient database access
- Environment-based configuration (local development vs production)
- SSL support for secure database connections
- Error handling for various connection scenarios

### Security Measures
- Password hashing for secure storage
- JWT with appropriate expiry
- CORS configuration to prevent unauthorized domain access
- Input validation to prevent injection attacks
- Error handling that doesn't expose sensitive information

### Performance Optimizations
- Connection pooling for database efficiency
- Pagination for large data sets
- Advanced filtering and search capability
- Caching headers for static resources

### Error Handling and Logging
- Structured logging with Winston
- Different log levels (info, error)
- Environment-specific logging (development vs production)
- Request/response logging for debugging

## API Endpoints

### Authentication Endpoints
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Authenticate and receive tokens
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/verify-email/:token` - Verify email address
- `POST /api/auth/refresh-token` - Get new access token using refresh token
- `GET /api/auth/profile` - Get current user profile
- `GET /api/auth/me` - Get current user profile (alias)
- `PUT /api/auth/me` - Update user profile
- `PUT /api/auth/me/password` - Change password
- `POST /api/auth/reset-password` - Request password reset
- `POST /api/auth/reset-password/confirm` - Confirm password reset
- `DELETE /api/auth/me` - Delete user account
- `GET /api/auth/users` - Admin endpoint to manage users

### Car Endpoints
- `GET /api/cars` - Get all cars with filtering and pagination
- `GET /api/cars/brands` - Get all car brands
- `GET /api/cars/categories` - Get all car categories
- `GET /api/cars/search` - Advanced search for cars
- `GET /api/cars/:id` - Get detailed information about a specific car
- `POST /api/cars` - Create a new car listing
- `PUT /api/cars/:id` - Update an existing car listing
- `DELETE /api/cars/:id` - Delete a car listing
- `POST /api/cars/:id/images` - Upload images for a car
- `GET /api/cars/:id/similar` - Find similar cars

### Wishlist Endpoints
- `GET /api/wishlist` - Get current user's wishlist
- `POST /api/wishlist` - Add a car to wishlist
- `DELETE /api/wishlist/:carId` - Remove a car from wishlist

## Server Configuration
The application server is configured with:

- Environment variable support through dotenv
- CORS protection with configurable origins
- JSON body parsing
- Swagger UI integration
- Winston logging
- Error handling middleware
- Database connection testing before startup

## Database Schema (Detailed)

The application uses a comprehensive PostgreSQL database schema with the following tables:

### Users Table
- `id`: Serial Primary Key
- `username`: Unique username (VARCHAR(50))
- `email`: Unique email address (VARCHAR(100))
- `password`: Hashed password (VARCHAR(255))
- `first_name`: User's first name (VARCHAR(50))
- `last_name`: User's last name (VARCHAR(50))
- `age`: User's age (INTEGER)
- `gender`: Gender using custom enum type `user_gender` ('male', 'female')
- `phone`: Contact phone number (VARCHAR(50))
- `role`: User role using custom enum type `user_role` ('user', 'admin')
- `created_at`: Account creation timestamp

### Brands Table
- `id`: Serial Primary Key
- `name`: Unique brand name (VARCHAR(100))
- `created_at`: Creation timestamp

### Categories Table
- `id`: Serial Primary Key
- `name`: Category name (VARCHAR(100))
- `type`: Vehicle type using custom enum `vehicle_type` ('car', 'special_equipment', 'moto')
- `created_at`: Creation timestamp
- Unique constraint on combination of name and type

### Locations Table
- `id`: Serial Primary Key
- `location_type`: Type using enum `location_type` ('transit', 'georgia', 'international')
- `is_transit`: Boolean flag for transit locations
- `city`: City name (VARCHAR(100))
- `state`: State/region name (VARCHAR(100), nullable)
- `country`: Country name (VARCHAR(100), nullable)
- `created_at`: Creation timestamp
- Includes constraints to ensure proper data for each location type
- Indexed for performance optimization

### Specifications Table
Extensive table for detailed vehicle specifications:
- `id`: Serial Primary Key
- Engine details: `engine_type`, `engine_size`, `horsepower`, `cylinders`, `is_turbo`
- Transmission: `transmission` with check constraint for valid values
- Fuel: `fuel_type` using custom enum
- Mileage: `mileage` and `mileage_unit` (km/mi)
- Physical attributes: `doors`, `body_type`, `steering_wheel`, `drive_type`
- Vehicle condition: `clearance_status`, `has_catalyst`
- Interior: `airbags_count`, `interior_material`, `interior_color`
- Multiple boolean fields for features like:
  - Climate: Air conditioning, climate control
  - Safety: ABS, traction control, parking control, airbags
  - Comfort: Seat heating, sunroof, electric windows
  - Electronics: Navigation, board computer, Bluetooth
  - Security: Central locking, alarm
  - Wheels: Alloy wheels, spare tire
  - Accessibility: Disability adaptation

### Cars Table
- `id`: Serial Primary Key
- Foreign keys: `brand_id`, `category_id`, `location_id`, `specification_id`, `seller_id`
- Basic info: `model`, `year` (with check constraint), `price` (with check constraint)
- Multilingual descriptions: `description_en`, `description_ka`, `description_ru`
- Status: `status` with check constraint ('available', 'sold', 'pending')
- Featured flag: `featured` for highlighted listings
- Statistics: `views_count`
- Timestamps: `created_at`, `updated_at`
- Full-text search: `search_vector` with TSVECTOR type
- Multiple indexes for query optimization:
  - Brand and category indexes
  - Year and price indexes 
  - Status and featured indexes
  - GiST index for price range queries
  - Full-text search index

### Car Images Table
- `id`: Serial Primary Key
- `car_id`: Foreign key to cars
- Image URLs in multiple resolutions:
  - `image_url`: Original image
  - `thumbnail_url`: Small thumbnail
  - `medium_url`: Medium-sized image
  - `large_url`: Large-sized image
- `is_primary`: Boolean flag for main image
- `created_at`: Creation timestamp

### Wishlists Table
- `id`: Serial Primary Key
- `user_id`: Foreign key to users table
- `car_id`: Foreign key to cars table
- `created_at`: Creation timestamp
- Unique constraint to prevent duplicate entries for the same user and car

### Database Triggers & Functions
- `update_updated_at_column()`: Function to automatically update timestamps
- `cars_search_vector_update()`: Function to update search vector for text search
- Trigger to maintain `updated_at` timestamps on cars table
- Trigger for full-text search vector maintenance

## Development Workflow (Detailed)

The system includes a comprehensive development workflow designed for efficiency and code quality:

### Local Development Setup
1. **Environment Configuration**:
   - `.env` file for local development variables
   - Different environment presets for development, testing, and production

2. **Database Initialization**:
   - Schema creation script (`schema.sql`) for database structure
   - Seed data scripts in `database/seeds/` for initial data population
   - Separate seed files for different data categories (brands, categories, users, cars)

3. **Testing Infrastructure**:
   - Jest configuration for JavaScript testing
   - Test database setup script to create and populate test database
   - Isolated test environment with its own database
   - Route tests covering API endpoints functionality

4. **Development Tools**:
   - Logging system with different verbosity levels
   - Swagger documentation for API exploration
   - Database connection pooling for efficient development

### Code Organization
- Modular architecture with clear separation of concerns
- Models divided into logical submodules (base, create, update, search)
- Middleware organization for cross-cutting concerns like authentication and file uploads
- Route handlers separated by functional domain (auth, cars, wishlist)

## Deployment Considerations (Detailed)

The application is designed with deployment flexibility in mind:

### Environment Configuration
- **Environment Variables**:
  - `PORT`: Server port (default: 5000)
  - `NODE_ENV`: Environment name (development, test, production)
  - `DATABASE_URL`: Full database connection string for production
  - `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`: Individual database connection parameters
  - `FRONTEND_URL`: Frontend application URL for CORS configuration

### Database Deployment
- **Connection Pooling**:
  - Configured maximum connections (20)
  - Timeout settings for idle connections (30 seconds)
  - Connection timeout for failed connections (2 seconds)
  - Error handling for various connection scenarios
- **SSL Support**:
  - SSL configuration for secure database connections in production
  - Option to disable certificate validation for certain environments

### Runtime Configuration
- **CORS Settings**:
  - Whitelist-based origin control
  - Support for multiple frontend origins
  - Control of allowed methods and headers
  - Credentials support for authenticated requests
- **Logging Strategy**:
  - File-based logging for production (`error.log`, `combined.log`)
  - Console logging for development environments
  - Structured logging with timestamps and request details

### Security Considerations
- Error handling that prevents information leakage
- JWT configuration with proper expiration and refresh mechanism
- Robust input validation throughout the application

### Scalability Features
- Connection pooling for database efficiency
- Query optimization through database indexing
- Pagination for data-intensive endpoints

### Monitoring and Maintenance
- Comprehensive error logging
- Request/response logging for debugging
- Database connection monitoring

### Cloud Deployment Readiness
- Support for platform-specific database URLs
- Configurable port for platform compatibility
- Environment-specific behavior switches

## Frontend Integration Guide

This section provides instructions for frontend developers on how to integrate with the Big Way API.

### Initial Setup

1. **Environment Configuration**:
   - Create a `.env` file in your frontend project with the following variables:
     ```
     REACT_APP_API_URL=http://localhost:5000  # For development
     REACT_APP_API_TIMEOUT=30000              # Request timeout in milliseconds
     ```

2. **API Base URL**:
   - Configure your API client to use the base URL from environment variables
   - Example with axios:
     ```javascript
     import axios from 'axios';

     const apiClient = axios.create({
       baseURL: process.env.REACT_APP_API_URL,
       timeout: process.env.REACT_APP_API_TIMEOUT,
       headers: {
         'Content-Type': 'application/json',
       }
     });
     
     export default apiClient;
     ```

### Authentication Integration

1. **Registration Flow**:
   - Send POST request to `/api/auth/register` with user details
   - Store returned JWT token and refresh token in secure storage (localStorage or HttpOnly cookies)
   - Example:
     ```javascript
     const register = async (userData) => {
       try {
         const response = await apiClient.post('/api/auth/register', userData);
         // Store tokens and user data
         localStorage.setItem('token', response.data.token);
         localStorage.setItem('refreshToken', response.data.refreshToken);
         return response.data.user;
       } catch (error) {
         // Handle registration errors
         throw error.response?.data || { message: 'Registration failed' };
       }
     };
     ```

2. **Login Flow**:
   - Send POST request to `/api/auth/login` with email and password
   - Store returned JWT token and refresh token
   - Example:
     ```javascript
     const login = async (email, password) => {
       try {
         const response = await apiClient.post('/api/auth/login', { email, password });
         localStorage.setItem('token', response.data.token);
         localStorage.setItem('refreshToken', response.data.refreshToken);
         return response.data.user;
       } catch (error) {
         throw error.response?.data || { message: 'Login failed' };
       }
     };
     ```

3. **Authenticated Requests**:
   - Add Authorization header with JWT token to all authenticated requests
   - Create an interceptor to automatically add token:
     ```javascript
     apiClient.interceptors.request.use(
       (config) => {
         const token = localStorage.getItem('token');
         if (token) {
           config.headers['Authorization'] = `Bearer ${token}`;
         }
         return config;
       },
       (error) => Promise.reject(error)
     );
     ```

4. **Token Refresh Mechanism**:
   - Set up interceptor to handle 401 errors and refresh token
   - Example:
     ```javascript
     apiClient.interceptors.response.use(
       (response) => response,
       async (error) => {
         const originalRequest = error.config;
         
         // If error is 401 and we haven't retried yet
         if (error.response?.status === 401 && !originalRequest._retry) {
           originalRequest._retry = true;
           
           try {
             // Get refresh token
             const refreshToken = localStorage.getItem('refreshToken');
             
             // Call refresh token endpoint
             const response = await apiClient.post('/api/auth/refresh-token', { refreshToken });
             
             // Store new tokens
             localStorage.setItem('token', response.data.token);
             localStorage.setItem('refreshToken', response.data.refreshToken);
             
             // Update authorization header
             originalRequest.headers['Authorization'] = `Bearer ${response.data.token}`;
             
             // Retry original request
             return apiClient(originalRequest);
           } catch (refreshError) {
             // Refresh token failed, redirect to login
             localStorage.removeItem('token');
             localStorage.removeItem('refreshToken');
             window.location.href = '/login';
             return Promise.reject(refreshError);
           }
         }
         
         return Promise.reject(error);
       }
     );
     ```

5. **Logout**:
   - Send POST request to `/api/auth/logout` 
   - Remove tokens from storage
   - Example:
     ```javascript
     const logout = async () => {
       try {
         await apiClient.post('/api/auth/logout');
       } catch (error) {
         console.error('Logout error:', error);
       } finally {
         // Always clear local storage even if request fails
         localStorage.removeItem('token');
         localStorage.removeItem('refreshToken');
       }
     };
     ```

### Working with Cars API

1. **Fetching Cars with Filtering and Pagination**:
   ```javascript
   const getCars = async (page = 1, limit = 10, filters = {}) => {
     try {
       const params = {
         page,
         limit,
         ...filters  // can include: brand_id, category_id, price_min, price_max, etc.
       };
       
       const response = await apiClient.get('/api/cars', { params });
       return response.data;
     } catch (error) {
       throw error.response?.data || { message: 'Failed to fetch cars' };
     }
   };
   ```

2. **Car Detail Fetching**:
   ```javascript
   const getCarById = async (id) => {
     try {
       const response = await apiClient.get(`/api/cars/${id}`);
       return response.data;
     } catch (error) {
       throw error.response?.data || { message: 'Failed to fetch car details' };
     }
   };
   ```

3. **Creating Car Listing with Images**:
   ```javascript
   const createCar = async (carData, images) => {
     try {
       // First create the car
       const response = await apiClient.post('/api/cars', carData);
       const carId = response.data.id;
       
       // Then upload images if available
       if (images && images.length > 0) {
         const formData = new FormData();
         
         images.forEach((image, index) => {
           formData.append('images', image);
           if (index === 0) formData.append('primary_image_index', '0');
         });
         
         await apiClient.post(`/api/cars/${carId}/images`, formData, {
           headers: {
             'Content-Type': 'multipart/form-data'
           }
         });
       }
       
       return response.data;
     } catch (error) {
       throw error.response?.data || { message: 'Failed to create car listing' };
     }
   };
   ```

4. **Updating Car Listing**:
   ```javascript
   const updateCar = async (id, carData) => {
     try {
       const response = await apiClient.put(`/api/cars/${id}`, carData);
       return response.data;
     } catch (error) {
       throw error.response?.data || { message: 'Failed to update car listing' };
     }
   };
   ```

### Wishlist Management

1. **Getting User Wishlist**:
   ```javascript
   const getWishlist = async () => {
     try {
       const response = await apiClient.get('/api/wishlist');
       return response.data;
     } catch (error) {
       throw error.response?.data || { message: 'Failed to fetch wishlist' };
     }
   };
   ```

2. **Adding Car to Wishlist**:
   ```javascript
   const addToWishlist = async (carId) => {
     try {
       const response = await apiClient.post('/api/wishlist', { car_id: carId });
       return response.data;
     } catch (error) {
       throw error.response?.data || { message: 'Failed to add to wishlist' };
     }
   };
   ```

3. **Removing Car from Wishlist**:
   ```javascript
   const removeFromWishlist = async (carId) => {
     try {
       const response = await apiClient.delete(`/api/wishlist/${carId}`);
       return response.data;
     } catch (error) {
       throw error.response?.data || { message: 'Failed to remove from wishlist' };
     }
   };
   ```

### Error Handling Best Practices

1. **Consistent Error Structure**:
   - Create a utility to standardize error handling:
     ```javascript
     const handleApiError = (error) => {
       const defaultError = { message: 'An unexpected error occurred' };
       
       if (!error.response) return defaultError;
       
       const { data, status } = error.response;
       
       switch (status) {
         case 400:
           return data || { message: 'Invalid request data' };
         case 401:
           return data || { message: 'Authentication required' };
         case 403:
           return data || { message: 'You do not have permission for this action' };
         case 404:
           return data || { message: 'Resource not found' };
         case 500:
           return { message: 'Server error, please try again later' };
         default:
           return data || defaultError;
       }
     };
     ```

2. **Form Validation**:
   - Implement client-side validation before API calls
   - Use the same validation rules as the server when possible
   - Example with a validation library:
     ```javascript
     import * as Yup from 'yup';
     
     // Car form validation schema
     const carValidationSchema = Yup.object({
       brand_id: Yup.number().required('Brand is required'),
       category_id: Yup.number().required('Category is required'),
       model: Yup.string().required('Model is required'),
       year: Yup.number()
         .required('Year is required')
         .min(1900, 'Year must be 1900 or later')
         .max(new Date().getFullYear() + 1, 'Year cannot be in the future'),
       price: Yup.number()
         .required('Price is required')
         .positive('Price must be positive')
     });
     ```

### User Interface Recommendations

1. **Car Listings Page**:
   - Implement filters for brand, category, price range, year
   - Show pagination controls with current page indicator
   - Display each car with thumbnail, basic details, and price
   - Include "Add to Wishlist" functionality on each card

2. **Car Detail Page**:
   - Image gallery with thumbnails and main image
   - Tabs for different sections: Overview, Specifications, Seller Info
   - Similar cars section at the bottom
   - Contact/inquiry button
   - Share functionality

3. **User Dashboard**:
   - Profile management section
   - Tabs for: My Listings, Wishlist, Messages
   - Quick actions for common tasks

4. **Responsive Design Considerations**:
   - Ensure mobile compatibility with responsive layouts
   - Optimize image loading for different screen sizes
   - Implement touch-friendly controls for mobile users
