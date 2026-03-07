// ======================================
// ⭐️ 앱 설정 및 라우터 등록
// ======================================
import cookieParser from 'cookie-parser';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { corsOptions } from './config/cors';
import { errorHandler, notFoundHandler } from './middlewares/error-handler';
import { requestIdMiddleware } from './middlewares/requestId';
import { RateLimiter } from './middlewares/rate-limit';
import { optionalAuth } from './middlewares/auth';

// ======================================
// ⭐️ 도메인 라우터 등록 (추가시 여기에)
// ======================================
import healthRouter from './shared/health/health.route';
import uploadRouter from './shared/upload/upload.route';
import authRouter from './modules/auth/auth.route';
import userRouter from './modules/users/user.route';

// ======================================
// ⭐️ 환경 설정
// ======================================
export const app = express();

// Core Middleware
app.use(corsOptions);
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Cross-Cutting Middleware
app.use(requestIdMiddleware);
app.use(RateLimiter);
app.use(optionalAuth);

// Static Files
app.use(
  '/upload',
  express.static(path.join(process.cwd(), 'public', 'uploads'))
);

// ======================================
// ⭐️ 라우터 등록 (추가시 여기에)
// ======================================
// Shared Routes
app.use('/api/health', healthRouter);
app.use('/api/upload', uploadRouter);

// Domain Routes
app.use('/api/auth', authRouter);
app.use('/api/users', userRouter);

// ======================================
// ⭐️ 에러 핸들링
// ======================================
app.use(notFoundHandler);
app.use(errorHandler);
