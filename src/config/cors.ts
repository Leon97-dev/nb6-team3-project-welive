/**
 * @name CORS
 * @category Config
 * @description
 * CORS(Cross-Origin Resource Sharing) 설정을 담당하는 모듈입니다.
 * 허용된 도메인에서만 API 요청을 허용하도록 구성되어 있습니다.
 * @see https://www.npmjs.com/package/cors
 * @warning
 * 허용 도메인 목록은 .env 파일의 CLIENT_URL과 BASE_URL을 기반으로 자동 생성됩니다.
 * 필요에 따라 allowedOrigins 배열에 추가 도메인을 명시적으로 추가할 수 있습니다.
 */

import './env';
import cors from 'cors';

// 1) origin 문자열에서 끝의 슬래시 제거 (예: http://localhost:3000/ -> http://localhost:3000)
const normalizeOrigin = (value: string) => value.replace(/\/+$/, '');

// 2) 허용 origin 목록
const allowedOrigins = new Set(
  [
    // 2-1) .env에서 명시한 프론트 주소
    process.env.CLIENT_URL || 'http://localhost:3000',
    // 2-2) 개발용 주소(필요 시 로컬에서 다른 포트 프론트도 허용)
    'http://localhost:3001',
    // 2-3) 같은 포트에서 테스트할 때를 위한 fallback
    process.env.BASE_URL || 'http://localhost:3000',
  ]
    .filter((origin): origin is string => Boolean(origin))
    .map(normalizeOrigin)
);

// 3) CORS 설정 객체 생성
export const corsOptions = cors({
  origin: (
    origin: string | undefined,
    cb: (err: Error | null, allow?: boolean) => void
  ) => {
    // 3-1) origin이 없는 경우 허용
    if (!origin) return cb(null, true);

    // 3-2) 허용된 도메인
    if (allowedOrigins.has(normalizeOrigin(origin))) {
      return cb(null, true);
    }

    // 3-3) 나머지는 차단
    return cb(null, false);
  },
  // 3-4) 인증/쿠키 허용 플래그
  credentials: true,
  // 3-5) 허용 HTTP 메서드 목록
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  // 3-6) 허용 요청 헤더 목록
  allowedHeaders: ['Content-Type', 'Authorization'],
  // 3-7) 프리플라이트 성공 상태 코드 (일부 구형 브라우저 호환용)
  optionsSuccessStatus: 200,
});
