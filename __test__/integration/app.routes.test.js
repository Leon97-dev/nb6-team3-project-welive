const request = require('supertest');
const { app } = require('../../dist/app');

describe('app integration', () => {
  test('GET /api/health returns server health', async () => {
    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('서버 연결 성공');
    expect(typeof res.body.timestamp).toBe('string');
  });

  test('GET /api/unknown returns 404 not found payload', async () => {
    const res = await request(app).get('/api/unknown');

    expect(res.status).toBe(404);
    expect(res.body).toEqual({
      message: '요청한 리소스를 찾을 수 없습니다',
    });
  });

  test('POST /api/auth/logout requires auth', async () => {
    const res = await request(app).post('/api/auth/logout');

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('로그인이 필요합니다');
  });

  test('GET /api/notifications/unread requires auth', async () => {
    const res = await request(app).get('/api/notifications/unread');

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('로그인이 필요합니다');
  });
});

