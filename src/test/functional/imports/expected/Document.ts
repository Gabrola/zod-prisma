import { z } from 'zod';
import { Status } from '../prisma/.client';

export const DocumentModel = z.object({
  id: z.string(),
  filename: z.string(),
  author: z.string(),
  contents: z.string(),
  status: z.nativeEnum(Status),
  created: z
    .date()
    .transform((v) => v.toISOString())
    .pipe(z.string().datetime()),
  updated: z
    .date()
    .transform((v) => v.toISOString())
    .pipe(z.string().datetime()),
});
