/**
 * @name Superstruct-Validation
 * @category Middleware
 * @description
 * Superstruct를 사용하여 요청의 body, query, params를 검증하는 미들웨어입니다.
 * 스키마에 맞지 않는 요청은 ValidationError로 처리됩니다.
 * @warning
 * 각 라우터에서 필요한 스키마를 정의하고 이 미들웨어를 적용해야 합니다.
 * 만약 수정이 필요하면 validate 함수 내부의 로직을 참고하여 필요한 부분을 조정하세요.
 */

import type { Request, Response, NextFunction } from 'express';
import type { Struct } from 'superstruct';
import { create as superstructCreate } from 'superstruct';
import { ValidationError } from './error-handler';

// 1) 검증 대상 타입 정의
type Target = 'body' | 'query' | 'params';

// 2) 공통 검증 미들웨어
export const validate =
  <T>(schema: Struct<T>, target: Target = 'body') =>
  (req: Request, _res: Response, next: NextFunction) => {
    // 2-1) 검증 대상 데이터 선택
    const data =
      target === 'body'
        ? req.body
        : target === 'query'
          ? typeof req.query === 'string'
            ? {}
            : req.query
          : req.params;

    try {
      // 2-2) Superstruct로 검증 및 타입 덮어씌우기
      const result = superstructCreate(data, schema);

      // 2-3) 검증된 데이터를 원본 객체에 덮어씌우기
      if (target === 'body') {
        req.body = result;
      } else if (target === 'query') {
        req.query = result as any;
      } else if (target === 'params') {
        const paramsObj = req.params || {};
        Object.assign(paramsObj as any, result);
      }

      next();
    } catch (error) {
      next(new ValidationError('잘못된 요청입니다'));
    }
  };

// 3) 타입을 덮어씌우는 body 전용 래퍼
export const validateBody =
  <T>(schema: Struct<T>) =>
  (req: Request, res: Response, next: NextFunction) =>
    validate<T>(schema, 'body')(req, res, next);

// 4) 타입을 덮어씌우는 query 전용 래퍼
export const validateQuery =
  <T>(schema: Struct<T>) =>
  (req: Request, res: Response, next: NextFunction) =>
    validate<T>(schema, 'query')(req, res, next);

// 5) 타입을 덮어씌우는 params 전용 래퍼
export const validateParams =
  <T>(schema: Struct<T>) =>
  (req: Request, res: Response, next: NextFunction) =>
    validate<T>(schema, 'params')(req, res, next);
