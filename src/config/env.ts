/**
 * @name ENV
 * @category Config
 * @description
 * 애플리케이션에서 사용하는 환경변수를 관리하는 모듈입니다.
 * dotenv 라이브러리를 활용하여 .env 파일에서 환경변수를 로드하며,
 * NODE_ENV에 따라 다른 .env 파일을 우선적으로 로드합니다.
 * 또한, 필수 환경변수에 대한 기본값을 제공하여 개발 편의성을 높입니다.
 * @see https://www.npmjs.com/package/dotenv
 * @warning
 * 운영 환경에서는 반드시 필요한 환경변수를 설정해야 하며,
 * 개발용 기본값은 보안에 취약할 수 있으므로 프로덕션에서는 사용하지 않아야 합니다.
 */

import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// 1) NODE_ENV 기본값 설정
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

// 2) .env 파일 로드 (환경별 파일 우선, 없으면 .env fallback)
const envCandidates = [
  `.env.${process.env.NODE_ENV}.local`,
  '.env.local',
  `.env.${process.env.NODE_ENV}`,
  '.env',
];

// 2-1) 각 후보 파일 경로 확인 후 존재하는 첫 번째 파일 로드
for (const envFile of envCandidates) {
  const fullPath = path.resolve(process.cwd(), envFile);
  if (!fs.existsSync(fullPath)) continue;
  dotenv.config({ path: fullPath, override: false });
  break;
}

// 3) 필수 ENV 개발용 폴백 + 운영 실패 처리
const fallback = (key: keyof NodeJS.ProcessEnv, defaultValue: string) => {
  // 3-1) 환경변수가 이미 설정되어 있으면 그대로 사용
  if (process.env[key]) return process.env[key];

  // 3-2) 개발 환경에서는 기본값 사용, 운영 환경에서는 에러 발생
  if (process.env.NODE_ENV !== 'production') {
    console.warn(
      `[ENV] ${key} 값이 설정되지 않아 개발용 기본값(${defaultValue})을 사용합니다`
    );
    return defaultValue;
  }
  // 3-3) 운영 환경에서는 필수값 누락 시 에러 발생
  throw new Error(`환경 변수 ${key} 값이 필요합니다`);
};

// 4) 포트 번호 파싱 및 유효성 검사
const requiredEnv = (key: keyof NodeJS.ProcessEnv) => {
  const value = process.env[key];
  if (value) return value;
  throw new Error(`환경 변수 ${key} 값이 필요합니다`);
};

// 4-1) 포트 번호 파싱 및 유효성 검사
const parsePort = (value: string | undefined, defaultValue = 3000) => {
  if (!value) return defaultValue;

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0 || parsed > 65535) {
    throw new Error(`PORT 값이 유효하지 않습니다: ${value}`);
  }
  return parsed;
};

// 4-2) 로그 레벨 파싱 및 유효성 검사
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const parseLogLevel = (value: string | undefined): LogLevel => {
  if (!value) return 'info';
  if (
    value === 'debug' ||
    value === 'info' ||
    value === 'warn' ||
    value === 'error'
  ) {
    return value;
  }
  console.warn(
    `[ENV] LOG_LEVEL 값(${value})이 유효하지 않아 기본값(info)을 사용합니다`
  );
  return 'info';
};

// 4-3) JWT 관련 환경변수 기본값 제공 (개발 편의성)
const ACCESS_SECRET: string = fallback(
  'ACCESS_SECRET',
  'change-me-access-secret'
);
const REFRESH_SECRET: string = fallback(
  'REFRESH_SECRET',
  'change-me-refresh-secret'
);
const ACCESS_EXPIRES_IN: string = process.env.ACCESS_EXPIRES_IN || '15m';
const REFRESH_EXPIRES_IN: string = process.env.REFRESH_EXPIRES_IN || '7d';
const JWT_SECRET: string = ACCESS_SECRET;
const JWT_EXPIRES_IN: string = ACCESS_EXPIRES_IN;

// 5) ENV 로드
export const ENV = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parsePort(process.env.PORT),
  DATABASE_URL: requiredEnv('DATABASE_URL'),
  ACCESS_SECRET,
  ACCESS_EXPIRES_IN,
  REFRESH_SECRET,
  REFRESH_EXPIRES_IN,
  JWT_SECRET,
  JWT_EXPIRES_IN,
  DEBUG_MODE: process.env.DEBUG_MODE === 'true',
  LOG_LEVEL: parseLogLevel(process.env.LOG_LEVEL),
  PRISMA_QUERY_LOG: process.env.PRISMA_QUERY_LOG === 'true',
};

// 6) 편의용 env 객체 (필요 시 추가)
export const env = {
  nodeEnv: ENV.NODE_ENV,
  port: ENV.PORT,
  clientOrigin: process.env.CLIENT_URL || 'http://localhost:3000',
};
