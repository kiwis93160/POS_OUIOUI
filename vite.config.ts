import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
    resolve: {
        alias: {
            '@': path.resolve(__dirname, '.'),
        },
    },
    build: {
        chunkSizeWarningLimit: 1024,
        rollupOptions: {
            onwarn(warning, defaultHandler) {
                if (
                    warning.code === 'MODULE_LEVEL_DIRECTIVE' &&
                    typeof warning.message === 'string' &&
                    warning.message.includes('"use client"')
                ) {
                    return;
                }
                defaultHandler(warning);
            },
        },
    },
});
