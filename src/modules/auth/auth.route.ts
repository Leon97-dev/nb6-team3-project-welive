import { Router } from 'express';
import asyncHandler from '../../middlewares/async-handler';
import { requireAuth, requireRoles } from '../../middlewares/auth';
import { authController } from './auth.controller';

const router = Router();

// ==============================================
// ⭐️ 인증 관련 Route
// ==============================================
// 1) 회원가입 및 로그인
router.post('/signup', asyncHandler(authController.signupUser));

// 2) 관리자 회원가입
router.post('/signup/admin', asyncHandler(authController.signupAdmin));

// 3) 슈퍼 관리자 회원가입
router.post(
  '/signup/super-admin',
  asyncHandler(authController.signupSuperAdmin)
);

// 4) 로그인
router.post('/login', asyncHandler(authController.login));

// 5) 로그아웃
router.post('/logout', asyncHandler(authController.logout));

// 6) 토큰 갱신
router.post('/refresh', asyncHandler(authController.refresh));

// 7) 관리자 승인/거부
router.patch(
  '/admins/:adminId/status',
  requireAuth,
  requireRoles('SUPER_ADMIN'),
  asyncHandler(authController.updateAdminStatus)
);

// 8) 관리자 일괄 승인/거부
router.patch(
  '/admins/status',
  requireAuth,
  requireRoles('SUPER_ADMIN'),
  asyncHandler(authController.updateAdminStatusBulk)
);

// 9) 주민 승인 상태 업데이트
router.patch(
  '/residents/:residentId/status',
  requireAuth,
  requireRoles('ADMIN'),
  asyncHandler(authController.updateResidentStatus)
);

// 10) 주민 정보 일괄 업데이트
router.patch(
  '/residents/status',
  requireAuth,
  requireRoles('ADMIN'),
  asyncHandler(authController.updateResidentStatusBulk)
);

// 11) 관리자 정보 업데이트
router.patch(
  '/admins/:adminId',
  requireAuth,
  requireRoles('SUPER_ADMIN'),
  asyncHandler(authController.updateAdminInfo)
);

// 12) 관리자 삭제
router.delete(
  '/admins/:adminId',
  requireAuth,
  requireRoles('SUPER_ADMIN'),
  asyncHandler(authController.deleteAdmin)
);

// 13) 거부된 계정 정리
router.post(
  '/cleanup',
  requireAuth,
  requireRoles('SUPER_ADMIN', 'ADMIN'),
  asyncHandler(authController.cleanupRejectedAccounts)
);

export default router;
