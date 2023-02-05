import { z } from 'zod';
import {
  CompleteSpreadsheetInput,
  CompleteSpreadsheetOutput,
  RelatedSpreadsheetModel,
} from './index';

export const PresentationModel = z.object({
  id: z.string(),
  filename: z.string(),
  author: z.string(),
  contents: z.string().array(),
  created: z
    .date()
    .transform((v) => v.toISOString())
    .pipe(z.string().datetime()),
  updated: z
    .date()
    .transform((v) => v.toISOString())
    .pipe(z.string().datetime()),
});

export interface CompletePresentationInput extends z.input<typeof PresentationModel> {
  spreadsheets: CompleteSpreadsheetInput[];
}

export interface CompletePresentationOutput extends z.infer<typeof PresentationModel> {
  spreadsheets: CompleteSpreadsheetOutput[];
}

/**
 * RelatedPresentationModel contains all relations on your model in addition to the scalars
 *
 * NOTE: Lazy required in case of potential circular dependencies within schema
 */
export const RelatedPresentationModel: z.ZodSchema<
  CompletePresentationOutput,
  z.ZodTypeDef,
  CompletePresentationInput
> = z.lazy(() =>
  PresentationModel.extend({
    spreadsheets: RelatedSpreadsheetModel.array(),
  })
);
