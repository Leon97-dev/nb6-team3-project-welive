import type { ApprovalStatus, Role } from '@prisma/client';

// ===============================================
// ⭐️ 인증 관련 DTO
// ===============================================
// 1) 일반 회원가입
export interface SignupUserDto {
  username: string;
  password: string;
  contact: string;
  name: string;
  email: string;
  apartmentName: string;
  apartmentDong: string;
  apartmentHo: string;
  role: 'USER';
}

// 2) 관리자 회원가입
export interface SignupAdminDto {
  username: string;
  password: string;
  passwordConfirm?: string | undefined;
  contact: string;
  name: string;
  email: string;
  apartmentName: string;
  apartmentAddress: string;
  apartmentManagementNumber: string;
  description: string;
  startComplexNumber: number;
  endComplexNumber: number;
  startDongNumber: number;
  endDongNumber: number;
  startFloorNumber: number;
  endFloorNumber: number;
  startHoNumber: number;
  endHoNumber: number;
  role: 'ADMIN';
}

// 3) 슈퍼 관리자 회원가입
export interface SignupSuperAdminDto {
  username: string;
  password: string;
  contact: string;
  name: string;
  email: string;
  role: 'SUPER_ADMIN';
  joinStatus?: ApprovalStatus;
}

// 4) 관리자 정보 수정
export interface UpdateAdminDto {
  name: string;
  contact: string;
  email: string;
  description: string;
  apartmentName: string;
  apartmentAddress: string;
  apartmentManagementNumber: string;
}

// 5) 회원 승인 상태 업데이트
export interface UpdateApprovalStatusDto {
  status: ApprovalStatus;
}

// 6) 로그인 요청
export interface LoginDto {
  username: string;
  password: string;
}

// ===============================================
// ⭐️ 응답 관련 DTO
// ===============================================
// 1) 로그인 응답
export interface LoginResponseDto {
  id: string;
  name: string;
  email: string;
  role: Role;
  username: string;
  contact: string;
  avatar?: string | null;
  residentDong?: string | null;
  apartmentName?: string | null;
  isActive: boolean;
  joinStatus: ApprovalStatus;
  apartmentId?: string | null;
  boardIds?: {
    COMPLAINT: string | null;
    NOTICE: string | null;
    POLL: string | null;
  } | null;
}

// 2) 회원가입 응답
export interface SignupResponseDto {
  id: string;
  name: string;
  email: string;
  joinStatus: ApprovalStatus;
  isActive: boolean;
  role: Role;
}
