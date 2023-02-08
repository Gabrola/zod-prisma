import { SemicolonPreference } from 'typescript';
import { z } from 'zod';

const configBoolean = z.enum(['true', 'false']).transform((arg) => JSON.parse(arg));

export const configSchema = z.object({
  relationModel: configBoolean.default('true').or(z.literal('default')),
  modelSuffix: z.string().default('Model'),
  modelCase: z.enum(['PascalCase', 'camelCase']).default('PascalCase'),
  useDecimalJs: configBoolean.default('false'),
  imports: z.string().optional(),
  prismaJsonNullability: configBoolean.default('true'),
  fileNameCase: z.enum(['PascalCase', 'camelCase', 'snake_case']).default('PascalCase'),
  enumFile: z.string().optional(),
  indentSize: z.number().default(2),
  indentType: z.enum(['tab', 'space']).default('space'),
  singleQuote: configBoolean.default('false'),
  semicolon: z.nativeEnum(SemicolonPreference).default(SemicolonPreference.Insert),
  trailingCommas: configBoolean.default('true'),
  ignoreRelationTypes: configBoolean.default('false').optional(),
  dateTimeSchema: z.enum(['date', 'union', 'transform']).default('date'),
  nullableType: z.enum(['nullish', 'nullable']).default('nullish'),
});

export type Config = z.infer<typeof configSchema>;

export type PrismaOptions = {
  schemaPath: string;
  outputPath: string;
  clientPath: string;
};

export type Names = {
  model: string;
  related: string;
};
