import type { Options } from 'tsup'
import { defineConfig } from 'tsup'
import { esbuildTsc } from './esbuild-plugins/esbuild-tsc'

export default defineConfig((options: Options) => ({
  ...options,
  entryPoints: ['./src/main.ts'],
  format: ['cjs'],
  target: 'es2020',
  splitting: false,
  sourcemap: true,
  bundle: true,
  clean: true,
  tsconfig: 'tsconfig.build.json',
  esbuildPlugins: [
    esbuildTsc((compilerOptions) => {
      return {
        ...compilerOptions,
        emitDecoratorMetadata: true,
      }
    }),
  ],
}))
