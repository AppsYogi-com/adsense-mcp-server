import { defineConfig } from 'tsup';

export default defineConfig({
    entry: ['src/index.ts', 'src/cli/index.ts'],
    format: ['esm'],
    dts: true,
    sourcemap: true,
    clean: true,
    target: 'node18',
    splitting: false,
    shims: true,
    // Don't bundle these - they'll be imported at runtime
    external: [
        'better-sqlite3',
        'keytar',
        'googleapis',
        'google-auth-library',
        'commander',
        'env-paths',
        '@modelcontextprotocol/sdk',
    ],
    noExternal: [],
});
