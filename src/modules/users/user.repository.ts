import prisma from '../../config/prisma';

// ======================================
// ⭐️ 유저 관련 Repository
// ======================================
export const userRepository = {
  // 1) 유저 조회
  async findUserById(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        passwordHash: true,
      },
    });
  },
  // 2) 유저 정보 업데이트
  async updateUserById(
    userId: string,
    data: {
      passwordHash?: string;
      profileImageUrl?: string;
    }
  ) {
    return prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        name: true,
      },
    });
  },
};
