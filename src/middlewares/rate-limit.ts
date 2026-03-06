/**
 * @name Express-Rate-Limit
 * @category Middleware
 * @description
 * 클라이언트의 과도한 요청을 방지하기 위한 미들웨어입니다.
 * 1분당 최대 100회로 제한하며, 초과 시 429 Too Many Requests 에러를 반환합니다.
 * @see https://www.npmjs.com/package/express-rate-limit
 * @warning
 * 건들 필요 없습니다.
 */

import { RequestHandler } from 'express';
import rateLimit from 'express-rate-limit';
import { AppError } from './error-handler';

// 1) 요청 제한 설정
const limiter = rateLimit({
  // 1-1) 시간 제한: 1분
  windowMs: 60 * 1000,
  // 1-2) 갯수 제한: 최대 100회
  max: 100,
  // 1-3) 초과 시 에러
  handler: (_req, _res, next) =>
    next(new AppError('잠시 후 다시 시도해주세요', 429)),
});

// 2) 최종 요청 제한 인스턴스
export const RateLimiter: RequestHandler = limiter;
