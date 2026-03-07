import { randomUUID } from 'crypto';
import type { ApprovalStatus, Prisma, Role } from '@prisma/client';
import prisma from '../../config/prisma';
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from '../../middlewares/error-handler';
import type {
  LoginDto,
  LoginResponseDto,
  SignupAdminDto,
  SignupResponseDto,
  SignupSuperAdminDto,
  SignupUserDto,
  UpdateAdminDto,
  UpdateApprovalStatusDto,
} from './auth.dto';
import { authRepository } from './auth.repository';
import {
  comparePassword,
  createAccessToken,
  createRefreshToken,
  hashPassword,
  refreshTokenMaxAgeMs,
  verifyRefreshToken,
} from './auth.token';

// ==============================================
// ⭐️ 인증 관련 Utility
// ==============================================
// 1) 토큰 묶음 타입 정의
type TokenBundle = {
  accessToken: string;
  refreshToken: string;
};

// 2) 회원가입 응답 변환
const toSignupResponse = (user: {
  id: string;
  name: string;
  email: string;
  approvalStatus: ApprovalStatus;
  isActive: boolean;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'USER';
}): SignupResponseDto => ({
  id: user.id,
  name: user.name,
  email: user.email,
  joinStatus: user.approvalStatus,
  isActive: user.isActive,
  role: user.role,
});

// 3) 회원가입 시 아이디/이메일/연락처 중복 체크
const assertNoUserConflict = async (
  username: string,
  email: string,
  contact: string,
  tx?: Prisma.TransactionClient
) => {
  const conflict = await authRepository.findUserForConflictCheck(
    username,
    email,
    contact,
    tx
  );

  if (!conflict) return;

  if (conflict.username === username) {
    throw new ConflictError('이미 사용 중인 아이디입니다');
  }
  if (conflict.email === email) {
    throw new ConflictError('이미 사용 중인 이메일입니다');
  }
  if (conflict.contact === contact) {
    throw new ConflictError('이미 사용 중인 연락처입니다');
  }
  throw new ConflictError('이미 사용 중인 정보입니다');
};

// 4) 세션 토큰 발급
const issueSessionTokens = async (
  userId: string,
  payload: {
    role: 'SUPER_ADMIN' | 'ADMIN' | 'USER';
    apartmentId: string | null;
    building: string | null;
  }
): Promise<TokenBundle> => {
  const sid = randomUUID();
  const refreshToken = createRefreshToken({
    sub: userId,
    sid,
    type: 'refresh',
  });
  const refreshTokenHash = await hashPassword(refreshToken);

  await authRepository.createAuthSession({
    id: sid,
    userId,
    refreshTokenHash,
    expiresAt: new Date(Date.now() + refreshTokenMaxAgeMs),
  });

  const accessToken = createAccessToken({
    sub: userId,
    role: payload.role,
    apartmentId: payload.apartmentId,
    building: payload.building,
  });

  return { accessToken, refreshToken };
};

// ==============================================
// ⭐️ 인증 관련 Service
// ==============================================
export const authService = {
  // 1) 입주민 회원가입
  async signupUser(data: SignupUserDto): Promise<SignupResponseDto> {
    const apartment = await authRepository.findApartmentByName(
      data.apartmentName
    );
    if (!apartment) {
      throw new NotFoundError('아파트를 찾을 수 없습니다');
    }

    await assertNoUserConflict(data.username, data.email, data.contact);

    const passwordHash = await hashPassword(data.password);
    const created = await authRepository.createUser({
      username: data.username,
      passwordHash,
      contact: data.contact,
      name: data.name,
      email: data.email,
      role: 'USER',
      approvalStatus: 'PENDING',
      apartmentId: apartment.id,
      building: data.apartmentDong,
      unitNumber: data.apartmentHo,
    });

    return toSignupResponse(created);
  },
  // 2) 관리자 회원가입
  async signupAdmin(data: SignupAdminDto): Promise<SignupResponseDto> {
    return prisma.$transaction(async (tx) => {
      await assertNoUserConflict(data.username, data.email, data.contact, tx);
      const passwordHash = await hashPassword(data.password);

      const admin = await authRepository.createUser(
        {
          username: data.username,
          passwordHash,
          contact: data.contact,
          name: data.name,
          email: data.email,
          role: 'ADMIN',
          approvalStatus: 'PENDING',
        },
        tx
      );

      const apartment = await authRepository.createApartment(
        {
          name: data.apartmentName,
          address: data.apartmentAddress,
          officeNumber: data.apartmentManagementNumber,
          description: data.description,
          startComplexNumber: data.startComplexNumber,
          endComplexNumber: data.endComplexNumber,
          startDongNumber: data.startDongNumber,
          endDongNumber: data.endDongNumber,
          startFloorNumber: data.startFloorNumber,
          endFloorNumber: data.endFloorNumber,
          startHoNumber: data.startHoNumber,
          endHoNumber: data.endHoNumber,
          apartmentStatus: 'PENDING',
          adminId: admin.id,
        },
        tx
      );

      await authRepository.createBoardsForApartment(apartment.id, tx);
      return toSignupResponse(admin);
    });
  },
  // 3) 슈퍼 관리자 회원가입
  async signupSuperAdmin(
    data: SignupSuperAdminDto
  ): Promise<SignupResponseDto> {
    await assertNoUserConflict(data.username, data.email, data.contact);
    const passwordHash = await hashPassword(data.password);

    const created = await authRepository.createUser({
      username: data.username,
      passwordHash,
      contact: data.contact,
      name: data.name,
      email: data.email,
      role: 'SUPER_ADMIN',
      approvalStatus: data.joinStatus ?? 'APPROVED',
    });

    return toSignupResponse(created);
  },
  // 4) 로그인
  async login(
    data: LoginDto
  ): Promise<TokenBundle & { user: LoginResponseDto }> {
    const user = await authRepository.findUserByLoginKey(data.username);
    if (!user) {
      throw new NotFoundError('사용자를 찾을 수 없습니다');
    }

    const isPasswordValid = await comparePassword(
      data.password,
      user.passwordHash
    );
    if (!isPasswordValid) {
      throw new UnauthorizedError('아이디 또는 비밀번호가 일치하지 않습니다');
    }

    if (!user.isActive) {
      throw new ForbiddenError('비활성화된 계정입니다');
    }

    if (user.approvalStatus !== 'APPROVED') {
      throw new ForbiddenError('가입 승인 상태가 아닙니다');
    }

    const tokens = await issueSessionTokens(user.id, {
      role: user.role,
      apartmentId: user.apartmentId,
      building: user.building,
    });

    const boardIds = user.apartmentId
      ? await authRepository.findBoardIdsByApartmentId(user.apartmentId)
      : null;

    return {
      ...tokens,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        username: user.username,
        contact: user.contact,
        avatar: user.profileImageUrl ?? null,
        residentDong: user.building ? `${user.building}동` : null,
        apartmentName: user.apartment?.name ?? null,
        isActive: user.isActive,
        joinStatus: user.approvalStatus,
        apartmentId: user.apartmentId ?? null,
        boardIds,
      },
    };
  },
  // 5) 리프레시 토큰 갱신
  async refresh(refreshToken: string): Promise<TokenBundle> {
    const payload = verifyRefreshToken(refreshToken);
    if (payload.type !== 'refresh') {
      throw new UnauthorizedError('유효하지 않은 토큰입니다');
    }

    const session = await authRepository.findActiveAuthSession(payload.sid);
    if (!session || session.userId !== payload.sub) {
      throw new UnauthorizedError('세션이 유효하지 않습니다');
    }

    const matched = await comparePassword(
      refreshToken,
      session.refreshTokenHash
    );
    if (!matched) {
      throw new UnauthorizedError('유효하지 않은 리프레시 토큰입니다');
    }

    const user = await authRepository.findUserById(payload.sub);
    if (!user || !user.isActive || user.approvalStatus !== 'APPROVED') {
      throw new UnauthorizedError('사용자 상태가 유효하지 않습니다');
    }

    await authRepository.revokeAuthSession(session.id);

    return issueSessionTokens(user.id, {
      role: user.role,
      apartmentId: user.apartmentId,
      building: user.building,
    });
  },
  // 6) 로그아웃
  async logout(refreshToken?: string): Promise<void> {
    if (!refreshToken) return;

    try {
      const payload = verifyRefreshToken(refreshToken);
      if (payload.type !== 'refresh') return;
      await authRepository.revokeAuthSession(payload.sid);
    } catch {
      return;
    }
  },
  // 7) 관리자 승인 상태 업데이트
  async updateAdminStatus(adminId: string, data: UpdateApprovalStatusDto) {
    const result = await authRepository.updateUserApprovalStatus(
      adminId,
      'ADMIN',
      data.status
    );

    if (result.count === 0) {
      throw new NotFoundError('관리자를 찾을 수 없습니다');
    }
  },
  // 8) 관리자 일괄 승인/거부
  async updateAdminStatusBulk(data: UpdateApprovalStatusDto) {
    await authRepository.updateUsersApprovalStatusByRole('ADMIN', data.status);
  },
  // 9) 주민 승인 상태 업데이트
  async updateResidentStatus(
    residentId: string,
    data: UpdateApprovalStatusDto,
    apartmentId?: string | null
  ) {
    const resident = await authRepository.findUserById(residentId);
    if (!resident || resident.role !== 'USER') {
      throw new NotFoundError('입주민을 찾을 수 없습니다');
    }

    if (apartmentId && resident.apartmentId !== apartmentId) {
      throw new ForbiddenError('다른 아파트 입주민은 변경할 수 없습니다');
    }

    await authRepository.updateUserApprovalStatus(
      residentId,
      'USER',
      data.status
    );
  },
  // 10) 주민 승인 상태 일괄 업데이트
  async updateResidentStatusBulk(
    data: UpdateApprovalStatusDto,
    apartmentId?: string | null
  ) {
    if (!apartmentId) {
      throw new ForbiddenError('관리자 아파트 정보가 필요합니다');
    }

    await authRepository.updateUsersApprovalStatusByRole(
      'USER',
      data.status,
      apartmentId
    );
  },
  // 11) 관리자 정보 업데이트
  async updateAdminInfo(adminId: string, data: UpdateAdminDto) {
    await prisma.$transaction(async (tx) => {
      await authRepository.updateAdminInfo(adminId, data, tx);
    });
  },
  // 12) 관리자 삭제
  async deleteAdmin(adminId: string) {
    await prisma.$transaction(async (tx) => {
      await authRepository.deleteAdminWithApartment(adminId, tx);
    });
  },
  // 13) 거부된 계정 정리
  async cleanupRejectedAccounts(role: Role, apartmentId?: string | null) {
    if (role === 'SUPER_ADMIN') {
      await prisma.$transaction(async (tx) => {
        await authRepository.cleanupRejectedAdmins(tx);
      });
      return;
    }

    if (role === 'ADMIN') {
      if (!apartmentId) {
        throw new ForbiddenError('관리자 아파트 정보가 필요합니다');
      }
      await prisma.$transaction(async (tx) => {
        await authRepository.cleanupRejectedResidents(apartmentId, tx);
      });
      return;
    }

    throw new ForbiddenError('접근 권한이 없습니다');
  },
};
