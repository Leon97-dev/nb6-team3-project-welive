/**
 * @name ErrorHandler
 * @category Middleware
 * @description
 * 앱 전체에서 발생하는 에러를 처리하는 전역 에러 핸들러입니다.
 * Prisma, Multer 등 라이브러리 에러도 이곳에서 처리됩니다.
 * 커스텀 AppError 클래스를 기반으로 다양한 HTTP 상태 코드를 지원합니다.
 * @warning
 * 건들 필요 없지만, 수정 필요하면 말해주세요.
 * 로직에 맞는 에러를 던지는 것만 신경 써주세요.
 */

import type { NextFunction, Request, Response } from 'express';
import { isDebugMode } from '../utils/debug';
import { logger } from '../utils/logger';

// 1) 공통 AppError 기반 클래스 정의
export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;
  path: string | null;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.path = null;

    Error.captureStackTrace(this, this.constructor);
  }
}

// 2) 400 에러 클래스: 입력/검증 실패
export class ValidationError extends AppError {
  constructor(
    message = '입력 데이터가 올바르지 않습니다',
    path: string | null = null
  ) {
    super(message, 400);
    this.path = path;
  }
}

// 3) 401 에러 클래스: 인증 실패/권한 없음
export class UnauthorizedError extends AppError {
  constructor(
    message = '비밀번호가 일치하지 않습니다',
    path: string | null = null
  ) {
    super(message, 401);
    this.path = path;
  }
}

// 4) 403 에러 클래스: 권한 거부/접근 금지
export class ForbiddenError extends AppError {
  constructor(message = '권한이 없습니다') {
    super(message, 403);
  }
}

// 5) 404 에러 클래스: 리소스 없음
export class NotFoundError extends AppError {
  constructor(message = '리소스를 찾을 수 없습니다') {
    super(message, 404);
  }
}

// 6) 409 에러 클래스: 중복/충돌
export class ConflictError extends AppError {
  constructor(message = '이미 존재하는 데이터입니다') {
    super(message, 409);
  }
}

// 7) 422 에러 클래스: 검증 실패/처리 불가
export class UnprocessableEntityError extends AppError {
  constructor(message = '요청 데이터를 처리할 수 없습니다') {
    super(message, 422);
  }
}

// 8) 전역 에러 핸들러: 앱 전체 에러 응답 처리
export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  const isProd = process.env.NODE_ENV === 'production';

  // 8-A) winston 로깅 출력
  logger.error(err.message || '서버 에러가 발생했습니다', {
    requestId: req.requestId,
    path: req.path,
    method: req.method,
    user: req.user?.id,
    code: err.code,
    ...(err.isOperational ? {} : { stack: err.stack }),
  });

  // 8-B) 디버그 모드에서만 추가 상세 로그
  if (isDebugMode()) {
    logger.debug('⚠️ 글로벌 에러 상세', { error: err });
  }

  // 8-1) Prisma 에러 처리
  if (err.code === 'P2002') {
    return res.status(409).json({
      message: '이미 존재하는 데이터입니다',
    });
  }

  if (err.code === 'P2003') {
    return res.status(409).json({
      message: '참조 중인 데이터가 있어 처리할 수 없습니다',
    });
  }

  if (err.code === 'P2025') {
    return res.status(404).json({
      message: '리소스를 찾을 수 없습니다',
    });
  }

  // 8-2) Multer 에러 처리 (파일 업로드)
  if (err.name === 'MulterError') {
    return res.status(400).json({
      message: err.message,
    });
  }

  // 8-3) 커스텀 에러 처리
  if (err.isOperational) {
    return res.status(err.statusCode).json({ message: err.message });
  }

  // 8-4) 예상하지 못한 에러 처리 (기본값)
  const statusCode = err.statusCode || 500;
  const message = err.message || '서버 에러가 발생했습니다';
  const response: { message: string; stack?: string } = { message };
  if (!isProd && err.stack) {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

// 9) 404 핸들러: 존재하지 않는 라우트 처리
export const notFoundHandler = (_req: Request, res: Response) => {
  res.status(404).json({
    message: '요청한 리소스를 찾을 수 없습니다',
  });
};
