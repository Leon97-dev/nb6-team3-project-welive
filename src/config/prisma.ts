/**
 * @name Prisma-Singleton
 * @category Config
 * @description
 * PrismaClient의 싱글톤 인스턴스를 생성하여 애플리케이션 전반에서 공유하는 모듈입니다.
 * 개발 환경에서는 핫 리로드로 인한 다중 인스턴스 생성을 방지하기 위해 글로벌 객체에 저장합니다.
 * 또한, Prisma의 쿼리/정보/경고/에러 이벤트를 로깅하여 디버깅과 모니터링에 활용합니다.
 * @warning
 * PrismaClient는 애플리케이션 전체에서 하나의 인스턴스로 사용해야 하며,
 * 개발 환경에서는 핫 리로드로 인해 여러 인스턴스가 생성될 수 있으므로 주의해야 합니다.
 * 이 모듈은 PrismaClient 인스턴스를 생성하고 이벤트 리스너를 등록하여 쿼리 및 에러 로그를 출력합니다.
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import { ENV } from './env';

// 1) Prisma 로그 설정: 쿼리 이벤트는 디버그 모드 또는 PRISMA_QUERY_LOG가 true일 때 활성화
const emitQueryEvents = ENV.DEBUG_MODE || ENV.PRISMA_QUERY_LOG;

// 2) Prisma 로그 레벨 설정: 디버그 모드에서는 info/warn도 활성화, 아니면 error만
const prismaLogConfig = [
  ...(emitQueryEvents
    ? [{ emit: 'event' as const, level: 'query' as const }]
    : []),
  ...(ENV.DEBUG_MODE
    ? [
        { emit: 'event' as const, level: 'info' as const },
        { emit: 'event' as const, level: 'warn' as const },
      ]
    : []),
  { emit: 'event' as const, level: 'error' as const },
];

// 3) 글로벌 싱글톤 패턴: 개발 환경에서는 핫 리로드로 인한 다중 인스턴스 생성을 방지하기 위해 글로벌 객체에 저장
const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: PrismaClient;
  prismaListenersRegistered?: boolean;
};

// 4) PrismaClient 인스턴스 생성 및 이벤트 리스너 등록
const prisma =
  globalForPrisma.prisma ?? new PrismaClient({ log: prismaLogConfig });

// 4-1) 개발 환경에서는 글로벌 객체에 저장하여 핫 리로드 시에도 동일 인스턴스 유지
if (ENV.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// 5) Prisma 이벤트 리스너 등록: 쿼리, 정보, 경고, 에러 이벤트를 로깅
if (!globalForPrisma.prismaListenersRegistered) {
  const prismaWithEvents = prisma as PrismaClient & {
    // PrismaClient의 $on 메서드 타입 확장
    $on: (eventType: string, callback: (event: any) => void) => void;
  };

  // 5-1) 쿼리 이벤트 로깅: 쿼리, 파라미터, 실행 시간 로그 출력
  if (emitQueryEvents) {
    prismaWithEvents.$on('query', (e) => {
      logger.info(
        [
          'PRISMA QUERY',
          `query:\n${e.query}`,
          `params:\n${e.params}`,
          `duration:\n${e.duration}ms`,
        ].join('\n\n')
      );
    });
  }

  if (ENV.DEBUG_MODE) {
    // 5-2) 정보 이벤트 로깅: 디버그 모드에서만 활성화
    prismaWithEvents.$on('info', (e) => {
      logger.info('PRISMA INFO', { message: e.message });
    });

    // 5-3) 경고 이벤트 로깅: 디버그 모드에서만 활성화
    prismaWithEvents.$on('warn', (e) => {
      logger.warn('PRISMA WARN', { message: e.message });
    });
  }

  // 5-4) 에러 이벤트 로깅: 항상 활성화
  prismaWithEvents.$on('error', (e) => {
    logger.error('PRISMA ERROR', { message: e.message });
  });

  globalForPrisma.prismaListenersRegistered = true;
}

export default prisma;
