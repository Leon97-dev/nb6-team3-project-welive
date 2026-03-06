import { Role } from '@prisma/client';

// ==============================================
// ⭐️ 역할 관련 Utility
// ==============================================
// 1) 관리자 역할 여부 확인
export const isAdminRole = (role: Role): role is 'ADMIN' | 'SUPER_ADMIN' => {
  return role === Role.ADMIN || role === Role.SUPER_ADMIN;
};

// 2) 슈퍼 관리자 역할 여부 확인
export const isSuperAdminRole = (role: Role): role is 'SUPER_ADMIN' => {
  return role === Role.SUPER_ADMIN;
};

// 3) 입주민 역할 여부 확인
export const isResidentRole = (role: Role): role is 'USER' => {
  return role === Role.USER;
};
