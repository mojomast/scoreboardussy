import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';

// Custom error class for validation failures
export class ValidationError extends Error {
  constructor(
    message: string,
    public details: z.ZodIssue[] = []
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

// Helper to format Zod errors into readable messages
export function formatZodErrors(error: ZodError): string[] {
  return error.issues.map((issue) => {
    const path = issue.path.join('.');
    return `${path}: ${issue.message}`;
  });
}

// Generic validation middleware factory
export function validateBody(schema: z.ZodTypeAny) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          error: 'Validation failed',
          details: formatZodErrors(error),
        });
        return;
      }
      next(error);
    }
  };
}

export function validateParams(schema: z.ZodTypeAny) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.params = schema.parse(req.params);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          error: 'Invalid URL parameters',
          details: formatZodErrors(error),
        });
        return;
      }
      next(error);
    }
  };
}

export function validateQuery(schema: z.ZodTypeAny) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.query = schema.parse(req.query);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          error: 'Invalid query parameters',
          details: formatZodErrors(error),
        });
        return;
      }
      next(error);
    }
  };
}

// Common schemas for reuse
export const roomCodeSchema = z.string().regex(/^[A-Z0-9]{6}$/, 'Room code must be 6 alphanumeric characters');

export const scoreUpdateSchema = z.object({
  teamId: z.enum(['team1', 'team2']),
  delta: z.number().int().min(-100).max(100),
});

export const teamUpdateSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be hex format').optional(),
});

export const createRoomSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  expiresInHours: z.number().int().min(1).max(48).optional(),
});

export const timerControlSchema = z.object({
  action: z.enum(['start', 'pause', 'resume', 'stop', 'reset']),
  duration: z.number().int().min(0).max(3600).optional(),
});
