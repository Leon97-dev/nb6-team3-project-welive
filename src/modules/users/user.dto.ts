// ===============================================
// ⭐️ 유저 관련 DTO
// ===============================================
// 1) 내 프로필 업데이트
export interface UpdateMyProfileDto {
  currentPassword?: string | undefined;
  newPassword?: string | undefined;
}

// 2) 비밀번호 변경
export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

// 3) 내 프로필 업데이트 응답
export interface UpdateUserInfoResponseDto {
  message: string;
}

// 4) 비밀번호 변경 응답
export interface ChangePasswordResponseDto {
  message: string;
}
