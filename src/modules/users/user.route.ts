import { Router } from 'express';
import asyncHandler from '../../middlewares/async-handler';
import { requireAuth } from '../../middlewares/auth';
import { imageUpload } from '../../config/multer';
import userController from './user.controller';

const router = Router();

// ===============================================
// ⭐️ 유저 관련 Route
// ===============================================
// 1) 내 프로필 업데이트
router.patch(
  '/me',
  requireAuth,
  imageUpload.single('file'),
  asyncHandler(userController.updateMyProfile)
);

// 2) 비밀번호 변경
router.patch(
  '/password',
  requireAuth,
  asyncHandler(userController.changePassword)
);

export default router;
