import { Router } from 'express';
import asyncHandler from '../../middlewares/async-handler';
import { requireAuth, requireRoles } from '../../middlewares/auth';
import { apartmentController } from './apartment.controller';

const router = Router();

// ==============================================
// ⭐️ 아파트 관련 Route
// ==============================================
// 1) 공개 아파트 목록 조회
router.get('/public', asyncHandler(apartmentController.getPublicApartments));

// 2) 공개 아파트 ID로 조회
router.get(
  '/public/:id',
  asyncHandler(apartmentController.getPublicApartmentById)
);

// 3) 아파트 목록 조회 (관리자용)
router.get(
  '/',
  requireAuth,
  requireRoles('SUPER_ADMIN', 'ADMIN'),
  asyncHandler(apartmentController.getApartments)
);

// 4) 아파트 ID로 조회 (관리자용)
router.get(
  '/:id',
  requireAuth,
  requireRoles('SUPER_ADMIN', 'ADMIN'),
  asyncHandler(apartmentController.getApartmentById)
);

export default router;
