/**
 * @name Debug
 * @category Utility
 * @description
 * 디버그 모드에서만 활성화되는 로그 유틸리티입니다.
 * 개발 중에 API 흐름과 변수 상태를 확인하는 데 사용됩니다.
 * .env 파일에서 DEBUG_MODE=true로 설정하면 활성화됩니다.
 * @warning
 * 디버그 모드는 개발 환경에서만 사용해야 하며,
 * 프로덕션에서는 반드시 false로 설정해야 합니다.
 */

/**
 * 1) debugLog()
 * 일반 디버그 로그 출력 (console.log)
 * 개발 환경에서 API 흐름/변수 확인에 사용
 */
export const debugLog = (...args: unknown[]) => {
  if (isDebugMode()) {
    console.log('[DEBUG]', ...args);
  }
};

/**
 * 2) debugError()
 * 에러 상황을 디버그 모드에서만 출력 (console.error)
 * error-handler.ts 내부에서 활용
 */
export const debugError = (...args: unknown[]) => {
  if (isDebugMode()) {
    console.error('[DEBUG ERROR]', ...args);
  }
};

/**
 * 3) debugWarn()
 * 경고성 메시지 출력 (console.warn)
 */
export const debugWarn = (...args: unknown[]) => {
  if (isDebugMode()) {
    console.warn('[DEBUG WARN]', ...args);
  }
};

/**
 * 4) isDebugMode()
 * 현재 디버그 모드인지 여부를 Boolean으로 반환
 */
export const isDebugMode = () => process.env.DEBUG_MODE === 'true';
