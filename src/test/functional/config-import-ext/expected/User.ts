import { z } from 'zod';
import * as imports from '../prisma/zod-utils.js';
import { CompletePostInput, CompletePostOutput, RelatedPostModel } from './index.js';

export const UserModel = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  balance: imports.decimalSchema,
});

export interface CompleteUserInput extends z.input<typeof UserModel> {
  posts: CompletePostInput[];
}

export interface CompleteUserOutput extends z.infer<typeof UserModel> {
  posts: CompletePostOutput[];
}

/**
 * RelatedUserModel contains all relations on your model in addition to the scalars
 *
 * NOTE: Lazy required in case of potential circular dependencies within schema
 */
export const RelatedUserModel: z.ZodSchema<CompleteUserOutput, z.ZodTypeDef, CompleteUserInput> =
  z.lazy(() =>
    UserModel.extend({
      posts: RelatedPostModel.array(),
    })
  );
