import { z } from 'zod';
import { CompleteUserInput, CompleteUserOutput, userSchema } from './index';

export const _postSchema = z.object({
  id: z.string(),
  title: z.string(),
  contents: z.string(),
  userId: z.string(),
});

export interface CompletePostInput extends z.input<typeof _postSchema> {
  author: CompleteUserInput;
}

export interface CompletePostOutput extends z.infer<typeof _postSchema> {
  author: CompleteUserOutput;
}

/**
 * postSchema contains all relations on your model in addition to the scalars
 *
 * NOTE: Lazy required in case of potential circular dependencies within schema
 */
export const postSchema: z.ZodSchema<CompletePostOutput, z.ZodTypeDef, CompletePostInput> = z.lazy(
  () =>
    _postSchema.extend({
      author: userSchema,
    })
);
