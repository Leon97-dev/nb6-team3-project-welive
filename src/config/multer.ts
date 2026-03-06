/**
 * @name Multer
 * @category Config
 * @description
 * Multer는 Express.js에서 파일 업로드를 처리하기 위한 미들웨어입니다.
 * 이 모듈에서는 Multer의 저장 방식, 파일 필터링, 크기 제한 등을 설정하여,
 * 안전하고 효율적인 파일 업로드 기능을 제공합니다.
 * 업로드된 파일은 서버의 지정된 폴더에 저장되며, 파일 이름은 랜덤하게 생성됩니다.
 * @see https://www.npmjs.com/package/multer
 * @warning
 * 업로드된 파일은 보안 위험이 될 수 있으므로, 허용된 MIME 타입과 크기 제한을 반드시 설정해야 합니다.
 * 또한, 업로드된 파일을 처리할 때는 적절한 권한과 검증을 수행하여 악성 파일로부터 서버를 보호해야 합니다.
 * 이 모듈에서는 이미지, PDF, CSV 파일만 허용하도록 설정되어 있습니다.
 * 필요에 따라 fileFilter 함수를 수정하여 허용되는 파일 유형을 조정할 수 있습니다.
 */

import multer, { type FileFilterCallback } from 'multer';
import path from 'path';
import crypto from 'crypto';
import fs from 'fs';
import type { Request } from 'express';
import { ValidationError } from '../middlewares/error-handler';

// 1) 파일 크기 제한
const limits = { fileSize: 5 * 1024 * 1024 };

// 2) 업로드 절대 경로
const uploadDir = path.join(process.cwd(), 'public', 'uploads');

// 3) 업로드 폴더 생성 (없으면 자동 생성)
fs.mkdirSync(uploadDir, { recursive: true });

// 4) 지원하지 않는 파일 형식 거부 콜백
const rejectInvalidFile = (cb: FileFilterCallback) => {
  cb(new ValidationError('지원하지 않는 파일 형식입니다'));
};

// 5) 파일 저장 방식 설정
const storage = multer.diskStorage({
  // 5-1) 경로 설정
  destination: (_req, _file, cb) => cb(null, uploadDir),
  // 5-2) 이름 설정
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const validExt = ['.jpg', '.jpeg', '.png', '.pdf', '.csv'].includes(ext)
      ? ext
      : '';
    // 5-3) 랜덤 문자열로 파일 이름 생성: 중복 해결
    cb(null, crypto.randomUUID() + validExt);
    // 다른 방식도 가능
    // `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
  },
});

// 6) 허용 MIME 타입 필터링
const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  const validType = [
    'image/jpeg',
    'image/png',
    'application/pdf',
    'text/csv',
    'application/vnd.ms-excel',
  ].includes(file.mimetype);
  if (validType) {
    cb(null, true);
  } else {
    rejectInvalidFile(cb);
  }
};

const imageFileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  const validType = ['image/jpeg', 'image/png'].includes(file.mimetype);
  if (validType) {
    cb(null, true);
  } else {
    rejectInvalidFile(cb);
  }
};

// 7) 최종 업로드 인스턴스
export const upload = multer({
  limits,
  storage,
  fileFilter,
});

export const imageUpload = multer({
  limits,
  storage,
  fileFilter: imageFileFilter,
});
