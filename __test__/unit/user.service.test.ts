import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { NotFoundError, UnauthorizedError } from '../../src/middlewares/error-handler';
import { userService } from '../../src/modules/users/user.service';
import { userRepository } from '../../src/modules/users/user.repository';
import { comparePassword, hashPassword } from '../../src/modules/auth/auth.token';

jest.mock('../../src/modules/users/user.repository', () => ({
  userRepository: {
    findUserById: jest.fn(),
    updateUserById: jest.fn(),
  },
}));

jest.mock('../../src/modules/auth/auth.token', () => ({
  comparePassword: jest.fn(),
  hashPassword: jest.fn(),
}));

const mockedRepo = userRepository as jest.Mocked<typeof userRepository>;
const mockedComparePassword = comparePassword as jest.MockedFunction<
  typeof comparePassword
>;
const mockedHashPassword = hashPassword as jest.MockedFunction<typeof hashPassword>;

describe('userService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('updateMyProfile', () => {
    it('비밀번호 변경 없이 이미지 업로드만 처리한다', async () => {
      mockedRepo.findUserById.mockResolvedValue({
        id: 'u1',
        name: '홍길동',
        passwordHash: 'hashed-password',
      });
      mockedRepo.updateUserById.mockResolvedValue({
        id: 'u1',
        name: '홍길동',
      });

      const file = { filename: 'avatar.png' } as Express.Multer.File;
      const result = await userService.updateMyProfile('u1', {}, file);

      expect(result.message).toContain('성공적으로 업데이트');
      expect(mockedRepo.updateUserById).toHaveBeenCalledWith('u1', {
        profileImageUrl: '/upload/avatar.png',
      });
    });

    it('새 비밀번호 요청 시 현재 비밀번호가 틀리면 UnauthorizedError를 던진다', async () => {
      mockedRepo.findUserById.mockResolvedValue({
        id: 'u1',
        name: '홍길동',
        passwordHash: 'hashed-password',
      });
      mockedComparePassword.mockResolvedValue(false);

      await expect(
        userService.updateMyProfile('u1', {
          currentPassword: 'wrong-password',
          newPassword: 'new-password-123',
        })
      ).rejects.toBeInstanceOf(UnauthorizedError);
    });

    it('사용자가 없으면 NotFoundError를 던진다', async () => {
      mockedRepo.findUserById.mockResolvedValue(null);

      await expect(userService.updateMyProfile('unknown', {})).rejects.toBeInstanceOf(
        NotFoundError
      );
    });
  });

  describe('changePassword', () => {
    it('비밀번호 변경에 성공한다', async () => {
      mockedRepo.findUserById.mockResolvedValue({
        id: 'u1',
        name: '홍길동',
        passwordHash: 'hashed-password',
      });
      mockedComparePassword.mockResolvedValue(true);
      mockedHashPassword.mockResolvedValue('next-hashed-password');
      mockedRepo.updateUserById.mockResolvedValue({
        id: 'u1',
        name: '홍길동',
      });

      const result = await userService.changePassword('u1', {
        currentPassword: 'old-password',
        newPassword: 'new-password',
      });

      expect(result.message).toContain('비밀번호가 변경되었습니다');
      expect(mockedRepo.updateUserById).toHaveBeenCalledWith('u1', {
        passwordHash: 'next-hashed-password',
      });
    });

    it('현재 비밀번호가 틀리면 UnauthorizedError를 던진다', async () => {
      mockedRepo.findUserById.mockResolvedValue({
        id: 'u1',
        name: '홍길동',
        passwordHash: 'hashed-password',
      });
      mockedComparePassword.mockResolvedValue(false);

      await expect(
        userService.changePassword('u1', {
          currentPassword: 'wrong-password',
          newPassword: 'new-password',
        })
      ).rejects.toBeInstanceOf(UnauthorizedError);
    });
  });
});
