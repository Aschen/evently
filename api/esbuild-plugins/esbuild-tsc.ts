import * as typescript from 'typescript'
import fs from 'fs/promises'
import path from 'path'
import { inspect } from 'util'

/**
 * Parse a tsconfig file
 */
function parseTsConfig(tsconfig, cwd = process.cwd()) {
  const fileName = typescript.findConfigFile(
    cwd,
    typescript.sys.fileExists,
    tsconfig
  )

  if (!tsconfig) {
    throw new Error(`Cannot find a tsconfig file`)
  }

  if (!fileName) {
    throw new Error(`Cannot open '${fileName}'`)
  }

  const configText = typescript.sys.readFile(fileName)
  if (!configText) {
    throw new Error(`Cannot read '${fileName}'`)
  }

  const result = typescript.parseConfigFileTextToJson(fileName, configText)

  if (result.error !== undefined) {
    console.error(inspect(result.error, false, 10, true))
    throw new Error(`Failed to parse '${fileName}' to JSON`)
  }

  const parsedTsConfig = typescript.parseJsonConfigFileContent(
    result.config,
    typescript.sys,
    cwd
  )

  if (parsedTsConfig.errors[0]) {
    console.error(inspect(parsedTsConfig.errors[0], false, 10, true))
    throw new Error(`Cannot parse '${fileName}'`)
  }

  return parsedTsConfig
}

/**
 * An esbuild plugin that transpiles TypeScript files using TSC and returns the output
 * This bypasses the ESBuild TypeScript transpiler
 *
 * /!\ In the `tsconfig.ts` the `compilerOptions.emitDecoratorMetadata` should be `false` in order for this to work
 * otherwise the SWC compiler will transpile the TypeScript files before TSC
 * you can still use the `emitDecoratorMetadata` option in the `esbuildTsc` function
 */
export function esbuildTsc(
  /**
   * A function that receives the compiler options and returns the new compiler options
   */
  compilerOptions: (
    compilerOptions: typescript.CompilerOptions
  ) => typescript.CompilerOptions
) {
  return {
    name: 'esbuild-tsc',
    setup(build) {
      const tsconfig = parseTsConfig(
        build.initialOptions.tsconfig ?? 'tsconfig.json'
      )

      tsconfig.options = compilerOptions(tsconfig.options)

      if (tsconfig.options.sourceMap) {
        tsconfig.options.sourceMap = false
        tsconfig.options.inlineSources = true
        tsconfig.options.inlineSourceMap = true
      }

      build.onLoad({ filter: /\.ts$/ }, async (args) => {
        const program = typescript.transpileModule(
          await fs.readFile(args.path, 'utf8'),
          {
            compilerOptions: tsconfig.options,
            fileName: path.basename(args.path),
          }
        )

        return { contents: program.outputText, loader: 'ts' }
      })
    },
  }
}
