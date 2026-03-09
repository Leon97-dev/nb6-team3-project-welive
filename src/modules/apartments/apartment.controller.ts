import type { Request, Response } from 'express';
import { apartmentService } from './apartment.service';
import {
  validateApartmentIdParam,
  validateListApartmentsQuery,
  validateListPublicApartmentsQuery,
} from './apartment.validator';

// ==============================================
// ⭐️ 아파트 관련 Controller
// ==============================================
export const apartmentController = {
  // 1) 공개 아파트 목록 조회
  async getPublicApartments(req: Request, res: Response): Promise<void> {
    const query = validateListPublicApartmentsQuery(req.query);
    const result = await apartmentService.getPublicApartments(query);

    res.status(200).json(result);
  },
  // 2) 아파트 목록 조회 (관리자용)
  async getApartments(req: Request, res: Response): Promise<void> {
    const query = validateListApartmentsQuery(req.query);
    const apartmentId =
      req.user?.role === 'ADMIN' ? req.user.apartmentId : null;
    const result = await apartmentService.getApartments(query, apartmentId);

    res.status(200).json(result);
  },
  // 3) 아파트 ID로 조회
  async getApartmentById(req: Request, res: Response): Promise<void> {
    const { id } = validateApartmentIdParam(req.params);
    const apartmentId =
      req.user?.role === 'ADMIN' ? req.user.apartmentId : null;
    const result = await apartmentService.getApartmentById(id, apartmentId);

    res.status(200).json(result);
  },
  // 4) 공개 아파트 ID로 조회
  async getPublicApartmentById(req: Request, res: Response): Promise<void> {
    const { id } = validateApartmentIdParam(req.params);
    const result = await apartmentService.getPublicApartmentById(id);

    res.status(200).json(result);
  },
};
