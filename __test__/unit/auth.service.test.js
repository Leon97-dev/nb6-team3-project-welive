const mockAuthRepository = {
  signupUser: jest.fn(),
  signupAdmin: jest.fn(),
  login: jest.fn(),
  createSession: jest.fn(),
  updateSessionToken: jest.fn(),
  logoutBySession: jest.fn(),
  logoutByUser: jest.fn(),
  findValidSession: jest.fn(),
  findUserById: jest.fn(),
  updateAdmin: jest.fn(),
  updateAdminStatus: jest.fn(),
  updateAllAdminsStatus: jest.fn(),
  deleteAdmin: jest.fn(),
  cleanupRejectedAdmins: jest.fn(),
  cleanupRejectedResidents: jest.fn(),
  updateResidentStatus: jest.fn(),
  updateAllResidentsStatus: jest.fn(),
};

jest.mock('../../dist/modules/auth/auth.repository', () => ({
  __esModule: true,
  default: mockAuthRepository,
}));

jest.mock('../../dist/modules/auth/auth.token', () => ({
  ACCESS_TOKEN_COOKIE: 'access_token',
  REFRESH_TOKEN_COOKIE: 'refresh_token',
  accessCookieOptions: { httpOnly: true },
  refreshCookieOptions: { httpOnly: true },
  accessTokenMaxAgeMs: 900000,
  refreshTokenMaxAgeMs: 604800000,
  createAccessToken: jest.fn(),
  createRefreshToken: jest.fn(),
  hashToken: jest.fn(),
  verifyRefreshToken: jest.fn(),
}));

const authService = require('../../dist/modules/auth/auth.service').default;
const authRepository =
  require('../../dist/modules/auth/auth.repository').default;
const authToken = require('../../dist/modules/auth/auth.token');

describe('authService', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    authToken.createAccessToken.mockReturnValue('access-token');
    authToken.createRefreshToken.mockReturnValue('refresh-token');
    authToken.hashToken.mockImplementation((token) => `hash:${token}`);
    authToken.verifyRefreshToken.mockReturnValue({
      sub: 'user-1',
      sid: 'session-1',
      type: 'refresh',
    });
  });

  test('signupUser delegates to repository', async () => {
    const payload = { username: 'u', password: 'p' };
    const expected = { id: 'u1' };
    authRepository.signupUser.mockResolvedValue(expected);

    await expect(authService.signupUser(payload)).resolves.toBe(expected);
    expect(authRepository.signupUser).toHaveBeenCalledWith(payload);
  });

  test('signupAdmin delegates to repository', async () => {
    const payload = { username: 'admin', password: 'p' };
    const expected = { id: 'a1', apartmentId: 'apt1' };
    authRepository.signupAdmin.mockResolvedValue(expected);

    await expect(authService.signupAdmin(payload)).resolves.toBe(expected);
    expect(authRepository.signupAdmin).toHaveBeenCalledWith(payload);
  });

  test('login creates session and issues tokens', async () => {
    const payload = { username: 'leon', password: 'leon1234@' };
    authRepository.login.mockResolvedValue({
      userId: 'user-1',
      user: {
        id: 'user-1',
        role: 'USER',
        apartmentId: 'apt-1',
        residentDong: '101',
      },
    });
    authRepository.createSession.mockResolvedValue({ id: 'session-1' });

    authToken.createRefreshToken.mockReturnValueOnce('refresh-login-token');
    authToken.createAccessToken.mockReturnValueOnce('access-login-token');

    const req = {
      get: jest.fn((name) =>
        name === 'user-agent' ? 'jest-agent' : undefined
      ),
      headers: {
        'x-forwarded-for': '10.1.2.3, 127.0.0.1',
      },
      ip: '127.0.0.1',
    };

    const result = await authService.login(payload, req);

    expect(authRepository.login).toHaveBeenCalledWith(payload);
    expect(authRepository.createSession).toHaveBeenCalledWith(
      'user-1',
      'pending-hash',
      expect.any(Date),
      {
        userAgent: 'jest-agent',
        ipAddress: '10.1.2.3',
      }
    );
    expect(authRepository.updateSessionToken).toHaveBeenCalledWith(
      'session-1',
      'hash:refresh-login-token',
      expect.any(Date)
    );
    expect(authToken.createAccessToken).toHaveBeenCalledWith({
      sub: 'user-1',
      role: 'USER',
      apartmentId: 'apt-1',
      building: '101',
    });
    expect(result).toEqual({
      user: {
        id: 'user-1',
        role: 'USER',
        apartmentId: 'apt-1',
        residentDong: '101',
      },
      accessToken: 'access-login-token',
      refreshToken: 'refresh-login-token',
    });
  });

  test('logout uses session revoke when refresh token is valid', async () => {
    const req = {
      cookies: { refresh_token: 'refresh-cookie' },
      user: { id: 'user-1' },
    };

    authToken.verifyRefreshToken.mockReturnValueOnce({
      sub: 'user-1',
      sid: 'session-9',
      type: 'refresh',
    });

    await authService.logout(req);

    expect(authRepository.logoutBySession).toHaveBeenCalledWith('session-9');
    expect(authRepository.logoutByUser).not.toHaveBeenCalled();
  });

  test('logout falls back to user revoke when token verification fails', async () => {
    const req = {
      cookies: { refresh_token: 'broken-token' },
      user: { id: 'user-1' },
    };

    authToken.verifyRefreshToken.mockImplementationOnce(() => {
      throw new Error('invalid');
    });

    await authService.logout(req);

    expect(authRepository.logoutBySession).not.toHaveBeenCalled();
    expect(authRepository.logoutByUser).toHaveBeenCalledWith('user-1');
  });

  test('refresh throws when refresh token cookie is missing', async () => {
    await expect(authService.refresh({ cookies: {} })).rejects.toThrow(
      '리프레시 토큰이 제공되지 않았습니다'
    );
  });

  test('refresh throws when session is invalid', async () => {
    authRepository.findValidSession.mockResolvedValueOnce(null);

    await expect(
      authService.refresh({
        cookies: { refresh_token: 'old-refresh-token' },
      })
    ).rejects.toThrow('유효한 세션이 존재하지 않습니다');
  });

  test('refresh throws when refresh token hash mismatches', async () => {
    authRepository.findValidSession.mockResolvedValueOnce({
      id: 'session-1',
      refreshTokenHash: 'hash:another-token',
    });

    await expect(
      authService.refresh({
        cookies: { refresh_token: 'old-refresh-token' },
      })
    ).rejects.toThrow('리프레시 토큰이 유효하지 않습니다');
  });

  test('refresh throws when user is deleted or missing', async () => {
    authRepository.findValidSession.mockResolvedValueOnce({
      id: 'session-1',
      refreshTokenHash: 'hash:old-refresh-token',
    });
    authRepository.findUserById.mockResolvedValueOnce(null);

    await expect(
      authService.refresh({
        cookies: { refresh_token: 'old-refresh-token' },
      })
    ).rejects.toThrow('사용자를 찾을 수 없습니다');
  });

  test('refresh rotates refresh token and returns new access token', async () => {
    authRepository.findValidSession.mockResolvedValueOnce({
      id: 'session-1',
      refreshTokenHash: 'hash:old-refresh-token',
    });
    authRepository.findUserById.mockResolvedValueOnce({
      id: 'user-1',
      role: 'ADMIN',
      apartmentId: 'apt-1',
      building: '102',
      deletedAt: null,
    });

    authToken.createRefreshToken.mockReturnValueOnce('new-refresh-token');
    authToken.createAccessToken.mockReturnValueOnce('new-access-token');

    const result = await authService.refresh({
      cookies: { refresh_token: 'old-refresh-token' },
    });

    expect(authRepository.updateSessionToken).toHaveBeenCalledWith(
      'session-1',
      'hash:new-refresh-token',
      expect.any(Date)
    );
    expect(authToken.createAccessToken).toHaveBeenCalledWith({
      sub: 'user-1',
      role: 'ADMIN',
      apartmentId: 'apt-1',
      building: '102',
    });
    expect(result).toEqual({
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
    });
  });

  test('updateAdmin rejects non-super-admin', () => {
    const actor = { id: 'admin-2', role: 'ADMIN' };

    expect(() => authService.updateAdmin(actor, 'admin-1', {})).toThrow(
      '관리자 정보 업데이트는 슈퍼 관리자만 수행할 수 있습니다'
    );
  });

  test('updateAdmin allows super-admin and delegates', async () => {
    const actor = { id: 'super-1', role: 'SUPER_ADMIN' };
    const payload = { name: '관리자 수정' };
    const expected = { adminId: 'admin-1' };
    authRepository.updateAdmin.mockResolvedValue(expected);

    await expect(
      authService.updateAdmin(actor, 'admin-1', payload)
    ).resolves.toBe(expected);
    expect(authRepository.updateAdmin).toHaveBeenCalledWith('admin-1', payload);
  });

  test('approval/cleanup resident/admin methods delegate', async () => {
    const superActor = { id: 'super-1', role: 'SUPER_ADMIN' };
    const adminActor = { id: 'admin-1', role: 'ADMIN', apartmentId: 'apt-1' };
    const payload = { status: 'APPROVED' };

    authRepository.updateAdminStatus.mockResolvedValue({
      adminId: 'a1',
      status: 'APPROVED',
    });
    authRepository.updateAllAdminsStatus.mockResolvedValue({
      updated: 3,
      status: 'APPROVED',
    });
    authRepository.deleteAdmin.mockResolvedValue({ adminId: 'a1' });
    authRepository.cleanupRejectedAdmins.mockResolvedValue({ cleaned: 2 });
    authRepository.cleanupRejectedResidents.mockResolvedValue({ cleaned: 7 });
    authRepository.updateResidentStatus.mockResolvedValue({
      residentId: 'r1',
      status: 'APPROVED',
    });
    authRepository.updateAllResidentsStatus.mockResolvedValue({
      updated: 10,
      status: 'APPROVED',
    });

    await expect(
      authService.updateAdminStatus(superActor, 'a1', payload)
    ).resolves.toEqual({
      adminId: 'a1',
      status: 'APPROVED',
    });
    await expect(
      authService.updateAllAdminsStatus(superActor, payload)
    ).resolves.toEqual({
      updated: 3,
      status: 'APPROVED',
    });
    await expect(authService.deleteAdmin(superActor, 'a1')).resolves.toEqual({
      adminId: 'a1',
    });
    await expect(
      authService.cleanupRejectedAccounts(superActor)
    ).resolves.toEqual({ cleaned: 2 });
    await expect(
      authService.cleanupRejectedAccounts(adminActor)
    ).resolves.toEqual({ cleaned: 7 });
    await expect(
      authService.updateResidentStatus(adminActor, 'r1', payload)
    ).resolves.toEqual({
      residentId: 'r1',
      status: 'APPROVED',
    });
    await expect(
      authService.updateAllResidentsStatus(adminActor, payload)
    ).resolves.toEqual({
      updated: 10,
      status: 'APPROVED',
    });
  });

  test('getCookieNames returns token and cookie metadata', () => {
    expect(authService.getCookieNames()).toEqual({
      access: 'access_token',
      refresh: 'refresh_token',
      accessMaxAge: 900000,
      refreshMaxAge: 604800000,
      accessCookieOptions: { httpOnly: true },
      refreshCookieOptions: { httpOnly: true },
    });
  });
});
