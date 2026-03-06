// ==============================================
// ⭐️ 페이징 관련 Utility
// ==============================================
// 1) 문자열을 양의 정수로 파싱하는 함수
export const parsePositiveInt = (
  value: string | undefined,
  fallback: number
): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

// 2) 페이징 입력과 옵션을 정의하는 인터페이스
export interface ResolvePaginationInput {
  page?: string;
  limit?: string;
}

export interface ResolvePaginationOptions {
  defaultPage: number;
  defaultLimit: number;
  maxLimit?: number;
}

// 3) 페이징을 계산하는 함수
export const resolvePagination = (
  input: ResolvePaginationInput,
  options: ResolvePaginationOptions
) => {
  const page = parsePositiveInt(input.page, options.defaultPage);
  let limit = parsePositiveInt(input.limit, options.defaultLimit);

  if (options.maxLimit && limit > options.maxLimit) {
    limit = options.maxLimit;
  }

  const skip = (page - 1) * limit;

  return { page, limit, skip };
};
