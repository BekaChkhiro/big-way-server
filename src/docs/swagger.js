const swaggerJsdoc = require('swagger-jsdoc');
const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Big Way API Documentation',
      version: '1.0.0',
      description: 'Documentation for the Big Way car dealership API',
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
            },
            mileage_unit: {
              type: 'string',
              enum: ['km', 'mi'],
            },
            engine_size: {
              type: 'number',
              format: 'float',
            },
            horsepower: {
              type: 'integer',
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
            },
            manufacture_month: {
              type: 'integer',
              minimum: 1,
              maximum: 12,
            },
            color: {
              type: 'string',
            },
            body_type: {
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
            has_seat_heating: {
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
            }
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
            year: {
              type: 'integer',
            },
            price: {
              type: 'number',
            },
            description: {
              type: 'string',
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
            },
            featured: {
              type: 'boolean',
            },
            specifications: {
              $ref: '#/components/schemas/Specifications',
            },
            location: {
              type: 'object',
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
              },
            },
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
          },
        },
        Model: {
          type: 'string',
          description: 'Car model name',
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
              type: 'string'
            },
            last_name: {
              type: 'string'
            },
            age: {
              type: 'integer',
              minimum: 18
            },
            gender: {
              type: 'string',
              enum: ['male', 'female', 'other']
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
 *         name: type
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
 *         description: List of cars
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
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   name:
 *                     type: string
 *                   type:
 *                     type: string
 */

module.exports = swaggerJsdoc(options);