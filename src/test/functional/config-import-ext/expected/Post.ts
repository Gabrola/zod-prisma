import { z } from 'zod';
import * as imports from '../prisma/zod-utils.js';
import { Status } from './enums.js';
import { CompleteUserInput, CompleteUserOutput, RelatedUserModel } from './index.js';

export const PostModel = z.object({
  id: z.string(),
  title: z.string(),
  contents: z.string(),
  status: z.nativeEnum(Status),
  tips: imports.decimalSchema,
  userId: z.string(),
});

export interface CompletePostInput extends z.input<typeof PostModel> {
  author: CompleteUserInput;
}

export interface CompletePostOutput extends z.infer<typeof PostModel> {
  author: CompleteUserOutput;
}

/**
 * RelatedPostModel contains all relations on your model in addition to the scalars
 *
 * NOTE: Lazy required in case of potential circular dependencies within schema
 */
export const RelatedPostModel: z.ZodSchema<CompletePostOutput, z.ZodTypeDef, CompletePostInput> =
  z.lazy(() =>
    PostModel.extend({
      author: RelatedUserModel,
    })
  );
