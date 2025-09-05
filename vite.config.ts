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
          // Vendor chunks
          'react-vendor': ['react', 'react-dom'],
          'router-vendor': ['react-router-dom'],
          'query-vendor': ['@tanstack/react-query'],
          'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-select', '@radix-ui/react-toast'],
          'form-vendor': ['react-hook-form', '@hookform/resolvers'],
          'date-vendor': ['date-fns'],
          'chart-vendor': ['recharts'],

          // Feature chunks
          'auth': ['src/contexts/AuthContext.tsx', 'src/components/Auth/ProtectedRoute.tsx', 'src/api/authApi.ts'],
          'booking': ['src/pages/Booking.tsx', 'src/components/Booking/BookingModal.tsx', 'src/components/Calendar/WeeklyCalendar.tsx'],
          'dashboard': ['src/pages/Dashboard.tsx', 'src/components/Dashboard/ReservationHistory.tsx'],
        },
      },
    },
    chunkSizeWarningLimit: 300, // Lower warning threshold
    // Security: Remove source maps in production
    sourcemap: mode === 'development',
    // Security: Minify and obfuscate in production
    minify: mode === 'production' ? 'terser' : false,
    terserOptions: mode === 'production' ? {
      compress: {
        drop_console: true, // Remove console logs in production
        drop_debugger: true, // Remove debugger statements
      },
      mangle: {
        safari10: true, // Fix Safari 10 issues
      },
    } : undefined,
  },
  // Security: Define allowed environment variables
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
  },
}));
