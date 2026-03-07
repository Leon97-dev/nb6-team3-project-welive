import type { Request, Response, NextFunction } from 'express';
import type { Role } from '@prisma/client';
import {
  ACCESS_TOKEN_COOKIE,
  verifyAccessToken,
} from '../modules/auth/auth.token';
import { ForbiddenError, UnauthorizedError } from './error-handler';

// ==============================================
// ⭐️ 인증 관련 Middleware
// ==============================================
// 1) 인증 선택적 미들웨어 (인증된 사용자 정보가 있으면 req.user에 설정, 없으면 익명 사용자로 처리)
export const optionalAuth = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const authHeader = req.header('authorization');

  const bearerToken = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7)
    : undefined;

  const token = req.cookies?.[ACCESS_TOKEN_COOKIE] || bearerToken;

  if (token) {
    try {
      const payload = verifyAccessToken(token);
      req.user = {
        id: payload.sub,
        role: payload.role,
        apartmentId: payload.apartmentId ?? null,
        building: payload.building ?? null,
      };
    } catch {}
  } else {
    const userId = req.header('x-user-id');
    const role = req.header('x-user-role') as Role | undefined;

    req.user = {
      id: userId || '',
      role: role ?? 'USER',
      apartmentId: null,
      building: null,
    };

    if (!userId) {
      delete req.user;
    }
  }

  next();
};

// 2) 인증 필수 미들웨어
export const requireAuth = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    next(new UnauthorizedError('로그인이 필요합니다'));
    return;
  }

  next();
};

// 3) 역할 기반 접근 제어 미들웨어
export const requireRoles =
  (...roles: Role[]) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new UnauthorizedError('로그인이 필요합니다'));
      return;
    }

    if (!roles.includes(req.user.role)) {
      next(new ForbiddenError('접근 권한이 없습니다'));
      return;
    }

    next();
  };
