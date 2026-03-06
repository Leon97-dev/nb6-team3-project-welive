/**
 * @name AsyncHandler
 * @category Middleware
 * @description
 * 비동기 컨트롤러에서 발생하는 에러를 자동으로 처리하는 미들웨어 함수입니다.
 * 이 함수를 사용하면 각 컨트롤러에서 try-catch 블록을 작성할 필요가 없습니다.
 * @warning
 * 모든 비동기 컨트롤러는 이 asyncHandler로 래핑되어야 합니다.
 * 그렇지 않으면 에러가 제대로 처리되지 않을 수 있습니다.
 */

import type { NextFunction, Request, Response } from 'express';

// 1) 비동기 컨트롤러 타입 정의
type AsyncController = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<unknown> | unknown;

// 2) asyncHandler 함수 정의
const asyncHandler =
  (fn: AsyncController) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

export default asyncHandler;
