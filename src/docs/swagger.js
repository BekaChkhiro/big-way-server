const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Big Way API Documentation',
      version: '1.0.0',
      description: 'Documentation for the Big Way car marketplace API',
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Specifications: {
          type: 'object',
          properties: {
            engine_type: {
              type: 'string',
            },
            transmission: {
              type: 'string',
              enum: ['manual', 'automatic', 'tiptronic', 'variator'],
            },
            fuel_type: {
              type: 'string',
              enum: [
                'ბენზინი',
                'დიზელი',
                'ელექტრო',
                'ჰიბრიდი',
                'დატენვადი_ჰიბრიდი',
                'თხევადი_გაზი',
                'ბუნებრივი_გაზი',
                'წყალბადი'
              ]
            },
            mileage: {
              type: 'integer',
              minimum: 0,
            },
            mileage_unit: {
              type: 'string',
              enum: ['km', 'mi'],
            },
            engine_size: {
              type: 'number',
              format: 'float',
              minimum: 0.05,
              maximum: 13.0,
              multipleOf: 0.1,
            },
            doors: {
              type: 'integer',
              enum: [2, 3, 4, 5, 6, 7, 8],
            },
            is_turbo: {
              type: 'boolean',
            },
            cylinders: {
              type: 'integer',
              minimum: 0,
            },
            color: {
              type: 'string',
            },
            steering_wheel: {
              type: 'string',
              enum: ['left', 'right'],
            },
            drive_type: {
              type: 'string',
              enum: ['front', 'rear', '4x4'],
            },
            has_catalyst: {
              type: 'boolean',
            },
            airbags_count: {
              type: 'integer',
              minimum: 0,
              maximum: 12,
            },
            interior_material: {
              type: 'string',
              enum: ['ნაჭერი', 'ტყავი', 'ხელოვნური ტყავი', 'კომბინირებული', 'ალკანტარა']
            },
            interior_color: {
              type: 'string',
              enum: ['შავი', 'თეთრი', 'რუხი', 'ყავისფერი', 'ჩალისფერი', 'წითელი', 'ლურჯი', 'ყვითელი', 'ნარინჯისფერი', 'შინდისფერი', 'ოქროსფერი']
            },
            has_hydraulics: {
              type: 'boolean'
            },
            has_board_computer: {
              type: 'boolean'
            },
            has_air_conditioning: {
              type: 'boolean'
            },
            has_parking_control: {
              type: 'boolean'
            },
            has_rear_view_camera: {
              type: 'boolean'
            },
            has_electric_windows: {
              type: 'boolean'
            },
            has_climate_control: {
              type: 'boolean'
            },
            has_cruise_control: {
              type: 'boolean'
            },
            has_start_stop: {
              type: 'boolean'
            },
            has_sunroof: {
              type: 'boolean'
            },
            has_heated_seats: {
              type: 'boolean'
            },
            has_seat_memory: {
              type: 'boolean'
            },
            has_abs: {
              type: 'boolean'
            },
            has_traction_control: {
              type: 'boolean'
            },
            has_central_locking: {
              type: 'boolean'
            },
            has_alarm: {
              type: 'boolean'
            },
            has_fog_lights: {
              type: 'boolean'
            },
            has_navigation: {
              type: 'boolean'
            },
            has_aux: {
              type: 'boolean'
            },
            has_bluetooth: {
              type: 'boolean'
            },
            has_multifunction_steering_wheel: {
              type: 'boolean'
            },
            has_alloy_wheels: {
              type: 'boolean'
            },
            has_spare_tire: {
              type: 'boolean'
            },
            is_disability_adapted: {
              type: 'boolean'
            },
            clearance_status: {
              type: 'string',
              enum: ['cleared', 'not_cleared', 'in_progress']
            },
          },
        },
        Car: {
          type: 'object',
          required: ['brand_id', 'category_id', 'model', 'year', 'price'],
          properties: {
            id: {
              type: 'integer',
            },
            brand_id: {
              type: 'integer',
            },
            category_id: {
              type: 'integer',
            },
            model: {
              type: 'string',
            },
            title: {
              type: 'string',
            },
            year: {
              type: 'integer',
              minimum: 1900,
              maximum: 2025,
            },
            price: {
              type: 'number',
              minimum: 0,
            },
            description_en: {
              type: 'string',
              description: 'Car description in English'
            },
            description_ka: {
              type: 'string',
              description: 'Car description in Georgian'
            },
            description_ru: {
              type: 'string',
              description: 'Car description in Russian'
            },
            status: {
              type: 'string',
              enum: ['available', 'sold', 'pending'],
              default: 'available'
            },
            featured: {
              type: 'boolean',
              default: false
            },
            views_count: {
              type: 'integer',
              minimum: 0,
            },
            specifications: {
              $ref: '#/components/schemas/Specifications',
            },
            location: {
              type: 'object',
              required: ['city'],
              properties: {
                city: {
                  type: 'string',
                },
                state: {
                  type: 'string',
                },
                country: {
                  type: 'string',
                },
                location_type: {
                  type: 'string',
                  enum: ['transit', 'georgia', 'international']
                },
              },
            },
            images: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: {
                    type: 'integer'
                  },
                  image_url: {
                    type: 'string'
                  },
                  thumbnail_url: {
                    type: 'string'
                  },
                  medium_url: {
                    type: 'string'
                  },
                  large_url: {
                    type: 'string'
                  },
                  is_primary: {
                    type: 'boolean'
                  }
                }
              }
            },
            seller_id: {
              type: 'integer'
            },
            created_at: {
              type: 'string',
              format: 'date-time'
            },
            updated_at: {
              type: 'string',
              format: 'date-time'
            }
          },
        },
        Brand: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
            },
            name: {
              type: 'string',
            },
            created_at: {
              type: 'string',
              format: 'date-time'
            }
          },
        },
        Category: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
            },
            name: {
              type: 'string',
            },
            type: {
              type: 'string',
              enum: ['car', 'special_equipment', 'moto']
            },
            created_at: {
              type: 'string',
              format: 'date-time'
            }
          },
        },
        User: {
          type: 'object',
          required: ['username', 'email', 'password'],
          properties: {
            id: {
              type: 'integer',
              description: 'User ID'
            },
            username: {
              type: 'string',
              minLength: 3,
              maxLength: 30
            },
            email: {
              type: 'string',
              format: 'email'
            },
            password: {
              type: 'string',
              format: 'password',
              minLength: 6
            },
            first_name: {
              type: 'string',
              maxLength: 50
            },
            last_name: {
              type: 'string',
              maxLength: 50
            },
            age: {
              type: 'integer',
              minimum: 18
            },
            gender: {
              type: 'string',
              enum: ['male', 'female']
            },
            phone: {
              type: 'string',
              pattern: '^\\+?[1-9]\\d{1,14}$'
            },
            role: {
              type: 'string',
              enum: ['user', 'admin'],
              default: 'user'
            },
            created_at: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        UserResponse: {
          type: 'object',
          properties: {
            user: {
              $ref: '#/components/schemas/User'
            },
            token: {
              type: 'string'
            },
            refreshToken: {
              type: 'string'
            }
          }
        },
        WishlistItem: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Wishlist item ID'
            },
            user_id: {
              type: 'integer',
              description: 'User ID who added the item'
            },
            car_id: {
              type: 'integer',
              description: 'Car ID in wishlist'
            },
            car: {
              $ref: '#/components/schemas/Car'
            },
            created_at: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            message: {
              type: 'string'
            },
            errors: {
              type: 'array',
              items: {
                type: 'string'
              }
            }
          }
        }
      },
    },
  },
  apis: ['./src/routes/*.js'],
};

/**
 * @swagger
 * tags:
 *   - name: Cars
 *     description: Car listings management
 *   - name: Auth
 *     description: Authentication operations
 *   - name: Wishlist
 *     description: Wishlist management
 * 
 * /api/cars:
 *   get:
 *     summary: Get all cars with pagination and filtering
 *     tags: [Cars]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [created_at, price, year, views_count]
 *           default: created_at
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *           default: DESC
 *       - in: query
 *         name: searchQuery
 *         schema:
 *           type: string
 *       - in: query
 *         name: brand_id
 *         schema:
 *           type: integer
 *       - in: query
 *         name: category_id
 *         schema:
 *           type: integer
 *       - in: query
 *         name: price_min
 *         schema:
 *           type: number
 *       - in: query
 *         name: price_max
 *         schema:
 *           type: number
 *       - in: query
 *         name: year_min
 *         schema:
 *           type: integer
 *       - in: query
 *         name: year_max
 *         schema:
 *           type: integer
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of cars with pagination
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 cars:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Car'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     current_page:
 *                       type: integer
 *                     total_pages:
 *                       type: integer
 *                     total_items:
 *                       type: integer
 *                     items_per_page:
 *                       type: integer
 *   post:
 *     summary: Create new car listing
 *     tags: [Cars]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Car'
 *     responses:
 *       201:
 *         description: Car created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Car'
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Not authenticated
 * 
 * /api/cars/{id}:
 *   get:
 *     summary: Get car by ID
 *     tags: [Cars]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Car details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Car'
 *       404:
 *         description: Car not found
 *   put:
 *     summary: Update car listing
 *     tags: [Cars]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Car'
 *     responses:
 *       200:
 *         description: Car updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Car'
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Car not found
 *   delete:
 *     summary: Delete car listing
 *     tags: [Cars]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Car deleted successfully
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Car not found
 * 
 * /api/cars/{id}/images:
 *   post:
 *     summary: Upload images for car
 *     tags: [Cars]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *               primary_image_index:
 *                 type: integer
 *                 description: Index of the primary image (0-based)
 *     responses:
 *       200:
 *         description: Images uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Car'
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Car not found
 * 
 * /api/cars/{id}/similar:
 *   get:
 *     summary: Get similar cars
 *     tags: [Cars]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 4
 *     responses:
 *       200:
 *         description: List of similar cars
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Car'
 *       404:
 *         description: Car not found
 * 
 * /api/cars/brands:
 *   get:
 *     summary: Get all car brands
 *     tags: [Cars]
 *     responses:
 *       200:
 *         description: List of brands
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Brand'
 * 
 * /api/cars/categories:
 *   get:
 *     summary: Get all car categories
 *     tags: [Cars]
 *     responses:
 *       200:
 *         description: List of categories
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Category'
 * 
 * /api/auth/register:
 *   post:
 *     summary: Register new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserResponse'
 *       400:
 *         description: Invalid input
 * 
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserResponse'
 *       401:
 *         description: Invalid credentials
 * 
 * /api/auth/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Auth]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: User profile
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Not authenticated
 * 
 * /api/wishlist:
 *   get:
 *     summary: Get user's wishlist
 *     tags: [Wishlist]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: User's wishlist
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/WishlistItem'
 *       401:
 *         description: Not authenticated
 *   post:
 *     summary: Add car to wishlist
 *     tags: [Wishlist]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [car_id]
 *             properties:
 *               car_id:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Car added to wishlist
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WishlistItem'
 *       400:
 *         description: Invalid input or car already in wishlist
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: Car not found
 * 
 * /api/wishlist/{carId}:
 *   delete:
 *     summary: Remove car from wishlist
 *     tags: [Wishlist]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: carId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Car removed from wishlist
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: Car not found in wishlist
 */

module.exports = swaggerJsdoc(options);