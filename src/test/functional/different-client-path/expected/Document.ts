import { z } from 'zod';

export const DocumentModel = z.object({
  id: z.string(),
  filename: z.string(),
  author: z.string(),
  contents: z.string(),
  created: z.union([z.date(), z.string().datetime()]),
  updated: z.union([z.date(), z.string().datetime()]),
});
