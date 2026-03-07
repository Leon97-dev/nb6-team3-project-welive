import z from 'zod';
import { ValidationError } from '../../middlewares/error-handler';
import type {
  LoginDto,
  SignupAdminDto,
  SignupSuperAdminDto,
  SignupUserDto,
  UpdateAdminDto,
  UpdateApprovalStatusDto,
} from './auth.dto';

const phoneRegex = /^01[0-9]{8,9}$/;
const numberField = z.coerce.number().int().positive();

// ==============================================
// ⭐️ 인증 관련 Validator
// ==============================================
// 1) 일반 회원가입
const SignupUserSchema = z.object({
  username: z.string().trim().min(1, '아이디는 필수입니다'),
  password: z.string().min(8, '비밀번호는 최소 8자 이상이어야 합니다'),
  contact: z
    .string()
    .trim()
    .regex(phoneRegex, '연락처 형식이 올바르지 않습니다'),
  name: z.string().trim().min(1, '이름은 필수입니다'),
  email: z.email('이메일 형식이 올바르지 않습니다'),
  apartmentName: z.string().trim().min(1, '아파트명은 필수입니다'),
  apartmentDong: z.string().trim().min(1, '동 정보는 필수입니다'),
  apartmentHo: z.string().trim().min(1, '호수 정보는 필수입니다'),
  role: z.literal('USER'),
});

// 2) 관리자 회원가입
const SignupAdminSchema = z
  .object({
    username: z.string().trim().min(1, '아이디는 필수입니다'),
    password: z.string().min(8, '비밀번호는 최소 8자 이상이어야 합니다'),
    passwordConfirm: z
      .string()
      .min(8, '비밀번호 확인은 최소 8자 이상이어야 합니다')
      .optional(),
    contact: z
      .string()
      .trim()
      .regex(phoneRegex, '연락처 형식이 올바르지 않습니다'),
    name: z.string().trim().min(1, '이름은 필수입니다'),
    email: z.email('이메일 형식이 올바르지 않습니다'),
    apartmentName: z.string().trim().min(1, '아파트명은 필수입니다'),
    apartmentAddress: z.string().trim().min(1, '아파트 주소는 필수입니다'),
    apartmentManagementNumber: z
      .string()
      .trim()
      .min(1, '관리소 번호는 필수입니다'),
    description: z.string().trim().min(1, '소개는 필수입니다'),
    startComplexNumber: numberField,
    endComplexNumber: numberField,
    startDongNumber: numberField,
    endDongNumber: numberField,
    startFloorNumber: numberField,
    endFloorNumber: numberField,
    startHoNumber: numberField,
    endHoNumber: numberField,
    role: z.literal('ADMIN'),
  })
  .refine(
    (value) =>
      !value.passwordConfirm || value.password === value.passwordConfirm,
    {
      message: '비밀번호와 비밀번호 확인이 일치하지 않습니다',
      path: ['passwordConfirm'],
    }
  );

// 3) 슈퍼 관리자 회원가입
const SignupSuperAdminSchema = z.object({
  username: z.string().trim().min(1, '아이디는 필수입니다'),
  password: z.string().min(8, '비밀번호는 최소 8자 이상이어야 합니다'),
  contact: z
    .string()
    .trim()
    .regex(phoneRegex, '연락처 형식이 올바르지 않습니다'),
  name: z.string().trim().min(1, '이름은 필수입니다'),
  email: z.email('이메일 형식이 올바르지 않습니다'),
  role: z.literal('SUPER_ADMIN'),
  joinStatus: z.literal('APPROVED'),
});

// 4) 로그인 요청
const LoginSchema = z.object({
  username: z.string().trim().min(1, '아이디는 필수입니다'),
  password: z.string().min(8, '비밀번호는 최소 8자 이상이어야 합니다'),
});

// 5) 관리자 정보 수정
const UpdateAdminSchema = z.object({
  name: z.string().trim().min(1, '이름은 필수입니다'),
  contact: z
    .string()
    .trim()
    .regex(phoneRegex, '연락처 형식이 올바르지 않습니다'),
  email: z.email('이메일 형식이 올바르지 않습니다'),
  description: z.string().trim().min(1, '소개는 필수입니다'),
  apartmentName: z.string().trim().min(1, '아파트명은 필수입니다'),
  apartmentAddress: z.string().trim().min(1, '아파트 주소는 필수입니다'),
  apartmentManagementNumber: z
    .string()
    .trim()
    .min(1, '관리소 번호는 필수입니다'),
});

// 6) 승인 상태 업데이트
const UpdateApprovalStatusSchema = z.object({
  status: z.union([
    z.literal('APPROVED'),
    z.literal('REJECTED'),
    z.literal('NEED_UPDATE'),
  ]),
});

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

export const validateSignupUser = (input: unknown): SignupUserDto => {
  return parseOrThrow(SignupUserSchema, input);
};

export const validateSignupAdmin = (input: unknown): SignupAdminDto => {
  return parseOrThrow(SignupAdminSchema, input);
};

export const validateSignupSuperAdmin = (
  input: unknown
): SignupSuperAdminDto => {
  return parseOrThrow(SignupSuperAdminSchema, input);
};

export const validateLogin = (input: unknown): LoginDto => {
  return parseOrThrow(LoginSchema, input);
};

export const validateUpdateAdmin = (input: unknown): UpdateAdminDto => {
  return parseOrThrow(UpdateAdminSchema, input);
};

export const validateUpdateApprovalStatus = (
  input: unknown
): UpdateApprovalStatusDto => {
  return parseOrThrow(UpdateApprovalStatusSchema, input);
};
