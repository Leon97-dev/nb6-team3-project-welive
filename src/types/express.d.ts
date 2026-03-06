import 'express';
import type { Role } from '@prisma/client';

declare global {
  namespace Express {
    interface UserContext {
      id: string;
      role: Role;
      apartmentId?: string | null;
      building?: string | null;
    }

    interface Request {
      user?: UserContext;
      requestId?: string;
    }
  }
}

export {};
