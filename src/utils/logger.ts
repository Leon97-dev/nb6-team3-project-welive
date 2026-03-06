/**
 * @name Logger-Winston
 * @category Utility
 * @description
 * Winston 라이브러리를 활용한 로깅 유틸리티입니다.
 * 다양한 로그 레벨과 포맷을 지원하며, 개발 및 운영 환경에서 모두 활용됩니다.
 * 로그 레벨은 환경변수 LOG_LEVEL로 제어할 수 있습니다 (예: 'debug', 'info', 'warn', 'error').
 * @see https://www.npmjs.com/package/winston
 * @warning
 * 로그 레벨을 너무 낮게 설정하면 프로덕션에서 과도한 로그가 발생할 수 있으므로 주의해야 합니다.
 * 일반적으로 개발 환경에서는 'debug', 운영 환경에서는 'info' 또는 'warn'으로 설정하는 것을 권장합니다.
 */

import { createLogger, format, transports } from 'winston';
import type { TransformableInfo } from 'logform';
import fs from 'fs';
import path from 'path';

// 1) 로그 디렉토리 설정 및 생성
const { combine, timestamp, printf, colorize, errors } = format;
const logDir = path.join(process.cwd(), 'logs');

if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// 2) 로그 포맷 정의
const humanReadableFormat = printf((info: TransformableInfo) => {
  // 2-1) 로그 정보 구조 분해
  const {
    level,
    message,
    timestamp: ts,
    stack,
    requestId,
    method,
    path,
    user,
    code,
    ...meta
  } = info as TransformableInfo & {
    timestamp?: string;
    stack?: string;
    requestId?: string;
    method?: string;
    path?: string;
    user?: string;
    code?: string;
  };

  // 2-2) 로그 컨텍스트 구성
  const contextParts = [
    requestId ? `req=${requestId}` : '',
    method ? method : '',
    path ? path : '',
    user ? `user=${user}` : '',
    code ? `code=${code}` : '',
  ].filter(Boolean);

  // 2-3) 최종 로그 메시지 구성
  const context = contextParts.length > 0 ? ` [${contextParts.join(' ')}]` : '';

  // 2-4) 메타 정보가 있는 경우 JSON 문자열로 추가
  const extraMeta =
    Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';

  // 2-5) 최종 로그 메시지 구성 (스택 트레이스 포함)
  const base = `[${ts ?? ''}] ${level}:${context} ${String(message)}${extraMeta}`;

  // 2-6) 스택 트레이스가 있는 경우 메시지에 포함하여 반환
  return stack ? `${base}\n${stack}` : base;
});

// 3) 로거 생성
export const logger = createLogger({
  // 3-1) 로그 레벨 설정: 환경변수 LOG_LEVEL 또는 기본값 'info'
  level: process.env.LOG_LEVEL || 'info',
  // 3-2) 로그 포맷 설정: 타임스탬프, 에러 스택 포함, 인간 친화적 포맷
  format: combine(errors({ stack: true })),
  // 3-3) 로그 출력 방식 설정: 콘솔과 파일
  transports: [
    new transports.Console({
      format: combine(
        colorize({ all: true }),
        timestamp(),
        errors({ stack: true }),
        humanReadableFormat
      ),
    }),
    new transports.File({
      filename: path.join(logDir, 'app.log'),
      level: process.env.LOG_LEVEL || 'info',
      format: combine(
        timestamp(),
        errors({ stack: true }),
        humanReadableFormat
      ),
    }),
  ],
});
