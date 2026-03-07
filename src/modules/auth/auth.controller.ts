import type { Request, Response } from 'express';
import {
  UnauthorizedError,
  ValidationError,
} from '../../middlewares/error-handler';
import { authService } from './auth.service';
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  accessCookieOptions,
  refreshCookieOptions,
} from './auth.token';
import {
  validateLogin,
  validateSignupAdmin,
  validateSignupSuperAdmin,
  validateSignupUser,
  validateUpdateAdmin,
  validateUpdateApprovalStatus,
} from './auth.validator';

// 경로 파라미터에서 필요한 값을 추출하는 헬퍼 함수
const getPathParam = (value: string | string[] | undefined, name: string) => {
  if (typeof value === 'string' && value.trim().length > 0) return value;
  throw new ValidationError(`${name} 값이 필요합니다`);
};

// ==============================================
// ⭐️ 인증 관련 Controller
// ==============================================
export const authController = {
  // 1) 사용자 회원가입
  async signupUser(req: Request, res: Response): Promise<void> {
    const input = validateSignupUser(req.body);
    const result = await authService.signupUser(input);

    res.status(201).json(result);
  },
  // 2) 관리자 회원가입
  async signupAdmin(req: Request, res: Response): Promise<void> {
    const input = validateSignupAdmin(req.body);
    const result = await authService.signupAdmin(input);

    res.status(201).json(result);
  },
  // 3) 슈퍼 관리자 회원가입
  async signupSuperAdmin(req: Request, res: Response): Promise<void> {
    const input = validateSignupSuperAdmin(req.body);
    const result = await authService.signupSuperAdmin(input);

    res.status(201).json(result);
  },
  // 4) 로그인
  async login(req: Request, res: Response): Promise<void> {
    const input = validateLogin(req.body);
    const result = await authService.login(input);

    res.cookie(ACCESS_TOKEN_COOKIE, result.accessToken, accessCookieOptions);
    res.cookie(REFRESH_TOKEN_COOKIE, result.refreshToken, refreshCookieOptions);

    res.status(200).json(result.user);
  },
  // 5) 토큰 리프레시
  async refresh(req: Request, res: Response): Promise<void> {
    const refreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE];
    if (!refreshToken) {
      throw new UnauthorizedError('리프레시 토큰이 필요합니다');
    }

    const tokens = await authService.refresh(refreshToken);

    res.cookie(ACCESS_TOKEN_COOKIE, tokens.accessToken, accessCookieOptions);
    res.cookie(REFRESH_TOKEN_COOKIE, tokens.refreshToken, refreshCookieOptions);

    res.status(200).json({ message: '작업이 성공적으로 완료되었습니다' });
  },
  // 6) 로그아웃
  async logout(req: Request, res: Response): Promise<void> {
    const refreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE];
    await authService.logout(refreshToken);

    res.clearCookie(ACCESS_TOKEN_COOKIE, { path: '/' });
    res.clearCookie(REFRESH_TOKEN_COOKIE, { path: '/' });

    res.status(204).send();
  },
  // 7) 관리자 승인 상태 업데이트
  async updateAdminStatus(req: Request, res: Response): Promise<void> {
    const input = validateUpdateApprovalStatus(req.body);
    const adminId = getPathParam(req.params.adminId, 'adminId');
    await authService.updateAdminStatus(adminId, input);

    res.status(200).json({ message: '작업이 성공적으로 완료되었습니다' });
  },
  // 8) 관리자 승인 상태 일괄 업데이트
  async updateAdminStatusBulk(req: Request, res: Response): Promise<void> {
    const input = validateUpdateApprovalStatus(req.body);
    await authService.updateAdminStatusBulk(input);

    res.status(200).json({ message: '작업이 성공적으로 완료되었습니다' });
  },
  // 9) 거주자 승인 상태 업데이트
  async updateResidentStatus(req: Request, res: Response): Promise<void> {
    const input = validateUpdateApprovalStatus(req.body);
    const residentId = getPathParam(req.params.residentId, 'residentId');
    await authService.updateResidentStatus(
      residentId,
      input,
      req.user?.apartmentId
    );
    res.status(200).json({ message: '작업이 성공적으로 완료되었습니다' });
  },
  // 10) 거주자 승인 상태 일괄 업데이트
  async updateResidentStatusBulk(req: Request, res: Response): Promise<void> {
    const input = validateUpdateApprovalStatus(req.body);
    await authService.updateResidentStatusBulk(input, req.user?.apartmentId);

    res.status(200).json({ message: '작업이 성공적으로 완료되었습니다' });
  },
  // 11) 관리자 정보 업데이트
  async updateAdminInfo(req: Request, res: Response): Promise<void> {
    const input = validateUpdateAdmin(req.body);
    const adminId = getPathParam(req.params.adminId, 'adminId');
    await authService.updateAdminInfo(adminId, input);

    res.status(200).json({ message: '작업이 성공적으로 완료되었습니다' });
  },
  // 12) 관리자 삭제
  async deleteAdmin(req: Request, res: Response): Promise<void> {
    const adminId = getPathParam(req.params.adminId, 'adminId');
    await authService.deleteAdmin(adminId);

    res.status(200).json({ message: '작업이 성공적으로 완료되었습니다' });
  },
  // 13) 거부된 계정 정리
  async cleanupRejectedAccounts(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      throw new UnauthorizedError('로그인이 필요합니다');
    }

    await authService.cleanupRejectedAccounts(
      req.user.role,
      req.user.apartmentId
    );

    res.status(200).json({ message: '작업이 성공적으로 완료되었습니다' });
  },
};
