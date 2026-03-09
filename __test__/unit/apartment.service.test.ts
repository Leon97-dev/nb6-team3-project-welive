import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { NotFoundError } from '../../src/middlewares/error-handler';
import { apartmentRepository } from '../../src/modules/apartments/apartment.repository';
import { apartmentService } from '../../src/modules/apartments/apartment.service';

jest.mock('../../src/modules/apartments/apartment.repository', () => ({
  apartmentRepository: {
    findPublicApartments: jest.fn(),
    countPublicApartments: jest.fn(),
    findApartments: jest.fn(),
    countApartments: jest.fn(),
    findApartmentById: jest.fn(),
    findPublicApartmentById: jest.fn(),
  },
}));

const mockedRepo = apartmentRepository as jest.Mocked<
  typeof apartmentRepository
>;

describe('apartmentService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getPublicApartments', () => {
    it('공개 아파트 목록과 count를 반환한다', async () => {
      mockedRepo.findPublicApartments.mockResolvedValue([
        {
          id: 'ap-1',
          name: '위리브 1단지',
          address: '서울시 강남구',
        },
      ]);
      mockedRepo.countPublicApartments.mockResolvedValue(1);

      const result = await apartmentService.getPublicApartments({
        keyword: '위리브',
      });

      expect(result).toEqual({
        apartments: [
          {
            id: 'ap-1',
            name: '위리브 1단지',
            address: '서울시 강남구',
          },
        ],
        count: 1,
      });
    });
  });

  describe('getApartments', () => {
    it('관리자용 아파트 목록을 명세 형태로 변환한다', async () => {
      mockedRepo.findApartments.mockResolvedValue([
        {
          id: 'ap-1',
          name: '위리브 1단지',
          address: '서울시 강남구',
          officeNumber: '0212345678',
          description: '설명',
          startComplexNumber: 1,
          endComplexNumber: 3,
          startDongNumber: 101,
          endDongNumber: 120,
          startFloorNumber: 1,
          endFloorNumber: 30,
          startHoNumber: 1,
          endHoNumber: 8,
          apartmentStatus: 'APPROVED',
          admin: {
            id: 'admin-1',
            name: '관리자',
            contact: '01012345678',
            email: 'admin@test.com',
          },
        } as any,
      ]);
      mockedRepo.countApartments.mockResolvedValue(1);

      const result = await apartmentService.getApartments({
        page: 1,
        limit: 10,
      });

      expect(result.totalCount).toBe(1);
      expect(result.apartments[0]).toEqual({
        id: 'ap-1',
        name: '위리브 1단지',
        address: '서울시 강남구',
        officeNumber: '0212345678',
        description: '설명',
        startComplexNumber: '1',
        endComplexNumber: '3',
        startDongNumber: '101',
        endDongNumber: '120',
        startFloorNumber: '1',
        endFloorNumber: '30',
        startHoNumber: '1',
        endHoNumber: '8',
        apartmentStatus: 'APPROVED',
        adminId: 'admin-1',
        adminName: '관리자',
        adminContact: '01012345678',
        adminEmail: 'admin@test.com',
      });
    });
  });

  describe('getApartmentById', () => {
    it('아파트 상세를 범위 정보와 함께 반환한다', async () => {
      mockedRepo.findApartmentById.mockResolvedValue({
        id: 'ap-1',
        name: '위리브 1단지',
        address: '서울시 강남구',
        officeNumber: '0212345678',
        description: '설명',
        startComplexNumber: 1,
        endComplexNumber: 3,
        startDongNumber: 101,
        endDongNumber: 120,
        startFloorNumber: 1,
        endFloorNumber: 30,
        startHoNumber: 1,
        endHoNumber: 8,
        apartmentStatus: 'PENDING',
        admin: {
          id: 'admin-1',
          name: '관리자',
          contact: '01012345678',
          email: 'admin@test.com',
        },
      } as any);

      const result = await apartmentService.getApartmentById('ap-1');

      expect(result.apartmentStatus).toBe('PENDING');
      expect(result.adminEmail).toBe('admin@test.com');
      expect(result.dongRange).toEqual({
        start: '101',
        end: '120',
      });
      expect(result.hoRange).toEqual({
        start: '1',
        end: '8',
      });
    });

    it('아파트가 없으면 NotFoundError를 던진다', async () => {
      mockedRepo.findApartmentById.mockResolvedValue(null);

      await expect(
        apartmentService.getApartmentById('missing')
      ).rejects.toBeInstanceOf(NotFoundError);
    });
  });

  describe('getPublicApartmentById', () => {
    it('공개 아파트 상세는 제한된 정보만 반환한다', async () => {
      mockedRepo.findPublicApartmentById.mockResolvedValue({
        id: 'ap-1',
        name: '위리브 1단지',
        address: '서울시 강남구',
        startComplexNumber: 1,
        endComplexNumber: 3,
        startDongNumber: 101,
        endDongNumber: 120,
        startFloorNumber: 1,
        endFloorNumber: 30,
        startHoNumber: 1,
        endHoNumber: 8,
      });

      const result = await apartmentService.getPublicApartmentById('ap-1');

      expect(result).toEqual({
        id: 'ap-1',
        name: '위리브 1단지',
        address: '서울시 강남구',
        startComplexNumber: '1',
        endComplexNumber: '3',
        startDongNumber: '101',
        endDongNumber: '120',
        startFloorNumber: '1',
        endFloorNumber: '30',
        startHoNumber: '1',
        endHoNumber: '8',
        dongRange: {
          start: '101',
          end: '120',
        },
        hoRange: {
          start: '1',
          end: '8',
        },
      });
    });
  });
});
