import prisma from '../../config/prisma';
import type { Prisma } from '@prisma/client';
import type {
  ListApartmentsQueryDto,
  ListPublicApartmentsQueryDto,
} from './apartment.dto';

// ==============================================
// ⭐️ 아파트 관련 Utility
// ==============================================
// 1) 공통 where 빌더
const buildPublicApartmentWhere = (
  query: ListPublicApartmentsQueryDto
): Prisma.ApartmentWhereInput => {
  const where: Prisma.ApartmentWhereInput = {
    apartmentStatus: 'APPROVED',
  };

  if (query.name) {
    where.name = { contains: query.name, mode: 'insensitive' };
  }

  if (query.address) {
    where.address = { contains: query.address, mode: 'insensitive' };
  }

  if (query.keyword) {
    where.OR = [
      { name: { contains: query.keyword, mode: 'insensitive' } },
      { address: { contains: query.keyword, mode: 'insensitive' } },
    ];
  }

  return where;
};

// 2) 일반 where 빌더 (관리자용)
const buildApartmentWhere = (
  query: ListApartmentsQueryDto,
  apartmentId?: string | null
): Prisma.ApartmentWhereInput => {
  const where: Prisma.ApartmentWhereInput = {};

  if (apartmentId) {
    where.id = apartmentId;
  }

  if (query.name) {
    where.name = { contains: query.name, mode: 'insensitive' };
  }

  if (query.address) {
    where.address = { contains: query.address, mode: 'insensitive' };
  }

  if (query.apartmentStatus) {
    where.apartmentStatus = query.apartmentStatus;
  }

  if (query.searchKeyword) {
    where.OR = [
      { name: { contains: query.searchKeyword, mode: 'insensitive' } },
      { address: { contains: query.searchKeyword, mode: 'insensitive' } },
      {
        admin: {
          name: { contains: query.searchKeyword, mode: 'insensitive' },
        },
      },
      {
        admin: {
          email: { contains: query.searchKeyword, mode: 'insensitive' },
        },
      },
    ];
  }

  return where;
};

// ==============================================
// ⭐️ 아파트 관련 Repository
// ==============================================
export const apartmentRepository = {
  // 1) 공개 아파트 목록 조회
  async findPublicApartments(query: ListPublicApartmentsQueryDto) {
    return prisma.apartment.findMany({
      where: buildPublicApartmentWhere(query),
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        address: true,
      },
    });
  },
  // 2) 공개 아파트 수 조회
  async countPublicApartments(query: ListPublicApartmentsQueryDto) {
    return prisma.apartment.count({
      where: buildPublicApartmentWhere(query),
    });
  },
  // 3) 아파트 목록 조회 (관리자용)
  async findApartments(
    query: ListApartmentsQueryDto,
    apartmentId?: string | null
  ) {
    return prisma.apartment.findMany({
      where: buildApartmentWhere(query, apartmentId),
      orderBy: { createdAt: 'desc' },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
      include: {
        admin: {
          select: {
            id: true,
            name: true,
            contact: true,
            email: true,
          },
        },
      },
    });
  },
  // 4) 아파트 수 조회 (관리자용)
  async countApartments(
    query: ListApartmentsQueryDto,
    apartmentId?: string | null
  ) {
    return prisma.apartment.count({
      where: buildApartmentWhere(query, apartmentId),
    });
  },
  // 5) 아파트 ID로 조회
  async findApartmentById(id: string, apartmentId?: string | null) {
    return prisma.apartment.findFirst({
      where: {
        id,
        ...(apartmentId ? { id: apartmentId } : {}),
      },
      include: {
        admin: {
          select: {
            id: true,
            name: true,
            contact: true,
            email: true,
          },
        },
      },
    });
  },
  // 6) 공개 아파트 ID로 조회
  async findPublicApartmentById(id: string) {
    return prisma.apartment.findFirst({
      where: {
        id,
        apartmentStatus: 'APPROVED',
      },
      select: {
        id: true,
        name: true,
        address: true,
        startComplexNumber: true,
        endComplexNumber: true,
        startDongNumber: true,
        endDongNumber: true,
        startFloorNumber: true,
        endFloorNumber: true,
        startHoNumber: true,
        endHoNumber: true,
      },
    });
  },
};
