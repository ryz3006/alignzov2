import { z } from 'zod';

export const PaginationQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(20),
  cursor: z.string().optional(),
});

export type PaginationQueryDto = z.infer<typeof PaginationQuerySchema>;
