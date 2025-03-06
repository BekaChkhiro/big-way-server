const request = require('supertest');
const app = require('../../index');
const { setupTestDb, teardownTestDb } = require('./setup');
const UserModel = require('../../models/user.model');
const CarModel = require('../../models/car.model');
const WishlistModel = require('../../models/wishlist.model');

describe('Wishlist Routes', () => {
  let authToken;
  let testUser;
  let testCar;

  beforeAll(async () => {
    await setupTestDb();

    // Create test user
    testUser = await UserModel.create({
      username: 'wishlistuser',
      email: 'wishlist@test.com',
      password: 'password123'
    });

    // Login to get auth token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'wishlist@test.com',
        password: 'password123'
      });

    authToken = loginResponse.body.token;

    // Create a test car
    testCar = await CarModel.create({
      brand_id: 1,
      category_id: 1,
      model: 'Test Car',
      year: 2023,
      price: 25000,
      description: 'Test car for wishlist',
      engine_type: 'Gasoline',
      transmission: 'Automatic',
      fuel_type: 'Gasoline',
      mileage: 0,
      engine_size: 2.0,
      horsepower: 200,
      doors: 4,
      color: 'Red',
      body_type: 'Sedan',
      city: 'Test City',
      state: 'Test State',
      country: 'Test Country'
    }, testUser.id);
  });

  afterAll(async () => {
    await teardownTestDb();
  });

  beforeEach(async () => {
    // Clear wishlist before each test
    await WishlistModel.deleteAll();
  });

  describe('GET /api/wishlist', () => {
    it('should return empty wishlist when no cars are added', async () => {
      const response = await request(app)
        .get('/api/wishlist')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBe(0);
    });

    it('should return cars in wishlist', async () => {
      await WishlistModel.addToWishlist(testUser.id, testCar.id);

      const response = await request(app)
        .get('/api/wishlist')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBe(1);
      expect(response.body[0].id).toBe(testCar.id);
    });
  });

  describe('POST /api/wishlist/:carId', () => {
    it('should add car to wishlist', async () => {
      const response = await request(app)
        .post(`/api/wishlist/${testCar.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Car added to wishlist successfully');

      // Verify car was added
      const isInWishlist = await WishlistModel.isInWishlist(testUser.id, testCar.id);
      expect(isInWishlist).toBe(true);
    });

    it('should not add same car twice', async () => {
      // Add car first time
      await WishlistModel.addToWishlist(testUser.id, testCar.id);

      // Try to add again
      const response = await request(app)
        .post(`/api/wishlist/${testCar.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body).toHaveProperty('message', 'Car is already in wishlist');
    });
  });

  describe('DELETE /api/wishlist/:carId', () => {
    it('should remove car from wishlist', async () => {
      // Add car first
      await WishlistModel.addToWishlist(testUser.id, testCar.id);

      const response = await request(app)
        .delete(`/api/wishlist/${testCar.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Car removed from wishlist successfully');

      // Verify car was removed
      const isInWishlist = await WishlistModel.isInWishlist(testUser.id, testCar.id);
      expect(isInWishlist).toBe(false);
    });

    it('should return 404 for non-existent car in wishlist', async () => {
      const response = await request(app)
        .delete(`/api/wishlist/${testCar.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('message', 'Car not found in wishlist');
    });
  });

  describe('GET /api/wishlist/:carId/check', () => {
    it('should return true for car in wishlist', async () => {
      await WishlistModel.addToWishlist(testUser.id, testCar.id);

      const response = await request(app)
        .get(`/api/wishlist/${testCar.id}/check`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('isInWishlist', true);
    });

    it('should return false for car not in wishlist', async () => {
      const response = await request(app)
        .get(`/api/wishlist/${testCar.id}/check`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('isInWishlist', false);
    });
  });
});