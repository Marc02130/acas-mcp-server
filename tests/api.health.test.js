/**
 * Health endpoint tests
 */
const request = require('supertest');
const app = require('../src/index');

describe('Health Check API', () => {
  it('GET /api/health should return status 200 and correct data structure', async () => {
    const response = await request(app).get('/api/health');
    
    // Check status code
    expect(response.statusCode).toBe(200);
    
    // Check content type
    expect(response.headers['content-type']).toMatch(/json/);
    
    // Check structure
    expect(response.body).toHaveProperty('status');
    expect(response.body).toHaveProperty('timestamp');
    expect(response.body).toHaveProperty('uptime');
    
    // Check values
    expect(response.body.status).toBe('ok');
    expect(typeof response.body.uptime).toBe('number');
  });
});

// Test 404 handling
describe('Error Handling', () => {
  it('GET /non-existent-route should return 404 with correct error format', async () => {
    const response = await request(app).get('/non-existent-route');
    
    // Check status code
    expect(response.statusCode).toBe(404);
    
    // Check content type
    expect(response.headers['content-type']).toMatch(/json/);
    
    // Check error structure
    expect(response.body).toHaveProperty('error', true);
    expect(response.body).toHaveProperty('message');
    expect(response.body.message).toContain('not found');
  });
}); 