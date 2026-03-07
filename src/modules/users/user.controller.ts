import type { Request, Response } from 'express';
import { UnauthorizedError } from '../../middlewares/error-handler';
import { userService } from './user.service';
import {
  validateChangePassword,
  validateUpdateMyProfile,
} from './user.validator';

// ===============================================
// ⭐️ 유저 관련 Utility
// ===============================================
// 1) 요청에서 유저 ID 추출
const getUserId = (req: Request): string => {
  const userId = req.user?.id;
  if (!userId) throw new UnauthorizedError('로그인이 필요합니다');
  return userId;
};

// ===============================================
// ⭐️ 유저 관련 Controller
// ===============================================
const userController = {
  // 1) 내 프로필 업데이트
  async updateMyProfile(req: Request, res: Response): Promise<void> {
    const userId = getUserId(req);
    const input = validateUpdateMyProfile(req.body);
    const result = await userService.updateMyProfile(userId, input, req.file);

    res.status(200).json(result);
  },
  // 2) 비밀번호 변경
  async changePassword(req: Request, res: Response): Promise<void> {
    const userId = getUserId(req);
    const input = validateChangePassword(req.body);
    const result = await userService.changePassword(userId, input);

    res.status(200).json(result);
  },
};

export default userController;
