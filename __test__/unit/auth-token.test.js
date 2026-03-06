const {
  createAccessToken,
  verifyAccessToken,
  createRefreshToken,
  verifyRefreshToken,
  hashToken,
} = require('../../dist/modules/auth/auth.token');

describe('Auth token utils', () => {
  test('create/verify access token', () => {
    const payload = {
      sub: 'user-1',
      role: 'USER',
      apartmentId: 'apartment-1',
      building: '101',
    };

    const token = createAccessToken(payload);
    const decoded = verifyAccessToken(token);

    expect(decoded.sub).toBe(payload.sub);
    expect(decoded.role).toBe(payload.role);
    expect(decoded.apartmentId).toBe(payload.apartmentId);
    expect(decoded.building).toBe(payload.building);
  });

  test('create/verify refresh token', () => {
    const payload = {
      sub: 'user-1',
      sid: 'session-1',
      type: 'refresh',
    };

    const token = createRefreshToken(payload);
    const decoded = verifyRefreshToken(token);

    expect(decoded.sub).toBe(payload.sub);
    expect(decoded.sid).toBe(payload.sid);
    expect(decoded.type).toBe('refresh');
  });

  test('hashToken is deterministic', () => {
    const token = 'sample-token';
    const hashA = hashToken(token);
    const hashB = hashToken(token);

    expect(hashA).toBe(hashB);
    expect(hashA).not.toBe(token);
  });
});
