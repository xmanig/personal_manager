import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';

export function validate(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: result.error.issues.map((i) => ({
          path: i.path.join('.'),
          message: i.message,
        })),
      });
      return;
    }
    req.body = result.data;
    next();
  };
}

export const updateBillSchema = z.object({
  vendor: z.string().optional(),
  amount: z.number().optional(),
  currency: z.string().optional(),
  dueDate: z.string().optional(),
  paidDate: z.string().nullable().optional(),
  category: z.string().optional(),
  status: z.string().optional(),
  notes: z.string().nullable().optional(),
  invoiceNumber: z.string().optional(),
  localAmount: z.number().optional(),
  localCurrency: z.string().optional(),
  lineItems: z.array(z.object({ description: z.string(), amount: z.number() })).optional(),
});

export const fetchGmailSchema = z.object({
  rules: z.object({
    senderContains: z.string().optional(),
    subjectContains: z.string().optional(),
    hasAttachment: z.boolean().optional(),
    dateRange: z.object({ from: z.string().optional(), to: z.string().optional() }).optional(),
  }).optional(),
  googleAccountId: z.string().optional(),
});

export const parseBillSchema = z.object({
  rawText: z.string().min(1, 'rawText is required'),
});

export const createEventSchema = z.object({
  title: z.string().min(1, 'Title is required').max(500),
  description: z.string().max(5000).optional(),
  startTime: z.string().min(1, 'startTime is required'),
  endTime: z.string().min(1, 'endTime is required'),
  location: z.string().max(500).optional(),
  isAllDay: z.boolean().optional(),
  googleAccountId: z.string().optional(),
});

export const updateEventSchema = createEventSchema.partial();

export const updateLabelSchema = z.object({
  label: z.string().min(1, 'Label is required'),
});
