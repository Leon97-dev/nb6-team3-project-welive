/**
 * @name RequestId-Logging
 * @category Middleware
 * @description
 * 모든 요청에 고유한 requestId를 부여하는 미들웨어입니다.
 * 이 requestId는 로깅 및 트래킹에 활용됩니다.
 * @warning
 * 건들 필요 없습니다.
 */

import type { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

// 1) requestId 미들웨어 함수 정의
export function requestIdMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  req.requestId = randomUUID();

  next();
}
