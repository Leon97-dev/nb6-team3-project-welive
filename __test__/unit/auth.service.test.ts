import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from '../../src/middlewares/error-handler';
import { authService } from '../../src/modules/auth/auth.service';
import { authRepository } from '../../src/modules/auth/auth.repository';
import {
  comparePassword,
  createAccessToken,
  createRefreshToken,
  hashPassword,
  verifyRefreshToken,
} from '../../src/modules/auth/auth.token';

jest.mock('../../src/modules/auth/auth.repository', () => ({
  authRepository: {
    findApartmentByName: jest.fn(),
    findUserForConflictCheck: jest.fn(),
    createUser: jest.fn(),
    findUserByLoginKey: jest.fn(),
    findBoardIdsByApartmentId: jest.fn(),
    createAuthSession: jest.fn(),
    findActiveAuthSession: jest.fn(),
    revokeAuthSession: jest.fn(),
    findUserById: jest.fn(),
  },
}));

jest.mock('../../src/modules/auth/auth.token', () => ({
  comparePassword: jest.fn(),
  createAccessToken: jest.fn(),
  createRefreshToken: jest.fn(),
  hashPassword: jest.fn(),
  refreshTokenMaxAgeMs: 7 * 24 * 60 * 60 * 1000,
  verifyRefreshToken: jest.fn(),
}));

const mockedRepo = authRepository as jest.Mocked<typeof authRepository>;
const mockedComparePassword = comparePassword as jest.MockedFunction<
  typeof comparePassword
>;
const mockedCreateAccessToken = createAccessToken as jest.MockedFunction<
  typeof createAccessToken
>;
const mockedCreateRefreshToken = createRefreshToken as jest.MockedFunction<
  typeof createRefreshToken
>;
const mockedHashPassword = hashPassword as jest.MockedFunction<
  typeof hashPassword
>;
const mockedVerifyRefreshToken = verifyRefreshToken as jest.MockedFunction<
  typeof verifyRefreshToken
>;

describe('authService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('signupUser', () => {
    it('회원가입 성공 시 명세 응답 형태로 반환한다', async () => {
      mockedRepo.findApartmentByName.mockResolvedValue({
        id: 'ap-1',
        name: '위리브',
        apartmentStatus: 'APPROVED',
        startDongNumber: 101,
        endDongNumber: 120,
        startHoNumber: 1,
        endHoNumber: 8,
      });
      mockedRepo.findUserForConflictCheck.mockResolvedValue(null);
      mockedHashPassword.mockResolvedValue('hashed-password');
      mockedRepo.createUser.mockResolvedValue({
        id: 'user-1',
        name: '홍길동',
        email: 'test@example.com',
        role: 'USER',
        approvalStatus: 'PENDING',
        isActive: true,
      });

      const result = await authService.signupUser({
        username: 'user1',
        password: 'pass1234!',
        contact: '01012345678',
        name: '홍길동',
        email: 'test@example.com',
        apartmentName: '위리브',
        apartmentDong: '101',
        apartmentHo: '1001',
        role: 'USER',
      });

      expect(result).toEqual({
        id: 'user-1',
        name: '홍길동',
        email: 'test@example.com',
        joinStatus: 'PENDING',
        isActive: true,
        role: 'USER',
      });
      expect(mockedRepo.createUser).toHaveBeenCalledWith(
        expect.objectContaining({
          role: 'USER',
          apartmentId: 'ap-1',
          building: '101',
          unitNumber: '1001',
          passwordHash: 'hashed-password',
        })
      );
    });

    it('아파트가 없으면 NotFoundError를 던진다', async () => {
      mockedRepo.findApartmentByName.mockResolvedValue(null);

      await expect(
        authService.signupUser({
          username: 'user1',
          password: 'pass1234!',
          contact: '01012345678',
          name: '홍길동',
          email: 'test@example.com',
          apartmentName: '없는아파트',
          apartmentDong: '101',
          apartmentHo: '1001',
          role: 'USER',
        })
      ).rejects.toBeInstanceOf(NotFoundError);
    });

    it('중복 사용자면 ConflictError를 던진다', async () => {
      mockedRepo.findApartmentByName.mockResolvedValue({
        id: 'ap-1',
        name: '위리브',
        apartmentStatus: 'APPROVED',
        startDongNumber: 101,
        endDongNumber: 120,
        startHoNumber: 1,
        endHoNumber: 8,
      });
      mockedRepo.findUserForConflictCheck.mockResolvedValue({
        id: 'u-2',
        username: 'dup',
        email: 'dup@example.com',
        contact: '01000000000',
      });

      await expect(
        authService.signupUser({
          username: 'dup',
          password: 'pass1234!',
          contact: '01012345678',
          name: '홍길동',
          email: 'test@example.com',
          apartmentName: '위리브',
          apartmentDong: '101',
          apartmentHo: '1001',
          role: 'USER',
        })
      ).rejects.toBeInstanceOf(ConflictError);
    });
  });

  describe('login', () => {
    it('승인된 활성 사용자면 토큰과 사용자 정보를 반환한다', async () => {
      mockedRepo.findUserByLoginKey.mockResolvedValue({
        id: 'user-1',
        username: 'user1',
        passwordHash: 'hashed-password',
        name: '홍길동',
        email: 'test@example.com',
        contact: '01012345678',
        role: 'USER',
        approvalStatus: 'APPROVED',
        isActive: true,
        apartmentId: 'ap-1',
        apartment: { id: 'ap-1', name: '위리브' },
        building: '101',
        profileImageUrl: null,
      } as any);
      mockedComparePassword.mockResolvedValue(true);
      mockedCreateRefreshToken.mockReturnValue('refresh-token');
      mockedHashPassword.mockResolvedValue('hashed-refresh');
      mockedCreateAccessToken.mockReturnValue('access-token');
      mockedRepo.findBoardIdsByApartmentId.mockResolvedValue({
        COMPLAINT: 'b1',
        NOTICE: 'b2',
        POLL: 'b3',
      });

      const result = await authService.login({
        username: 'user1',
        password: 'pass1234!',
      });

      expect(result.accessToken).toBe('access-token');
      expect(result.refreshToken).toBe('refresh-token');
      expect(result.user.joinStatus).toBe('APPROVED');
      expect(mockedRepo.createAuthSession).toHaveBeenCalled();
    });

    it('승인되지 않은 사용자는 로그인 불가', async () => {
      mockedRepo.findUserByLoginKey.mockResolvedValue({
        id: 'user-1',
        username: 'user1',
        passwordHash: 'hashed-password',
        name: '홍길동',
        email: 'test@example.com',
        contact: '01012345678',
        role: 'USER',
        approvalStatus: 'PENDING',
        isActive: true,
        apartmentId: 'ap-1',
        apartment: { id: 'ap-1', name: '위리브' },
        building: '101',
        profileImageUrl: null,
      } as any);
      mockedComparePassword.mockResolvedValue(true);

      await expect(
        authService.login({ username: 'user1', password: 'pass1234!' })
      ).rejects.toBeInstanceOf(ForbiddenError);
    });
  });

  describe('refresh', () => {
    it('유효한 리프레시 토큰이면 새 토큰을 발급한다', async () => {
      mockedVerifyRefreshToken.mockReturnValue({
        sub: 'user-1',
        sid: 'session-1',
        type: 'refresh',
      });
      mockedRepo.findActiveAuthSession.mockResolvedValue({
        id: 'session-1',
        userId: 'user-1',
        refreshTokenHash: 'hashed-refresh',
        expiresAt: new Date(Date.now() + 1000 * 60 * 60),
        revokedAt: null,
      } as any);
      mockedComparePassword.mockResolvedValue(true);
      mockedRepo.findUserById.mockResolvedValue({
        id: 'user-1',
        role: 'USER',
        approvalStatus: 'APPROVED',
        isActive: true,
        apartmentId: 'ap-1',
        building: '101',
      } as any);
      mockedCreateRefreshToken.mockReturnValue('next-refresh-token');
      mockedHashPassword.mockResolvedValue('next-hash');
      mockedCreateAccessToken.mockReturnValue('next-access-token');

      const result = await authService.refresh('refresh-token');

      expect(result).toEqual({
        accessToken: 'next-access-token',
        refreshToken: 'next-refresh-token',
      });
      expect(mockedRepo.revokeAuthSession).toHaveBeenCalledWith('session-1');
    });
  });
});
