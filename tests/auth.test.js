const request = require('supertest');
const app = require('../server');
const { query } = require('../db');
const bcrypt = require('bcrypt');

describe('Authentication System', () => {
  beforeAll(async () => {
    // Create a test user
    const hashedPassword = await bcrypt.hash('test123', 10);
    await query(
      'INSERT INTO users (name, email, password, role_id, is_active) VALUES (?, ?, ?, ?, ?)',
      ['Test User', 'test@example.com', hashedPassword, 4, true]
    );
  });

  afterAll(async () => {
    // Clean up test data
    await query('DELETE FROM users WHERE email = ?', ['test@example.com']);
  });

  describe('GET /auth/login', () => {
    test('should return login page', async () => {
      const response = await request(app).get('/auth/login');
      expect(response.statusCode).toBe(200);
      expect(response.text).toContain('Login');
    });
  });

  describe('POST /auth/login', () => {
    test('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'test123'
        });
      
      expect(response.statusCode).toBe(302);
      expect(response.headers.location).toBe('/dashboard');
    });

    test('should reject invalid credentials', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        });
      
      expect(response.statusCode).toBe(200);
      expect(response.text).toContain('Invalid credentials');
    });
  });
});