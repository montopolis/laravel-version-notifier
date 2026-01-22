import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
    build: {
        lib: {
            entry: {
                'version-notifier': resolve(__dirname, 'resources/js/version-check.js'),
                'sentry-integration': resolve(__dirname, 'resources/js/sentry-integration.js'),
            },
            formats: ['es'],
        },
        outDir: 'dist',
        emptyDirBeforeWrite: true,
        minify: 'esbuild',
        rollupOptions: {
            external: ['laravel-echo'],
            output: {
                entryFileNames: '[name].js',
                exports: 'named',
                globals: {
                    'laravel-echo': 'Echo',
                },
            },
        },
    },
});
