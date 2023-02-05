import { z } from 'zod';
import { Role } from './enums';

export const DocumentModel = z.object({
  id: z.string(),
  filename: z.string(),
  author: z.string(),
  contents: z.string(),
  role: z.nativeEnum(Role),
  created: z.date(),
  updated: z.date(),
});
