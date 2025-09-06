import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React e libs essenciais
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          
          // UI Components e design system
          'vendor-ui': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-popover',
            '@radix-ui/react-tabs',
            '@radix-ui/react-select',
            '@radix-ui/react-avatar',
            'lucide-react'
          ],
          
          // Maps e geolocalização (chunks grandes)
          'chunk-maps': [
            'mapbox-gl',
            '@turf/turf'
          ],
          
          // Canvas e desenho
          'chunk-canvas': [
            'fabric'
          ],
          
          // Data/Query management
          'chunk-data': [
            '@tanstack/react-query',
            'date-fns'
          ],
          
          // Forms e validação
          'chunk-forms': [
            'react-hook-form',
            '@hookform/resolvers',
            'zod'
          ],
          
          // Firebase/Supabase (backend)
          'chunk-backend': [
            '@supabase/supabase-js',
            'firebase'
          ],
          
          // Charting (usado apenas em algumas páginas)
          'chunk-charts': [
            'recharts'
          ]
        }
      }
    },
    
    // Otimizações adicionais
    target: 'esnext',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: mode === 'production',
        drop_debugger: mode === 'production'
      }
    },
    
    // Chunk size warnings
    chunkSizeWarningLimit: 1000
  },
  
  // Otimizações de desenvolvimento
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'lucide-react',
      '@radix-ui/react-dialog',
      '@radix-ui/react-tabs'
    ],
    exclude: [
      'mapbox-gl',
      'fabric',
      'recharts'
    ]
  }
}));
