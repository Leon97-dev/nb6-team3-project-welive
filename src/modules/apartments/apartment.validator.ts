import z from 'zod';
import { ApartmentStatus } from '@prisma/client';
import { ValidationError } from '../../middlewares/error-handler';
import type {
  ApartmentIdParamDto,
  ListApartmentsQueryDto,
  ListPublicApartmentsQueryDto,
} from './apartment.dto';

// ==============================================
// ⭐️ 아파트 관련 Utility
// ==============================================
// 1) 공통 검증 함수
const parseOrThrow = <T>(schema: z.ZodType<T>, input: unknown): T => {
  const parsed = schema.safeParse(input);

  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    throw new ValidationError(
      issue?.message || '요청 데이터가 올바르지 않습니다'
    );
  }

  return parsed.data;
};

// 2) 공통 optional 텍스트 검증
const optionalText = () => z.string().trim().min(1).optional();

// 3) 아파트 공개 목록 조회 쿼리 스키마
const ListPublicApartmentsQuerySchema = z.object({
  keyword: optionalText(),
  name: optionalText(),
  address: optionalText(),
});

// 4) 아파트 목록 조회 쿼리 스키마
const ListApartmentsQuerySchema = z.object({
  name: optionalText(),
  address: optionalText(),
  searchKeyword: optionalText(),
  apartmentStatus: z.enum(ApartmentStatus).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

// 5) 아파트 ID 경로 파라미터 스키마
const ApartmentIdParamSchema = z.object({
  id: z.uuid('아파트 ID 형식이 올바르지 않습니다'),
});

// ==============================================
// ⭐️ 아파트 관련 Validator
// ==============================================
// 1) 아파트 공개 목록 조회 쿼리 검증
export const validateListPublicApartmentsQuery = (
  input: unknown
): ListPublicApartmentsQueryDto =>
  parseOrThrow(ListPublicApartmentsQuerySchema, input);

// 2) 아파트 목록 조회 쿼리 검증
export const validateListApartmentsQuery = (
  input: unknown
): ListApartmentsQueryDto => parseOrThrow(ListApartmentsQuerySchema, input);

// 3) 아파트 ID 경로 파라미터 검증
export const validateApartmentIdParam = (input: unknown): ApartmentIdParamDto =>
  parseOrThrow(ApartmentIdParamSchema, input);
