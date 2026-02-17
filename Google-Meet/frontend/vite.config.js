import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            events: path.resolve(__dirname, './src/polyfills.js'),
            util: path.resolve(__dirname, './src/polyfills.js'),
        },
    },
    define: {
        global: 'window',
        'process.env': {},
        'process.version': '"v16.0.0"',
        'process.nextTick': '(fn) => setTimeout(fn, 0)',
        Buffer: 'window.Buffer',
    },
    server: {
        port: 5173,
        proxy: {
            '/api': {
                target: 'http://localhost:5000',
                changeOrigin: true
            }
        }
    }
});
