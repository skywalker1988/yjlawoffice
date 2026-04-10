import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
  },
  server: {
    proxy: {
      '/api/sb': 'http://localhost:5000',
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-utils': ['lucide-react', 'marked', 'dompurify'],
          'vendor-tiptap': [
            '@tiptap/core', '@tiptap/react',
            '@tiptap/starter-kit', '@tiptap/extension-underline',
            '@tiptap/extension-text-align', '@tiptap/extension-highlight',
            '@tiptap/extension-color', '@tiptap/extension-text-style',
            '@tiptap/extension-link', '@tiptap/extension-image',
            '@tiptap/extension-table', '@tiptap/extension-table-row',
            '@tiptap/extension-table-cell', '@tiptap/extension-table-header',
            '@tiptap/extension-placeholder', '@tiptap/extension-subscript',
            '@tiptap/extension-superscript', '@tiptap/extension-task-list',
            '@tiptap/extension-task-item', '@tiptap/extension-character-count',
            '@tiptap/extension-font-family', '@tiptap/extension-typography',
          ],
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
})
