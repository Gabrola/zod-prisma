import { z } from 'zod';

export const DocumentModel = z.object({
  id: z.string(),
  filename: z.string(),
  author: z.string(),
  contents: z.string(),
  created: z
    .date()
    .transform((v) => v.toISOString())
    .pipe(z.string().datetime()),
  updated: z
    .date()
    .transform((v) => v.toISOString())
    .pipe(z.string().datetime()),
});
