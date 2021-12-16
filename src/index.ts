import path from 'path'
import { generatorHandler, DMMF } from '@prisma/generator-helper'
import { Project, StructureKind, VariableDeclarationKind } from 'ts-morph'
import { SemicolonPreference } from 'typescript'
import { getJSDocs } from './docs'
import { getZodConstructor } from './types'
import { writeArray } from './util'
import z from 'zod'

const configSchema = z.object({
	relationModel: z
		.enum(['default', 'true', 'false'])
		.default('true')
		.transform((val) => {
			switch (val) {
				case 'default':
					return val
				case 'true':
					return true
				case 'false':
					return false
			}
		}),
	modelSuffix: z.string().default('Model'),
	modelCase: z.enum(['PascalCase', 'camelCase']).default('PascalCase'),
})

generatorHandler({
	onManifest() {
		return {
			prettyName: 'Zod Schemas',
			defaultOutput: 'zod',
			version: '0.2.1',
		}
	},
	onGenerate(options) {
		const project = new Project({
			skipAddingFilesFromTsConfig: true,
		})

		const outputPath = options.generator.output!.value
		const models = options.dmmf.datamodel.models

		const prismaClient = options.otherGenerators.find(
			(each) => each.provider.value === 'prisma-client-js'
		)

		const parsedConfig = configSchema.safeParse(options.generator.config)
		if (!parsedConfig.success)
			throw new Error(
				'Incorrect config provided. Please check the values you provided and try again.'
			)

		const { relationModel, modelSuffix, modelCase } = parsedConfig.data

		const formatModelName = (name: string, prefix = '') => {
			if (modelCase === 'camelCase') {
				name = name.slice(0, 1).toLowerCase() + name.slice(1)
			}
			return `${prefix}${name}${modelSuffix}`
		}

		const indexSource = project.createSourceFile(
			`${outputPath}/index.ts`,
			{},
			{
				overwrite: true,
			}
		)

		models.forEach((model) => {
			indexSource.addExportDeclaration({
				moduleSpecifier: `./${model.name.toLowerCase()}`,
			})

			const modelName = (name: string) =>
				formatModelName(name, relationModel === 'default' ? '_' : '')

			const relatedModelName = (
				name:
					| string
					| DMMF.SchemaEnum
					| DMMF.OutputType
					| DMMF.SchemaArg
			) =>
				formatModelName(
					relationModel === 'default'
						? name.toString()
						: `Related${name.toString()}`
				)

			const sourceFile = project.createSourceFile(
				`${outputPath}/${model.name.toLowerCase()}.ts`,
				{
					statements: [
						{
							kind: StructureKind.ImportDeclaration,
							namespaceImport: 'z',
							moduleSpecifier: 'zod',
						},
					],
				},
				{
					overwrite: true,
				}
			)

			const enumFields = model.fields.filter((f) => f.kind === 'enum')

			let relativePath = prismaClient?.output?.value
				? path.relative(outputPath, prismaClient.output.value)
				: null
			if (
				relativePath &&
				!(
					relativePath.startsWith('./') ||
					relativePath.startsWith('../')
				)
			)
				relativePath = `./${relativePath}`

			sourceFile.addImportDeclaration({
				kind: StructureKind.ImportDeclaration,
				moduleSpecifier: relativePath ?? '@prisma/client',
				namedImports: [model.name, ...enumFields.map((f) => f.type)],
			})

			sourceFile.addStatements((writer) =>
				writeArray(writer, getJSDocs(model.documentation))
			)

			sourceFile.addVariableStatement({
				declarationKind: VariableDeclarationKind.Const,
				isExported: true,
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
											writeArray(
												writer,
												getJSDocs(field.documentation)
											)
											writer
												.write(
													`${
														field.name
													}: ${getZodConstructor(
														field
													)}`
												)
												.write(',')
												.newLine()
										})
								})
								.write(')')
						},
					},
				],
			})

			const relationFields = model.fields.filter(
				(f) => f.kind === 'object'
			)

			if (relationModel !== false && relationFields.length > 0) {
				const filteredFields = relationFields.filter(
					(f) => f.type !== model.name
				)

				if (filteredFields.length > 0) {
					sourceFile.addImportDeclaration({
						kind: StructureKind.ImportDeclaration,
						moduleSpecifier: './index',
						namedImports: Array.from(
							new Set(
								filteredFields.flatMap((f) => [
									`Complete${f.type}`,
									relatedModelName(f.type),
								])
							)
						),
					})
				}

				sourceFile.addInterface({
					name: `Complete${model.name}`,
					isExported: true,
					extends: (writer) => writer.write(model.name),
					properties: relationFields.map((f) => ({
						name: f.name,
						type: `Complete${f.type}${f.isList ? '[]' : ''}${
							!f.isRequired ? ' | null' : ''
						}`,
					})),
				})

				sourceFile.addStatements((writer) =>
					writeArray(writer, [
						'',
						'/**',
						` * ${relatedModelName(
							model.name
						)} contains all relations on your model in addition to the scalars`,
						' *',
						' * NOTE: Lazy required in case of potential circular dependencies within schema',
						' */',
					])
				)

				sourceFile.addVariableStatement({
					declarationKind: VariableDeclarationKind.Const,
					isExported: true,
					declarations: [
						{
							name: relatedModelName(model.name),
							type: `z.ZodSchema<Complete${model.name}>`,
							initializer(writer) {
								writer
									.write(
										`z.lazy(() => ${modelName(
											model.name
										)}.extend(`
									)
									.inlineBlock(() => {
										relationFields.forEach((field) => {
											writeArray(
												writer,
												getJSDocs(field.documentation)
											)

											writer
												.write(
													`${
														field.name
													}: ${getZodConstructor(
														field,
														relatedModelName
													)}`
												)
												.write(',')
												.newLine()
										})
									})
									.write('))')
							},
						},
					],
				})
			}

			sourceFile.formatText({
				indentSize: 2,
				convertTabsToSpaces: true,
				semicolons: SemicolonPreference.Remove,
			})
		})

		return project.save()
	},
})
