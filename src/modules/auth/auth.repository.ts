import type { ApprovalStatus, Prisma, Role } from '@prisma/client';
import prisma from '../../config/prisma';

// ==============================================
// ⭐️ 인증 관련 Utility
// ==============================================
// 1) DB 클라이언트 타입 정의 (트랜잭션 클라이언트 또는 일반 Prisma 클라이언트)
type DbClient = Prisma.TransactionClient | typeof prisma;

// 2) 사용자 생성에 필요한 입력 타입 정의
type CreateUserInput = {
  username: string;
  passwordHash: string;
  contact: string;
  name: string;
  email: string;
  role: Role;
  approvalStatus: ApprovalStatus;
  isActive?: boolean;
  apartmentId?: string | null;
  building?: string | null;
  unitNumber?: string | null;
};

// 3) 아파트 생성에 필요한 입력 타입 정의
type CreateApartmentInput = {
  name: string;
  address: string;
  officeNumber: string;
  description: string;
  startComplexNumber: number;
  endComplexNumber: number;
  startDongNumber: number;
  endDongNumber: number;
  startFloorNumber: number;
  endFloorNumber: number;
  startHoNumber: number;
  endHoNumber: number;
  apartmentStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  adminId?: string | null;
};

// 4) 관리자 정보 업데이트에 필요한 입력 타입 정의
type UpdateAdminInput = {
  name: string;
  contact: string;
  email: string;
  description: string;
  apartmentName: string;
  apartmentAddress: string;
  apartmentManagementNumber: string;
};

// 5) DB 클라이언트 반환 함수 (트랜잭션 클라이언트가 제공되면 사용, 그렇지 않으면 기본 Prisma 클라이언트 사용)
const getDb = (tx?: Prisma.TransactionClient): DbClient => tx ?? prisma;

// ==============================================
// ⭐️ 인증 관련 Repository
// ==============================================
export const authRepository = {
  // 1) 로그인 키(아이디)로 사용자 조회 (로그인 시 사용)
  async findUserByLoginKey(username: string, tx?: Prisma.TransactionClient) {
    return getDb(tx).user.findUnique({
      where: { username },
      include: {
        apartment: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  },
  // 2) 사용자 ID로 사용자 조회 (토큰 검증 시 사용)
  async findUserById(userId: string, tx?: Prisma.TransactionClient) {
    return getDb(tx).user.findUnique({
      where: { id: userId },
      include: {
        apartment: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  },
  // 3) 회원가입 시 아이디/이메일/연락처 중복 확인
  async findUserForConflictCheck(
    username: string,
    email: string,
    contact: string,
    tx?: Prisma.TransactionClient
  ) {
    return getDb(tx).user.findFirst({
      where: {
        OR: [{ username }, { email }, { contact }],
      },
      select: {
        id: true,
        username: true,
        email: true,
        contact: true,
      },
    });
  },
  // 4) 아파트명으로 아파트 조회 (회원가입 시 아파트 존재 여부 확인)
  async findApartmentByName(name: string, tx?: Prisma.TransactionClient) {
    return getDb(tx).apartment.findFirst({
      where: { name },
      select: {
        id: true,
        name: true,
        apartmentStatus: true,
        startDongNumber: true,
        endDongNumber: true,
        startHoNumber: true,
        endHoNumber: true,
      },
    });
  },
  // 5) 사용자 생성 (회원가입 시 사용)
  async createUser(input: CreateUserInput, tx?: Prisma.TransactionClient) {
    return getDb(tx).user.create({
      data: {
        username: input.username,
        passwordHash: input.passwordHash,
        contact: input.contact,
        name: input.name,
        email: input.email,
        role: input.role,
        approvalStatus: input.approvalStatus,
        isActive: input.isActive ?? true,
        apartmentId: input.apartmentId ?? null,
        building: input.building ?? null,
        unitNumber: input.unitNumber ?? null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        approvalStatus: true,
        isActive: true,
      },
    });
  },
  // 6) 아파트 생성 (관리자 회원가입 시 사용)
  async createApartment(
    input: CreateApartmentInput,
    tx?: Prisma.TransactionClient
  ) {
    return getDb(tx).apartment.create({
      data: {
        name: input.name,
        address: input.address,
        officeNumber: input.officeNumber,
        description: input.description,
        startComplexNumber: input.startComplexNumber,
        endComplexNumber: input.endComplexNumber,
        startDongNumber: input.startDongNumber,
        endDongNumber: input.endDongNumber,
        startFloorNumber: input.startFloorNumber,
        endFloorNumber: input.endFloorNumber,
        startHoNumber: input.startHoNumber,
        endHoNumber: input.endHoNumber,
        apartmentStatus: input.apartmentStatus,
        adminId: input.adminId ?? null,
      },
      select: {
        id: true,
        name: true,
        apartmentStatus: true,
      },
    });
  },
  // 7) 아파트에 기본 게시판 생성 (관리자 회원가입 시 사용)
  async createBoardsForApartment(
    apartmentId: string,
    tx?: Prisma.TransactionClient
  ) {
    return getDb(tx).board.createMany({
      data: [
        { apartmentId, type: 'NOTICE', name: '공지사항' },
        { apartmentId, type: 'POLL', name: '주민투표' },
        { apartmentId, type: 'COMPLAINT', name: '민원' },
      ],
      skipDuplicates: true,
    });
  },
  // 8) 관리자 승인 상태 업데이트
  async updateApartmentAdmin(
    apartmentId: string,
    adminId: string,
    tx?: Prisma.TransactionClient
  ) {
    return getDb(tx).apartment.update({
      where: { id: apartmentId },
      data: { adminId },
      select: { id: true, adminId: true },
    });
  },
  // 9) 아파트 ID로 게시판 ID 조회 (관리자 회원가입 시 게시판 생성 후 게시판 ID 조회에 사용)
  async findBoardIdsByApartmentId(
    apartmentId: string,
    tx?: Prisma.TransactionClient
  ) {
    const boards = await getDb(tx).board.findMany({
      where: { apartmentId, isActive: true },
      select: { id: true, type: true },
    });

    return {
      COMPLAINT: boards.find((board) => board.type === 'COMPLAINT')?.id ?? null,
      NOTICE: boards.find((board) => board.type === 'NOTICE')?.id ?? null,
      POLL: boards.find((board) => board.type === 'POLL')?.id ?? null,
    };
  },
  // 10) 인증 세션 생성 (로그인 시 사용)
  async createAuthSession(
    input: {
      id?: string;
      userId: string;
      refreshTokenHash: string;
      expiresAt: Date;
    },
    tx?: Prisma.TransactionClient
  ) {
    const data: {
      id?: string;
      userId: string;
      refreshTokenHash: string;
      expiresAt: Date;
      userAgent: string | null;
      ipAddress: string | null;
    } = {
      userId: input.userId,
      refreshTokenHash: input.refreshTokenHash,
      expiresAt: input.expiresAt,
      userAgent: null,
      ipAddress: null,
    };

    if (input.id) {
      data.id = input.id;
    }

    return getDb(tx).authSession.create({
      data,
      select: {
        id: true,
        userId: true,
        expiresAt: true,
      },
    });
  },
  // 11) 활성화된 인증 세션 조회 (토큰 갱신 시 사용)
  async findActiveAuthSession(
    sessionId: string,
    tx?: Prisma.TransactionClient
  ) {
    return getDb(tx).authSession.findFirst({
      where: {
        id: sessionId,
        revokedAt: null,
      },
    });
  },
  // 12) 인증 세션 폐기 (로그아웃 시 사용)
  async revokeAuthSession(sessionId: string, tx?: Prisma.TransactionClient) {
    return getDb(tx).authSession.update({
      where: { id: sessionId },
      data: { revokedAt: new Date() },
      select: {
        id: true,
        revokedAt: true,
      },
    });
  },
  // 13) 사용자와 관련된 모든 인증 세션 폐기 (비밀번호 변경 시 사용)
  async revokeAllUserSessions(userId: string, tx?: Prisma.TransactionClient) {
    return getDb(tx).authSession.updateMany({
      where: {
        userId,
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    });
  },
  // 14) 사용자 승인 상태 업데이트 (관리자 승인/거부 시 사용)
  async updateUserApprovalStatus(
    userId: string,
    role: Role,
    status: ApprovalStatus,
    tx?: Prisma.TransactionClient
  ) {
    return getDb(tx).user.updateMany({
      where: { id: userId, role },
      data: {
        approvalStatus: status,
        approvedAt: status === 'APPROVED' ? new Date() : null,
      },
    });
  },
  // 15) 역할과 아파트 ID로 사용자 승인 상태 일괄 업데이트 (관리자/주민 일괄 승인/거부 시 사용)
  async updateUsersApprovalStatusByRole(
    role: Role,
    status: ApprovalStatus,
    apartmentId?: string,
    tx?: Prisma.TransactionClient
  ) {
    return getDb(tx).user.updateMany({
      where: {
        role,
        ...(apartmentId ? { apartmentId } : {}),
      },
      data: {
        approvalStatus: status,
        approvedAt: status === 'APPROVED' ? new Date() : null,
      },
    });
  },
  // 16) 관리자 정보 업데이트 (관리자 정보 수정 시 사용)
  async updateAdminInfo(
    adminId: string,
    input: UpdateAdminInput,
    tx?: Prisma.TransactionClient
  ) {
    const db = getDb(tx);

    const updatedUser = await db.user.update({
      where: { id: adminId },
      data: {
        name: input.name,
        contact: input.contact,
        email: input.email,
      },
      select: { id: true },
    });

    await db.apartment.update({
      where: { adminId },
      data: {
        name: input.apartmentName,
        address: input.apartmentAddress,
        officeNumber: input.apartmentManagementNumber,
        description: input.description,
      },
      select: { id: true },
    });

    return updatedUser;
  },
  // 17) 관리자 삭제 (관리자과 연결된 아파트도 함께 삭제)
  async deleteAdminWithApartment(
    adminId: string,
    tx?: Prisma.TransactionClient
  ) {
    const db = getDb(tx);
    const apartment = await db.apartment.findUnique({
      where: { adminId },
      select: { id: true },
    });

    if (apartment) {
      await db.apartment.delete({
        where: { id: apartment.id },
      });
    }

    return db.user.delete({
      where: { id: adminId },
      select: { id: true },
    });
  },
  // 18) 거부된 관리자 정리 (주기적 작업 시 사용)
  async cleanupRejectedAdmins(tx?: Prisma.TransactionClient) {
    const db = getDb(tx);
    const rejectedAdmins = await db.user.findMany({
      where: { role: 'ADMIN', approvalStatus: 'REJECTED' },
      select: { id: true },
    });

    const adminIds = rejectedAdmins.map((admin) => admin.id);
    if (adminIds.length === 0) return { count: 0 };

    await db.apartment.deleteMany({
      where: { adminId: { in: adminIds } },
    });

    const deleted = await db.user.deleteMany({
      where: { id: { in: adminIds } },
    });

    return { count: deleted.count };
  },
  // 19) 거부된 주민 정리 (주기적 작업 시 사용)
  async cleanupRejectedResidents(
    apartmentId: string,
    tx?: Prisma.TransactionClient
  ) {
    const deleted = await getDb(tx).user.deleteMany({
      where: {
        role: 'USER',
        approvalStatus: 'REJECTED',
        apartmentId,
      },
    });

    return { count: deleted.count };
  },
};
