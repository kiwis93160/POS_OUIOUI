import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
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
    };
});
