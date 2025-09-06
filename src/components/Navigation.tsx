import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Calendar, Home, LogOut, Settings, User, History, Menu, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const Navigation: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { t } = useTranslation();

  const isActive = (path: string) => location.pathname === path;

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  return (
    <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-lg">B</span>
          </div>
          <span className="font-bold text-xl text-foreground">BarberShop</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-4">
          {user ? (
            <>
              <Button
                variant={isActive('/') ? 'default' : 'ghost'}
                size="sm"
                asChild
              >
                <Link to="/">
                  <Home className="w-4 h-4 mr-2" />
                  {t('navigation.home')}
                </Link>
              </Button>

              {user.role === 'user' && (
                <>
                  <Button
                    variant={isActive('/booking') ? 'default' : 'ghost'}
                    size="sm"
                    asChild
                  >
                    <Link to="/booking">
                      <Calendar className="w-4 h-4 mr-2" />
                      {t('navigation.booking')}
                    </Link>
                  </Button>
                  <Button
                    variant={isActive('/my-bookings') ? 'default' : 'ghost'}
                    size="sm"
                    asChild
                  >
                    <Link to="/my-bookings">
                      <History className="w-4 h-4 mr-2" />
                      {t('navigation.myBookings')}
                    </Link>
                  </Button>
                </>
              )}

              {user.role === 'admin' && (
                <Button
                  variant={isActive('/dashboard') ? 'default' : 'ghost'}
                  size="sm"
                  asChild
                >
                  <Link to="/dashboard">
                    <Settings className="w-4 h-4 mr-2" />
                    Admin Dashboard
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

        {/* Mobile Menu Button */}
        <div className="md:hidden">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleMobileMenu}
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-background border-b border-border">
          <div className="container mx-auto px-4 py-4 space-y-2">
            {user ? (
              <>
                <Button
                  variant={isActive('/') ? 'default' : 'ghost'}
                  size="sm"
                  className="w-full justify-start"
                  asChild
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Link to="/">
                    <Home className="w-4 h-4 mr-2" />
                    Home
                  </Link>
                </Button>

                {user.role === 'user' && (
                  <>
                    <Button
                      variant={isActive('/booking') ? 'default' : 'ghost'}
                      size="sm"
                      className="w-full justify-start"
                      asChild
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Link to="/booking">
                        <Calendar className="w-4 h-4 mr-2" />
                        Book Appointment
                      </Link>
                    </Button>
                    <Button
                      variant={isActive('/my-bookings') ? 'default' : 'ghost'}
                      size="sm"
                      className="w-full justify-start"
                      asChild
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Link to="/my-bookings">
                        <History className="w-4 h-4 mr-2" />
                        My History
                      </Link>
                    </Button>
                  </>
                )}

                {user.role === 'admin' && (
                  <Button
                    variant={isActive('/dashboard') ? 'default' : 'ghost'}
                    size="sm"
                    className="w-full justify-start"
                    asChild
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Link to="/dashboard">
                      <Settings className="w-4 h-4 mr-2" />
                      Admin Dashboard
                    </Link>
                  </Button>
                )}

                <div className="pt-2 border-t border-border">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {user.name || user.phone}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        logout();
                        setIsMobileMenuOpen(false);
                      }}
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="space-y-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full justify-start"
                  asChild
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Link to="/login">Login</Link>
                </Button>
                <Button 
                  variant="default" 
                  size="sm" 
                  className="w-full justify-start"
                  asChild
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Link to="/register">Sign Up</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navigation;