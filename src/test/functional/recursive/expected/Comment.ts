import { z } from 'zod';

export const CommentModel = z.object({
  id: z.string(),
  author: z.string(),
  contents: z.string(),
  parentId: z.string(),
});

export interface CompleteCommentInput extends z.input<typeof CommentModel> {
  parent: CompleteCommentInput;
  children: CompleteCommentInput[];
}

export interface CompleteCommentOutput extends z.infer<typeof CommentModel> {
  parent: CompleteCommentOutput;
  children: CompleteCommentOutput[];
}

/**
 * RelatedCommentModel contains all relations on your model in addition to the scalars
 *
 * NOTE: Lazy required in case of potential circular dependencies within schema
 */
export const RelatedCommentModel: z.ZodSchema<
  CompleteCommentOutput,
  z.ZodTypeDef,
  CompleteCommentInput
> = z.lazy(() =>
  CommentModel.extend({
    parent: RelatedCommentModel,
    children: RelatedCommentModel.array(),
  })
);
