import z from 'zod';
import { ValidationError } from '../../middlewares/error-handler';
import type { ChangePasswordDto, UpdateMyProfileDto } from './user.dto';

// ==============================================
// ⭐️ 유저 관련 Utility
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

// 2) 내 프로필 업데이트 스키마
const UpdateMyProfileSchema = z
  .object({
    currentPassword: z.string().min(8).optional(),
    newPassword: z.string().min(8).optional(),
  })
  .refine(
    (value) => {
      if (!value.newPassword) return true;
      return Boolean(value.currentPassword);
    },
    {
      message: '새 비밀번호를 변경하려면 현재 비밀번호가 필요합니다',
      path: ['currentPassword'],
    }
  );

// 3) 비밀번호 변경 스키마
const ChangePasswordSchema = z.object({
  currentPassword: z
    .string()
    .min(8, '현재 비밀번호는 최소 8자 이상이어야 합니다'),
  newPassword: z.string().min(8, '새 비밀번호는 최소 8자 이상이어야 합니다'),
});

// ==============================================
// ⭐️ 유저 관련 Validator
// ==============================================
// 1) 내 프로필 업데이트
export const validateUpdateMyProfile = (input: unknown): UpdateMyProfileDto =>
  parseOrThrow(UpdateMyProfileSchema, input);

// 2) 비밀번호 변경
export const validateChangePassword = (input: unknown): ChangePasswordDto =>
  parseOrThrow(ChangePasswordSchema, input);
