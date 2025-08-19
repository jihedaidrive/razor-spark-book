import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Calendar, Home, LogOut, Settings, User } from 'lucide-react';

const Navigation: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-lg">B</span>
          </div>
          <span className="font-bold text-xl text-foreground">BarberShop</span>
        </Link>

        <div className="flex items-center space-x-4">
          {user ? (
            <>
              <Button
                variant={isActive('/') ? 'default' : 'ghost'}
                size="sm"
                asChild
              >
                <Link to="/">
                  <Home className="w-4 h-4 mr-2" />
                  Home
                </Link>
              </Button>

              {user.role === 'client' && (
                <Button
                  variant={isActive('/booking') ? 'default' : 'ghost'}
                  size="sm"
                  asChild
                >
                  <Link to="/booking">
                    <Calendar className="w-4 h-4 mr-2" />
                    Book
                  </Link>
                </Button>
              )}

              {(user.role === 'admin' || user.role === 'barber') && (
                <Button
                  variant={isActive('/dashboard') ? 'default' : 'ghost'}
                  size="sm"
                  asChild
                >
                  <Link to="/dashboard">
                    <Settings className="w-4 h-4 mr-2" />
                    Dashboard
                  </Link>
                </Button>
              )}

              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">
                  {user.name || user.phone}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={logout}
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            </>
          ) : (
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/login">Login</Link>
              </Button>
              <Button variant="default" size="sm" asChild>
                <Link to="/register">Sign Up</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;