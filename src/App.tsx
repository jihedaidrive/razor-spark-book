import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/Auth/ProtectedRoute";
import Navigation from "@/components/Navigation";
import BottomNavigation from "@/components/BottomNavigation";
import { Suspense, lazy, useEffect } from "react";
import { useSecurity } from "@/hooks/useSecurity";
import { SECURITY_CONFIG } from "@/config/security";

// Lazy load pages for code splitting
const Landing = lazy(() => import("@/pages/Landing"));
const Login = lazy(() => import("@/pages/Login"));
const Register = lazy(() => import("@/pages/Register"));
const Booking = lazy(() => import("@/pages/Booking"));
const MyBookings = lazy(() => import("@/pages/MyBookings"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const AuthTest = lazy(() => import("@/pages/AuthTest"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors (client errors)
        if (error?.response?.status >= 400 && error?.response?.status < 500) {
          return false;
        }
        return failureCount < 3;
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Security wrapper component
const SecurityWrapper = ({ children }: { children: React.ReactNode }) => {
  const security = useSecurity();

  useEffect(() => {
    // Set security headers if possible
    const metaCSP = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    if (!metaCSP && import.meta.env.PROD) {
      const meta = document.createElement('meta');
      meta.httpEquiv = 'Content-Security-Policy';
      meta.content = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:;";
      document.head.appendChild(meta);
    }

    // Disable right-click in production (optional)
    if (import.meta.env.PROD) {
      const handleContextMenu = (e: MouseEvent) => {
        e.preventDefault();
      };
      document.addEventListener('contextmenu', handleContextMenu);
      return () => document.removeEventListener('contextmenu', handleContextMenu);
    }
  }, []);

  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <SecurityWrapper>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
          <div className="bg-background">
            {/* Navigation - Now responsive for all screen sizes */}
            <Navigation />
            
            {/* Main Content */}
            <Suspense fallback={
              <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            }>
              <Routes>
                {/* Default route - always redirect to Landing page */}
                <Route path="/" element={<Landing />} />

                {/* Public routes */}
                <Route path="/landing" element={<Landing />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/auth-test" element={<AuthTest />} />

                {/* Protected routes */}
                <Route
                  path="/booking"
                  element={
                    <ProtectedRoute allowedRoles={['user', 'admin']}>
                      <Booking />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/my-bookings"
                  element={
                    <ProtectedRoute allowedRoles={['user', 'admin']}>
                      <MyBookings />
                    </ProtectedRoute>
                  }
                />

                {/* Admin-only routes */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />

                {/* Catch-all route for 404 */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>

            {/* Mobile Bottom Navigation */}
            <div className="sm:hidden">
              <BottomNavigation />
            </div>
          </div>
        </BrowserRouter>
      </TooltipProvider>
    </SecurityWrapper>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
