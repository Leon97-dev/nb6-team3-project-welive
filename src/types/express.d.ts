import 'express';
import type { Role } from '@prisma/client';

declare global {
  namespace Express {
    interface AuthUser {
      id: string;
      role: Role;
      apartmentId: string | null;
      building: string | null;
    }

    interface Request {
      user?: AuthUser;
      requestId?: string;
    }
  }
}

export {};
