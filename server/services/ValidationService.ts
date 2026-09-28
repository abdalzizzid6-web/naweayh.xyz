import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema, ZodError } from 'zod';

export interface ValidationTargets {
  body?: ZodSchema<any>;
  query?: ZodSchema<any>;
  params?: ZodSchema<any>;
}

export function validateRequest(schemas: ValidationTargets) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (schemas.params) {
        req.params = await schemas.params.parseAsync(req.params);
      }
      if (schemas.query) {
        req.query = await schemas.query.parseAsync(req.query);
      }
      if (schemas.body) {
        req.body = await schemas.body.parseAsync(req.body);
      }
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const issues = err.issues.map((i) => ({
          field: i.path.join('.'),
          message: i.message,
        }));
        return res.status(400).json({
          success: false,
          code: 'VALIDATION_ERROR',
          message: 'البيانات المدخلة غير صحيحة أو غير مكتملة',
          errors: issues,
        });
      }
      return res.status(400).json({
        success: false,
        code: 'BAD_REQUEST',
        message: 'طلب غير صالح',
      });
    }
  };
}

// Common Reusable Schemas
export const CommonSchemas = {
  // Login schema
  loginBody: z.object({
    email: z.string().trim().email({ message: 'صيغة البريد الإلكتروني غير صحيحة' }).max(255),
    password: z.string().min(1, { message: 'كلمة المرور مطلوبة' }).max(128),
  }),

  // Pagination query
  paginationQuery: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
    offset: z.string().regex(/^\d+$/).transform(Number).optional(),
    category: z.string().max(100).optional(),
    country: z.string().max(100).optional(),
    search: z.string().max(200).optional(),
    status: z.string().max(50).optional(),
  }),

  // Tracking body
  trackingBody: z.object({
    eventType: z.enum(['view', 'share', 'save']),
    articleId: z.union([z.number(), z.string().regex(/^\d+$/).transform(Number)]),
    slug: z.string().max(600).optional(),
    readingTimeSeconds: z.number().int().nonnegative().max(86400).optional(),
  }),

  // Saved article body / query
  savedArticleBody: z.object({
    deviceId: z.string().regex(/^[a-zA-Z0-9_-]{8,64}$/, { message: 'معرف الجهاز غير صالح' }).optional(),
  }),

  // AI Process body
  aiProcessBody: z.object({
    title: z.string().min(3).max(1000),
    content: z.string().min(10).max(50000),
    sourceName: z.string().max(200).optional(),
  }),

  // ID Param
  idParam: z.object({
    id: z.string().min(1).max(100),
  }),
};
