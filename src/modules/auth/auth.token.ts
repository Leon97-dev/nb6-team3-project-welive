import { Role } from '@prisma/client';
import { ENV } from '../../config/env';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

// ===============================================
// ⭐️ 토큰 관련 Utility
// ===============================================
// 1) 토큰 페이로드 인터페이스 정의
export interface AccessTokenPayload {
  sub: string;
  role: Role;
  apartmentId: string | null;
  building: string | null;
}

export interface RefreshTokenPayload {
  sub: string;
  sid: string;
  type: 'refresh';
}

// 2) 기간 문자열을 밀리초로 변환하는 함수
const parseDurationToMs = (value: string): number => {
  // 2-1) 숫자와 단위를 추출하는 정규 표현식 (예: '15m' -> 15, 'm')
  const match = value.match(/^(\d+)([smhd])$/i);
  // 2-2) 형식이 올바르지 않은 경우 기본값으로 15분 반환 (900,000ms)
  if (!match) return 15 * 60 * 1000;
  // 2-3) 숫자와 단위를 추출하여 밀리초로 변환
  const amount = Number(match[1] ?? 0); // ex) '15M'에서 15 추출
  const unit = (match[2] ?? '').toLowerCase(); // ex) 'M' -> 'm' 추출

  // 2-4) 단위에 따른 밀리초 계산
  if (unit === 's') return amount * 1000; // 1초 = 1,000ms
  if (unit === 'm') return amount * 60 * 1000; // 1분 = 60,000ms
  if (unit === 'h') return amount * 60 * 60 * 1000; // 1시간 = 3,600,000ms
  if (unit === 'd') return amount * 24 * 60 * 60 * 1000; // 1일 = 86,400,000ms

  // 2-5) 단위가 인식되지 않는 경우 기본값으로 15분 반환
  return 15 * 60 * 1000;
};

// 3) 토큰 만료(ms)
export const accessTokenMaxAgeMs = parseDurationToMs(ENV.ACCESS_EXPIRES_IN);
export const refreshTokenMaxAgeMs = parseDurationToMs(ENV.REFRESH_EXPIRES_IN);

// 4) expiresIn 타입 변환
const asExpiresIn = (
  value: string
): NonNullable<jwt.SignOptions['expiresIn']> => {
  return value as NonNullable<jwt.SignOptions['expiresIn']>;
};

// 5) 서명용 만료값
const accessExpiresIn = asExpiresIn(ENV.ACCESS_EXPIRES_IN);
const refreshExpiresIn = asExpiresIn(ENV.REFRESH_EXPIRES_IN);

// ==============================================
// ⭐️ 토큰 생성 및 검증 함수 정의
// ==============================================
// 1) 액세스 토큰 생성
export const createAccessToken = (payload: AccessTokenPayload): string =>
  jwt.sign(payload, ENV.ACCESS_SECRET, {
    expiresIn: accessExpiresIn,
  });

// 2) 리프레시 토큰 생성
export const createRefreshToken = (payload: RefreshTokenPayload): string =>
  jwt.sign(payload, ENV.REFRESH_SECRET, {
    expiresIn: refreshExpiresIn,
  });

// 3) 액세스 토큰 검증
export const verifyAccessToken = (token: string): AccessTokenPayload =>
  jwt.verify(token, ENV.ACCESS_SECRET) as AccessTokenPayload;

// 4) 리프레시 토큰 검증
export const verifyRefreshToken = (token: string): RefreshTokenPayload =>
  jwt.verify(token, ENV.REFRESH_SECRET) as RefreshTokenPayload;

// ==============================================
// ⭐️ 비밀번호 해싱 및 비교 함수 정의
// ==============================================
// 1) bcrypt 라운드 수 상수 정의
const BCRYPT_ROUNDS = 10;

// 2) 비밀번호 해싱
export const hashPassword = (password: string): Promise<string> =>
  bcrypt.hash(password, BCRYPT_ROUNDS);

// 3) 비밀번호 비교
export const comparePassword = (
  password: string,
  hash: string
): Promise<boolean> => bcrypt.compare(password, hash);

// ==============================================
// ⭐️ 쿠키 옵션 정의 (보안 및 유연성 고려)
// ==============================================
export const ACCESS_TOKEN_COOKIE = 'accessToken';
export const REFRESH_TOKEN_COOKIE = 'refreshToken';

// 1) 운영 환경 여부에 따른 Secure 옵션 설정
const secure = ENV.NODE_ENV === 'production';

// 2) 액세스 토큰 쿠키 옵션 정의 (HTTPOnly, Secure, SameSite 설정)
export const accessCookieOptions = {
  httpOnly: true,
  secure,
  sameSite: secure ? ('none' as const) : ('lax' as const),
  maxAge: accessTokenMaxAgeMs,
  path: '/',
};

// 3) 리프레시 토큰 쿠키 옵션 정의 (HTTPOnly, Secure, SameSite 설정)
export const refreshCookieOptions = {
  httpOnly: true,
  secure,
  sameSite: secure ? ('none' as const) : ('lax' as const),
  maxAge: refreshTokenMaxAgeMs,
  path: '/',
};
