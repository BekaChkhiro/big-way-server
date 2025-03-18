const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Big Way API Documentation',
      version: '1.0.0',
      description: 'Documentation for the Big Way vehicle dealership API',
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
        Transport: {
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
      },
    },
    security: [
      {
        BearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.js'], // Path to the API routes
};

/**
 * @swagger
 * components:
 *   schemas:
 *     Specifications:
 *       type: object
 *       properties:
 *         engine_type:
 *           type: string
 *         transmission:
 *           type: string
 *           enum: [manual, automatic, tiptronic, variator]
 *         fuel_type:
 *           type: string
 *           enum: [
 *             'ბენზინი',
 *             'დიზელი',
 *             'ელექტრო',
 *             'ჰიბრიდი',
 *             'დატენვადი_ჰიბრიდი',
 *             'თხევადი_გაზი',
 *             'ბუნებრივი_გაზი',
 *             'წყალბადი'
 *           ]
 *         mileage:
 *           type: integer
 *         mileage_unit:
 *           type: string
 *           enum: [km, mi]
 *         engine_size:
 *           type: number
 *           format: float
 *         horsepower:
 *           type: integer
 *         doors:
 *           type: integer
 *           enum: [2, 3, 4, 5, 6, 7, 8]
 *         is_turbo:
 *           type: boolean
 *         cylinders:
 *           type: integer
 *         manufacture_month:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *         color:
 *           type: string
 *         body_type:
 *           type: string
 *         steering_wheel:
 *           type: string
 *           enum: [left, right]
 *         drive_type:
 *           type: string
 *           enum: [front, rear, 4x4]
 *         has_catalyst:
 *           type: boolean
 *         airbags_count:
 *           type: integer
 *           minimum: 0
 *           maximum: 12
 *         interior_material:
 *           type: string
 *           enum: ['ნაჭერი', 'ტყავი', 'ხელოვნური ტყავი', 'კომბინირებული', 'ალკანტარა']
 *         interior_color:
 *           type: string
 *           enum: ['შავი', 'თეთრი', 'რუხი', 'ყავისფერი', 'ჩალისფერი', 'წითელი', 'ლურჯი', 'ყვითელი', 'ნარინჯისფერი', 'შინდისფერი', 'ოქროსფერი']
 *         has_hydraulics: {
 *           type: 'boolean'
 *         },
 *         has_board_computer: {
 *           type: 'boolean'
 *         },
 *         has_air_conditioning: {
 *           type: 'boolean'
 *         },
 *         has_parking_control: {
 *           type: 'boolean'
 *         },
 *         has_rear_view_camera: {
 *           type: 'boolean'
 *         },
 *         has_electric_windows: {
 *           type: 'boolean'
 *         },
 *         has_climate_control: {
 *           type: 'boolean'
 *         },
 *         has_cruise_control: {
 *           type: 'boolean'
 *         },
 *         has_start_stop: {
 *           type: 'boolean'
 *         },
 *         has_sunroof: {
 *           type: 'boolean'
 *         },
 *         has_seat_heating: {
 *           type: 'boolean'
 *         },
 *         has_seat_memory: {
 *           type: 'boolean'
 *         },
 *         has_abs: {
 *           type: 'boolean'
 *         },
 *         has_traction_control: {
 *           type: 'boolean'
 *         },
 *         has_central_locking: {
 *           type: 'boolean'
 *         },
 *         has_alarm: {
 *           type: 'boolean'
 *         },
 *         has_fog_lights: {
 *           type: 'boolean'
 *         },
 *         has_navigation: {
 *           type: 'boolean'
 *         },
 *         has_aux: {
 *           type: 'boolean'
 *         },
 *         has_bluetooth: {
 *           type: 'boolean'
 *         },
 *         has_multifunction_steering_wheel: {
 *           type: 'boolean'
 *         },
 *         has_alloy_wheels: {
 *           type: 'boolean'
 *         },
 *         has_spare_tire: {
 *           type: 'boolean'
 *         },
 *         is_disability_adapted: {
 *           type: 'boolean'
 *         }
 *     Transport:
 *       type: object
 *       required:
 *         - brand_id
 *         - category_id
 *         - model
 *         - year
 *         - price
 *       properties:
 *         id:
 *           type: integer
 *         brand_id:
 *           type: integer
 *         category_id:
 *           type: integer
 *         model:
 *           type: string
 *         year:
 *           type: integer
 *         price:
 *           type: number
 *         description:
 *           type: string
 *         description_en: {
 *           type: 'string',
 *           description: 'Car description in English'
 *         },
 *         description_ka: {
 *           type: 'string',
 *           description: 'Car description in Georgian'
 *         },
 *         description_ru: {
 *           type: 'string',
 *           description: 'Car description in Russian'
 *         },
 *         status:
 *           type: string
 *           enum: [available, sold, pending]
 *         featured:
 *           type: boolean
 *         specifications:
 *           $ref: '#/components/schemas/Specifications'
 *         location:
 *           type: object
 *           properties:
 *             city:
 *               type: string
 *             state:
 *               type: string
 *             country:
 *               type: string
 * 
 * /api/transports/search:
 *   get:
 *     summary: Search transports with advanced filters
 *     tags: [Transports]
 *     parameters:
 *       - in: query
 *         name: q
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
 *         name: year_min
 *         schema:
 *           type: integer
 *       - in: query
 *         name: year_max
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
 *         name: engine_type
 *         schema:
 *           type: string
 *       - in: query
 *         name: transmission
 *         schema:
 *           type: string
 *       - in: query
 *         name: fuel_type
 *         schema:
 *           type: string
 *       - in: query
 *         name: mileage_max
 *         schema:
 *           type: integer
 *       - in: query
 *         name: engine_size
 *         schema:
 *           type: number
 *       - in: query
 *         name: is_turbo
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: cylinders
 *         schema:
 *           type: integer
 *       - in: query
 *         name: manufacture_month
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Search results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 cars:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Transport'
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
 * 
 * /api/transports/brands/{brandId}/models:
 *   get:
 *     summary: Get all models for a specific brand
 *     tags: [Transports]
 *     parameters:
 *       - in: path
 *         name: brandId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the brand to get models for
 *     responses:
 *       200:
 *         description: List of models for the brand
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Model'
 *       404:
 *         description: Brand not found
 *       500:
 *         description: Server error
 */

module.exports = swaggerJsdoc(options);