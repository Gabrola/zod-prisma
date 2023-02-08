import { DMMF } from '@prisma/generator-helper';
import path from 'path';
import {
  ImportDeclarationStructure,
  SourceFile,
  StructureKind,
  VariableDeclarationKind,
} from 'ts-morph';
import { Config, PrismaOptions } from './config';
import { getJSDocs } from './docs';
import { getZodConstructor } from './types';
import { dotSlash, needsRelatedModel, useModelNames, writeArray } from './util';

export const writeImportsForModel = (
  model: DMMF.Model,
  sourceFile: SourceFile,
  config: Config,
  { schemaPath, outputPath, clientPath }: PrismaOptions
) => {
  const { relatedModelName } = useModelNames(config);
  const importList: ImportDeclarationStructure[] = [
    {
      kind: StructureKind.ImportDeclaration,
      namedImports: ['z'],
      moduleSpecifier: 'zod',
    },
  ];

  if (config.imports) {
    importList.push({
      kind: StructureKind.ImportDeclaration,
      namespaceImport: 'imports',
      moduleSpecifier: dotSlash(
        path.relative(outputPath, path.resolve(path.dirname(schemaPath), config.imports))
      ),
    });
  }

  if (config.useDecimalJs && model.fields.some((f) => f.type === 'Decimal')) {
    importList.push({
      kind: StructureKind.ImportDeclaration,
      namedImports: ['Decimal'],
      moduleSpecifier: 'decimal.js',
    });
  }

  const enumFields = model.fields.filter((f) => f.kind === 'enum');
  const relationFields = model.fields.filter((f) => f.kind === 'object');
  const relativePath = path.relative(outputPath, clientPath);

  if (enumFields.length > 0) {
    importList.push({
      kind: StructureKind.ImportDeclaration,
      isTypeOnly: enumFields.length === 0,
      moduleSpecifier: dotSlash(config.enumFile || relativePath),
      namedImports: Array.from(new Set(enumFields.map((f) => f.type))),
    });
  }

  if (config.relationModel !== false && relationFields.length > 0) {
    const filteredFields = relationFields.filter((f) => f.type !== model.name);

    if (filteredFields.length > 0) {
      importList.push({
        kind: StructureKind.ImportDeclaration,
        moduleSpecifier: './index',
        namedImports: Array.from(
          new Set(
            filteredFields.flatMap((f) => [
              `Complete${f.type}Input`,
              `Complete${f.type}Output`,
              relatedModelName(f.type),
            ])
          )
        ),
      });
    }
  }

  sourceFile.addImportDeclarations(importList);
};

export const writeTypeSpecificSchemas = (
  model: DMMF.Model,
  sourceFile: SourceFile,
  config: Config,
  _prismaOptions: PrismaOptions
) => {
  if (model.fields.some((f) => f.type === 'Json')) {
    sourceFile.addStatements((writer) => {
      writer.newLine();
      writeArray(writer, [
        '// Helper schema for JSON fields',
        `type Literal = boolean | number | string${config.prismaJsonNullability ? '' : '| null'}`,
        'type Json = Literal | { [key: string]: Json } | Json[]',
        `const literalSchema = z.union([z.string(), z.number(), z.boolean()${
          config.prismaJsonNullability ? '' : ', z.null()'
        }])`,
        'const jsonSchema: z.ZodSchema<Json> = z.lazy(() => z.union([literalSchema, z.array(jsonSchema), z.record(jsonSchema)]))',
      ]);
    });
  }

  if (config.useDecimalJs && model.fields.some((f) => f.type === 'Decimal')) {
    sourceFile.addStatements((writer) => {
      writer.newLine();
      writeArray(writer, [
        '// Helper schema for Decimal fields',
        'z',
        '.instanceof(Decimal)',
        '.or(z.string())',
        '.or(z.number())',
        '.refine((value) => {',
        '  try {',
        '    return new Decimal(value);',
        '  } catch (error) {',
        '    return false;',
        '  }',
        '})',
        '.transform((value) => new Decimal(value));',
      ]);
    });
  }
};

export const generateSchemaForModel = (
  model: DMMF.Model,
  sourceFile: SourceFile,
  config: Config,
  _prismaOptions: PrismaOptions
) => {
  const { modelName } = useModelNames(config);

  sourceFile.addVariableStatement({
    declarationKind: VariableDeclarationKind.Const,
    isExported: true,
    leadingTrivia: (writer) => writer.blankLineIfLastNot(),
    declarations: [
      {
        name: modelName(model.name),
        initializer(writer) {
          writer
            .write('z.object(')
            .inlineBlock(() => {
              model.fields
                .filter((f) => f.kind !== 'object')
                .forEach((field) => {
                  writeArray(writer, getJSDocs(field.documentation));
                  writer
                    .write(
                      `${field.name}: ${getZodConstructor({
                        field,
                        dateType: config.dateTimeSchema,
                        nullableType: config.nullableType,
                      })}`
                    )
                    .write(',')
                    .newLine();
                });
            })
            .write(')');
        },
      },
    ],
  });
};

export const generateRelatedSchemaForModel = (
  model: DMMF.Model,
  sourceFile: SourceFile,
  config: Config,
  _prismaOptions: PrismaOptions
) => {
  const { modelName, relatedModelName } = useModelNames(config);

  const relationFields = model.fields.filter((f) => f.kind === 'object');

  sourceFile.addInterface({
    name: `Complete${model.name}Input`,
    isExported: true,
    extends: [`z.input<typeof ${modelName(model.name)}>`],
    properties: relationFields.map((f) => ({
      hasQuestionToken: !f.isRequired,
      name: f.name,
      type: `Complete${f.type}Input${f.isList ? '[]' : ''}${!f.isRequired ? ' | null' : ''}`,
    })),
  });

  sourceFile.addInterface({
    name: `Complete${model.name}Output`,
    isExported: true,
    extends: [`z.infer<typeof ${modelName(model.name)}>`],
    properties: relationFields.map((f) => ({
      hasQuestionToken: !f.isRequired,
      name: f.name,
      type: `Complete${f.type}Output${f.isList ? '[]' : ''}${!f.isRequired ? ' | null' : ''}`,
    })),
  });

  sourceFile.addStatements((writer) => {
    const comments = [
      '',
      '/**',
      ` * ${relatedModelName(
        model.name
      )} contains all relations on your model in addition to the scalars`,
      ' *',
      ' * NOTE: Lazy required in case of potential circular dependencies within schema',
      ' */',
    ];

    if (config.ignoreRelationTypes) comments.push('// @ts-ignore');
    return writeArray(writer, comments);
  });

  sourceFile.addVariableStatement({
    declarationKind: VariableDeclarationKind.Const,
    isExported: true,
    declarations: [
      {
        name: relatedModelName(model.name),
        type: `z.ZodSchema<Complete${model.name}Output, z.ZodTypeDef, Complete${model.name}Input>`,
        initializer(writer) {
          writer
            .write(`z.lazy(() => ${modelName(model.name)}.extend(`)
            .inlineBlock(() => {
              relationFields.forEach((field) => {
                writeArray(writer, getJSDocs(field.documentation));

                writer
                  .write(
                    `${field.name}: ${getZodConstructor({
                      field,
                      dateType: config.dateTimeSchema,
                      nullableType: config.nullableType,
                      getRelatedModelName: relatedModelName,
                    })}`
                  )
                  .write(',')
                  .newLine();
              });
            })
            .write('))');
        },
      },
    ],
  });
};

export const populateEnumFile = (enums: DMMF.DatamodelEnum[], sourceFile: SourceFile) => {
  enums.forEach((enumModel) => {
    sourceFile.addVariableStatement({
      declarationKind: VariableDeclarationKind.Const,
      isExported: true,
      leadingTrivia: (writer) => writer.blankLineIfLastNot(),
      declarations: [
        {
          name: enumModel.name,
          initializer(writer) {
            writer
              .inlineBlock(() => {
                enumModel.values.forEach((field) => {
                  writer
                    .write(`${field.name}: '${field.dbName || field.name}'`)
                    .write(',')
                    .newLine();
                });
              })
              .write(' as const');
          },
        },
      ],
    });
  });
};

export const populateModelFile = (
  model: DMMF.Model,
  sourceFile: SourceFile,
  config: Config,
  prismaOptions: PrismaOptions
) => {
  writeImportsForModel(model, sourceFile, config, prismaOptions);
  writeTypeSpecificSchemas(model, sourceFile, config, prismaOptions);
  generateSchemaForModel(model, sourceFile, config, prismaOptions);
  if (needsRelatedModel(model, config)) {
    generateRelatedSchemaForModel(model, sourceFile, config, prismaOptions);
  }
};

export const generateBarrelFile = (
  models: DMMF.Model[],
  indexFile: SourceFile,
  enumFile?: string | null
) => {
  models.forEach((model) =>
    indexFile.addExportDeclaration({
      moduleSpecifier: `./${model.name}`,
    })
  );

  if (enumFile) {
    indexFile.addExportDeclaration({
      moduleSpecifier: `./${enumFile}`,
    });
  }
};
