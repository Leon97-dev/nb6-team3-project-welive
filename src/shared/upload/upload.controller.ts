import type { NextFunction, Request, Response } from 'express';
import UploadService from './upload.service';

// 1) 이미지 업로드
class UploadController {
  async upload(
    req: Request,
    res: Response,
    _next: NextFunction
  ): Promise<void> {
    // 1-1) 파일이 없는 경우 400 에러 반환
    if (!req.file) {
      res.status(400).json({ message: '이미지가 필요합니다' });
      return;
    }

    // 1-2) baseUrl 생성
    const baseUrl = `${req.protocol}://${req.get('host')}`;

    // 1-3) 이미지 URL 생성
    const imageUrl = await UploadService.getImageUrl(req.file, baseUrl);

    // 1-4) 이미지 URL 반환
    res.status(200).json({ imageUrl });
  }
}

export default new UploadController();
