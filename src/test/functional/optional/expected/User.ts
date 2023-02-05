import { z } from 'zod';
import { CompletePostInput, CompletePostOutput, RelatedPostModel } from './index';

// Helper schema for JSON fields
type Literal = boolean | number | string;
type Json = Literal | { [key: string]: Json } | Json[];
const literalSchema = z.union([z.string(), z.number(), z.boolean()]);
const jsonSchema: z.ZodSchema<Json> = z.lazy(() =>
  z.union([literalSchema, z.array(jsonSchema), z.record(jsonSchema)])
);

export const UserModel = z.object({
  id: z.number().int(),
  meta: jsonSchema,
});

export interface CompleteUserInput extends z.input<typeof UserModel> {
  posts?: CompletePostInput | null;
}

export interface CompleteUserOutput extends z.infer<typeof UserModel> {
  posts?: CompletePostOutput | null;
}

/**
 * RelatedUserModel contains all relations on your model in addition to the scalars
 *
 * NOTE: Lazy required in case of potential circular dependencies within schema
 */
export const RelatedUserModel: z.ZodSchema<CompleteUserOutput, z.ZodTypeDef, CompleteUserInput> =
  z.lazy(() =>
    UserModel.extend({
      posts: RelatedPostModel.nullish(),
    })
  );
