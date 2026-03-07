import {
  NotFoundError,
  UnauthorizedError,
} from '../../middlewares/error-handler';
import { comparePassword, hashPassword } from '../auth/auth.token';
import type {
  ChangePasswordDto,
  ChangePasswordResponseDto,
  UpdateMyProfileDto,
  UpdateUserInfoResponseDto,
} from './user.dto';
import { userRepository } from './user.repository';

// ===============================================
// ⭐️ 유저 관련 Service
// ===============================================
export const userService = {
  // 1) 내 프로필 업데이트
  async updateMyProfile(
    userId: string,
    input: UpdateMyProfileDto,
    file?: Express.Multer.File
  ): Promise<UpdateUserInfoResponseDto> {
    const user = await userRepository.findUserById(userId);
    if (!user) {
      throw new NotFoundError('사용자를 찾을 수 없습니다');
    }

    const data: { passwordHash?: string; profileImageUrl?: string } = {};

    if (input.newPassword) {
      const matched = await comparePassword(
        input.currentPassword ?? '',
        user.passwordHash
      );
      if (!matched) {
        throw new UnauthorizedError('현재 비밀번호가 일치하지 않습니다');
      }
      data.passwordHash = await hashPassword(input.newPassword);
    }

    if (file) {
      data.profileImageUrl = `/upload/${file.filename}`;
    }

    await userRepository.updateUserById(userId, data);

    return {
      message: `${user.name}님의 정보가 성공적으로 업데이트되었습니다. 다시 로그인해주세요.`,
    };
  },
  // 2) 비밀번호 변경
  async changePassword(
    userId: string,
    input: ChangePasswordDto
  ): Promise<ChangePasswordResponseDto> {
    const user = await userRepository.findUserById(userId);
    if (!user) {
      throw new NotFoundError('사용자를 찾을 수 없습니다');
    }

    const matched = await comparePassword(
      input.currentPassword,
      user.passwordHash
    );
    if (!matched) {
      throw new UnauthorizedError('현재 비밀번호가 일치하지 않습니다');
    }

    const passwordHash = await hashPassword(input.newPassword);
    await userRepository.updateUserById(userId, { passwordHash });

    return {
      message: `${user.name}님의 비밀번호가 변경되었습니다. 다시 로그인해주세요.`,
    };
  },
};
