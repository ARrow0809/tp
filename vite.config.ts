import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    console.log("Environment variables loaded:", {
      GEMINI_API_KEY: env.GEMINI_API_KEY ? "set" : "not set",
      LOGIN_PASSWORD: env.LOGIN_PASSWORD ? "set" : "not set"
    });
    return {
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.LOGIN_PASSWORD': JSON.stringify(env.LOGIN_PASSWORD)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});