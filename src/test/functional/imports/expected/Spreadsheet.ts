import { z } from 'zod';
import {
  CompletePresentationInput,
  CompletePresentationOutput,
  RelatedPresentationModel,
} from './index';

// Helper schema for JSON fields
type Literal = boolean | number | string;
type Json = Literal | { [key: string]: Json } | Json[];
const literalSchema = z.union([z.string(), z.number(), z.boolean()]);
const jsonSchema: z.ZodSchema<Json> = z.lazy(() =>
  z.union([literalSchema, z.array(jsonSchema), z.record(jsonSchema)])
);

export const SpreadsheetModel = z.object({
  id: z.string(),
  filename: z.string(),
  author: z.string(),
  contents: jsonSchema,
  created: z
    .date()
    .transform((v) => v.toISOString())
    .pipe(z.string().datetime()),
  updated: z
    .date()
    .transform((v) => v.toISOString())
    .pipe(z.string().datetime()),
});

export interface CompleteSpreadsheetInput extends z.input<typeof SpreadsheetModel> {
  presentations: CompletePresentationInput[];
}

export interface CompleteSpreadsheetOutput extends z.infer<typeof SpreadsheetModel> {
  presentations: CompletePresentationOutput[];
}

/**
 * RelatedSpreadsheetModel contains all relations on your model in addition to the scalars
 *
 * NOTE: Lazy required in case of potential circular dependencies within schema
 */
export const RelatedSpreadsheetModel: z.ZodSchema<
  CompleteSpreadsheetOutput,
  z.ZodTypeDef,
  CompleteSpreadsheetInput
> = z.lazy(() =>
  SpreadsheetModel.extend({
    presentations: RelatedPresentationModel.array(),
  })
);
