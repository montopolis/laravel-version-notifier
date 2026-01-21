import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
    build: {
        lib: {
            entry: resolve(__dirname, 'resources/js/version-check.js'),
            formats: ['es', 'umd'],
            name: 'VersionNotifier',
            fileName: (format) => {
                if (format === 'umd') {
                    return 'version-notifier.umd.js';
                }
                return 'version-notifier.js';
            },
        },
        outDir: 'dist',
        emptyDirBeforeWrite: true,
        minify: 'esbuild',
        rollupOptions: {
            external: ['laravel-echo'],
            output: {
                exports: 'named',
                globals: {
                    'laravel-echo': 'Echo',
                },
            },
        },
    },
});
