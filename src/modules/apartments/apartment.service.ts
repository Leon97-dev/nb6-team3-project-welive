import { NotFoundError } from '../../middlewares/error-handler';
import type {
  ApartmentListPublicResponseDto,
  ApartmentListResponseDto,
  ApartmentPublicResponseWithRangeDto,
  ApartmentResponseDto,
  ApartmentResponseWithRangeDto,
  ListApartmentsQueryDto,
  ListPublicApartmentsQueryDto,
} from './apartment.dto';
import { apartmentRepository } from './apartment.repository';

// ==============================================
// ⭐️ 아파트 관련 Utility
// ==============================================
// 1) 숫자 텍스트로 변환
const toText = (value: number): string => String(value);

// 2) 동 범위 변환
const toDongRange = (startDongNumber: number, endDongNumber: number) => ({
  start: `${startDongNumber}01`,
  end: `${endDongNumber}08`,
});

// 3) 호 범위 변환
const toHoRange = (startDongNumber: number, endDongNumber: number) => ({
  start: `${startDongNumber}01`,
  end: `${endDongNumber}2508`,
});

// 4) 아파트 응답 변환
const toApartmentResponse = (apartment: {
  id: string;
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
  apartmentStatus: 'APPROVED' | 'PENDING' | 'REJECTED';
  admin: {
    id: string;
    name: string;
    contact: string;
    email: string;
  } | null;
}): ApartmentResponseDto => ({
  id: apartment.id,
  name: apartment.name,
  address: apartment.address,
  officeNumber: apartment.officeNumber,
  description: apartment.description,
  startComplexNumber: toText(apartment.startComplexNumber),
  endComplexNumber: toText(apartment.endComplexNumber),
  startDongNumber: toText(apartment.startDongNumber),
  endDongNumber: toText(apartment.endDongNumber),
  startFloorNumber: toText(apartment.startFloorNumber),
  endFloorNumber: toText(apartment.endFloorNumber),
  startHoNumber: toText(apartment.startHoNumber),
  endHoNumber: toText(apartment.endHoNumber),
  apartmentStatus: apartment.apartmentStatus,
  adminId: apartment.admin?.id ?? null,
  adminName: apartment.admin?.name ?? null,
  adminContact: apartment.admin?.contact ?? null,
  adminEmail: apartment.admin?.email ?? null,
});

// ==============================================
// ⭐️ 아파트 관련 Service
// ==============================================
export const apartmentService = {
  // 1) 공개 아파트 목록 조회
  async getPublicApartments(
    query: ListPublicApartmentsQueryDto
  ): Promise<ApartmentListPublicResponseDto> {
    const apartments = await apartmentRepository.findPublicApartments(query);
    const count = await apartmentRepository.countPublicApartments(query);

    return {
      apartments,
      count,
    };
  },
  // 2) 아파트 목록 조회 (관리자용)
  async getApartments(
    query: ListApartmentsQueryDto,
    apartmentId?: string | null
  ): Promise<ApartmentListResponseDto> {
    const apartments = await apartmentRepository.findApartments(
      query,
      apartmentId
    );
    const totalCount = await apartmentRepository.countApartments(
      query,
      apartmentId
    );

    return {
      apartments: apartments.map(toApartmentResponse),
      totalCount,
    };
  },
  // 3) 아파트 ID로 조회
  async getApartmentById(
    id: string,
    apartmentId?: string | null
  ): Promise<ApartmentResponseWithRangeDto> {
    const apartment = await apartmentRepository.findApartmentById(
      id,
      apartmentId
    );

    if (!apartment) {
      throw new NotFoundError('아파트를 찾을 수 없습니다');
    }

    return {
      ...toApartmentResponse(apartment),
      dongRange: toDongRange(
        apartment.startDongNumber,
        apartment.endDongNumber
      ),
      hoRange: toHoRange(apartment.startDongNumber, apartment.endDongNumber),
    };
  },
  // 4) 공개 아파트 ID로 조회
  async getPublicApartmentById(
    id: string
  ): Promise<ApartmentPublicResponseWithRangeDto> {
    const apartment = await apartmentRepository.findPublicApartmentById(id);

    if (!apartment) {
      throw new NotFoundError('아파트를 찾을 수 없습니다');
    }

    return {
      id: apartment.id,
      name: apartment.name,
      address: apartment.address,
      startComplexNumber: toText(apartment.startComplexNumber),
      endComplexNumber: toText(apartment.endComplexNumber),
      startDongNumber: toText(apartment.startDongNumber),
      endDongNumber: toText(apartment.endDongNumber),
      startFloorNumber: toText(apartment.startFloorNumber),
      endFloorNumber: toText(apartment.endFloorNumber),
      startHoNumber: toText(apartment.startHoNumber),
      endHoNumber: toText(apartment.endHoNumber),
      dongRange: toDongRange(
        apartment.startDongNumber,
        apartment.endDongNumber
      ),
      hoRange: toHoRange(apartment.startDongNumber, apartment.endDongNumber),
    };
  },
};
