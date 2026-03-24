
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  // Find all keys that look like API keys or Gemini keys
  const envToExpose = Object.keys(env).reduce((acc, key) => {
    if (key.toUpperCase().includes('API') || key.toUpperCase().includes('GEMINI')) {
      acc[key] = env[key];
    }
    return acc;
  }, {} as Record<string, string>);

  return {
    plugins: [
      react(),
      tailwindcss()
    ],
    server: {
      hmr: false,
    },
    define: {
      'process.env': JSON.stringify(envToExpose)
    }
  };
});
