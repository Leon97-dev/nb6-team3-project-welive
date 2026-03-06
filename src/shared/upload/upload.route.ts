import { Router } from 'express';
import UploadController from './upload.controller';
import { imageUpload } from '../../config/multer';
import asyncHandler from '../../middlewares/async-handler';

const router = Router();

// 1) 이미지 업로드
router.post(
  '/',
  imageUpload.single('image'),
  asyncHandler(UploadController.upload)
);

export default router;
