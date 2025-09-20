import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
    resolve: {
        alias: {
            '@': path.resolve(__dirname, '.'),
            // Use the ESM build of decimal.js-light to avoid the UMD wrapper's
            // Function('return this') global detection, which violates our CSP.
            'decimal.js-light': 'decimal.js-light/decimal.mjs',
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
