import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/Auth/ProtectedRoute";
import Navigation from "@/components/Navigation";
import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Booking from "@/pages/Booking";
import MyBookings from "@/pages/MyBookings";
import Dashboard from "@/pages/Dashboard";
import NotFound from "@/pages/NotFound";
import AuthTest from "@/pages/AuthTest";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <div className="min-h-screen bg-background">
            <Navigation />
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
          </div>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
