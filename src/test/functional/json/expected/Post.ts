import { z } from 'zod';
import { CompleteUserInput, CompleteUserOutput, RelatedUserModel } from './index';

export const PostModel = z.object({
  id: z.number().int(),
  authorId: z.number().int(),
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
