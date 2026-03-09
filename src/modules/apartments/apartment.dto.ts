import type { ApartmentStatus } from '@prisma/client';

// ==============================================
// ⭐️ 아파트 관련 DTO
// ==============================================
// 1) 아파트 공개 목록 조회
export interface ListPublicApartmentsQueryDto {
  keyword?: string | undefined;
  name?: string | undefined;
  address?: string | undefined;
}

// 2) 아파트 목록 조회
export interface ListApartmentsQueryDto {
  name?: string | undefined;
  address?: string | undefined;
  searchKeyword?: string | undefined;
  apartmentStatus?: ApartmentStatus | undefined;
  page: number;
  limit: number;
}

// 3) 아파트 ID 경로
export interface ApartmentIdParamDto {
  id: string;
}

// 4) 공개 아파트 응답
export interface ApartmentPublicDto {
  id: string;
  name: string;
  address: string;
}

// 5) 동/호 범위 응답
export interface ApartmentRangeDto {
  start: string;
  end: string;
}

// 6) 아파트 목록/상세 공통 응답
export interface ApartmentResponseDto {
  id: string;
  name: string;
  address: string;
  officeNumber: string;
  description: string;
  startComplexNumber: string;
  endComplexNumber: string;
  startDongNumber: string;
  endDongNumber: string;
  startFloorNumber: string;
  endFloorNumber: string;
  startHoNumber: string;
  endHoNumber: string;
  apartmentStatus: ApartmentStatus;
  adminId: string | null;
  adminName: string | null;
  adminContact: string | null;
  adminEmail: string | null;
}

// 7) 아파트 상세 응답
export interface ApartmentResponseWithRangeDto extends ApartmentResponseDto {
  dongRange: ApartmentRangeDto;
  hoRange: ApartmentRangeDto;
}

// 8) 공개 아파트 상세 응답
export interface ApartmentPublicResponseWithRangeDto {
  id: string;
  name: string;
  address: string;
  startComplexNumber: string;
  endComplexNumber: string;
  startDongNumber: string;
  endDongNumber: string;
  startFloorNumber: string;
  endFloorNumber: string;
  startHoNumber: string;
  endHoNumber: string;
  dongRange: ApartmentRangeDto;
  hoRange: ApartmentRangeDto;
}

// 9) 공개 아파트 목록 응답
export interface ApartmentListPublicResponseDto {
  apartments: ApartmentPublicDto[];
  count: number;
}

// 10) 아파트 목록 응답
export interface ApartmentListResponseDto {
  apartments: ApartmentResponseDto[];
  totalCount: number;
}
