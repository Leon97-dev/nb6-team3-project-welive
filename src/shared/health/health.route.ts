import { Router } from 'express';
import * as healthController from './health.controller';
import asyncHandler from '../../middlewares/async-handler';

const router = Router();

// 1) 서버 상태 확인
router.get('/', asyncHandler(healthController.checkHealth));

// 2) 데이터베이스 연결 확인
router.get('/db', asyncHandler(healthController.checkDatabase));

export default router;
