import type { DMMF } from '@prisma/generator-helper';
import { z } from 'zod';
import { computeCustomSchema, computeModifiers } from './docs';
import { configSchema } from './config';
import { assertNever } from './util';

export const getZodConstructor = ({
  field,
  dateType,
  nullableType,
  getRelatedModelName = (name: string | DMMF.SchemaEnum | DMMF.OutputType | DMMF.SchemaArg) =>
    name.toString(),
}: {
  field: DMMF.Field;
  dateType: z.infer<typeof configSchema.shape.dateTimeSchema>;
  nullableType: 'nullable' | 'nullish';
  getRelatedModelName?: (
    name: string | DMMF.SchemaEnum | DMMF.OutputType | DMMF.SchemaArg
  ) => string;
}) => {
  let zodType = 'z.unknown()';
  let extraModifiers: string[] = [''];
  if (field.kind === 'scalar') {
    switch (field.type) {
      case 'String':
        zodType = 'z.string()';
        break;
      case 'Int':
        zodType = 'z.number()';
        extraModifiers.push('int()');
        break;
      case 'BigInt':
        zodType = 'z.bigint()';
        break;
      case 'DateTime': {
        switch (dateType) {
          case 'date':
            zodType = 'z.date()';
            break;
          case 'union':
            zodType = 'z.union([z.date(), z.string().datetime()])';
            break;
          case 'transform':
            zodType = 'z.date().transform((v) => v.toISOString()).pipe(z.string().datetime())';
            break;
          default:
            assertNever(dateType);
            break;
        }
        break;
      }
      case 'Float':
        zodType = 'z.number()';
        break;
      case 'Decimal':
        zodType = 'z.number()';
        break;
      case 'Json':
        zodType = 'jsonSchema';
        break;
      case 'Boolean':
        zodType = 'z.boolean()';
        break;
      // TODO: Proper type for bytes fields
      case 'Bytes':
        zodType = 'z.unknown()';
        break;
    }
  } else if (field.kind === 'enum') {
    zodType = `z.nativeEnum(${field.type})`;
  } else if (field.kind === 'object') {
    zodType = getRelatedModelName(field.type);
  }

  if (field.isList) extraModifiers.push('array()');
  if (field.documentation) {
    zodType = computeCustomSchema(field.documentation) ?? zodType;
    extraModifiers.push(...computeModifiers(field.documentation));
  }
  if (!field.isRequired && field.type !== 'Json') {
    switch (nullableType) {
      case 'nullable':
        extraModifiers.push('nullable()');
        break;
      case 'nullish':
        extraModifiers.push('nullish()');
        break;
      default:
        assertNever(nullableType);
        break;
    }
  }
  // if (field.hasDefaultValue) extraModifiers.push('optional()')

  return `${zodType}${extraModifiers.join('.')}`;
};
