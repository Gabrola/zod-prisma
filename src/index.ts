// @ts-ignore Importing package.json for automated synchronization of version numbers
import { version } from '../package.json';

import { generatorHandler } from '@prisma/generator-helper';
import { Project, QuoteKind } from 'ts-morph';
import { configSchema, PrismaOptions } from './config';
import { generateBarrelFile, populateEnumFile, populateModelFile } from './generator';

generatorHandler({
  onManifest() {
    return {
      version,
      prettyName: 'Zod Schemas',
      defaultOutput: 'zod',
    };
  },
  onGenerate(options) {
    const models = options.dmmf.datamodel.models;

    const { schemaPath } = options;
    const outputPath = options.generator.output!.value!;
    const clientPath = options.otherGenerators.find(
      (each) => each.provider.value === 'prisma-client-js'
    )!.output!.value!;

    const results = configSchema.safeParse(options.generator.config);
    if (!results.success)
      throw new Error(
        'Incorrect config provided. Please check the values you provided and try again.'
      );

    const config = results.data;
    const prismaOptions: PrismaOptions = {
      clientPath,
      outputPath,
      schemaPath,
    };

    const project = new Project({
      manipulationSettings: {
        quoteKind: config.singleQuote ? QuoteKind.Single : QuoteKind.Double,
        useTrailingCommas: config.trailingCommas,
      },
    });

    const indexFile = project.createSourceFile(`${outputPath}/index.ts`, {}, { overwrite: true });

    generateBarrelFile(models, indexFile, config.enumFile);

    indexFile.formatText({
      indentSize: config.indentSize,
      convertTabsToSpaces: config.indentType === 'space',
      semicolons: config.semicolon,
    });

    models.forEach((model) => {
      const sourceFile = project.createSourceFile(
        `${outputPath}/${model.name}.ts`,
        {},
        { overwrite: true }
      );

      populateModelFile(model, sourceFile, config, prismaOptions);

      sourceFile.formatText({
        indentSize: config.indentSize,
        convertTabsToSpaces: config.indentType === 'space',
        semicolons: config.semicolon,
      });
    });

    if (config.enumFile) {
      const enums = options.dmmf.datamodel.enums;
      const enumFile = project.createSourceFile(
        `${outputPath}/${config.enumFile}.ts`,
        {},
        { overwrite: true }
      );
      populateEnumFile(enums, enumFile);
      enumFile.formatText({
        indentSize: config.indentSize,
        convertTabsToSpaces: config.indentType === 'space',
        semicolons: config.semicolon,
      });
    }

    return project.save();
  },
});
