import { z } from 'zod';
import { CompletePostInput, CompletePostOutput, postSchema } from './index';

export const _userSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
});

export interface CompleteUserInput extends z.input<typeof _userSchema> {
  posts: CompletePostInput[];
}

export interface CompleteUserOutput extends z.infer<typeof _userSchema> {
  posts: CompletePostOutput[];
}

/**
 * userSchema contains all relations on your model in addition to the scalars
 *
 * NOTE: Lazy required in case of potential circular dependencies within schema
 */
export const userSchema: z.ZodSchema<CompleteUserOutput, z.ZodTypeDef, CompleteUserInput> = z.lazy(
  () =>
    _userSchema.extend({
      posts: postSchema.array(),
    })
);
