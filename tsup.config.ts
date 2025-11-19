import { defineConfig } from 'tsup';

export default defineConfig({
    entry: ['src/index.ts', 'src/hooks.ts', 'src/examples.ts'],
    format: ['cjs', 'esm'],
    dts: true,
    clean: true,
    sourcemap: true,
    splitting: false,
    treeshake: true,
    minify: false,
});
