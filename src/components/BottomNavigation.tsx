import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Home, 
  Calendar, 
  History, 
  Settings, 
  User,
  LogIn
} from 'lucide-react';
import { cn } from '@/lib/utils';

const BottomNavigation: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  // Don't show bottom nav on auth pages
  if (['/login', '/register', '/auth-test'].includes(location.pathname)) {
    return null;
  }

  const navItems = user ? [
    {
      icon: Home,
      label: 'Home',
      path: '/',
      show: true
    },
    {
      icon: Calendar,
      label: 'Book',
      path: '/booking',
      show: user.role === 'user' || user.role === 'admin'
    },
    {
      icon: History,
      label: 'History',
      path: '/my-bookings',
      show: user.role === 'user' || user.role === 'admin'
    },
    {
      icon: Settings,
      label: 'Admin',
      path: '/dashboard',
      show: user.role === 'admin'
    },
    {
      icon: User,
      label: 'Profile',
      path: '/profile',
      show: true
    }
  ] : [
    {
      icon: Home,
      label: 'Home',
      path: '/',
      show: true
    },
    {
      icon: LogIn,
      label: 'Login',
      path: '/login',
      show: true
    }
  ];

  const visibleItems = navItems.filter(item => item.show);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-lg border-t border-border">
      <div className="safe-area-bottom">
        <nav className="flex items-center justify-around px-2 py-2">
          {visibleItems.map(({ icon: Icon, label, path }) => (
            <Link
              key={path}
              to={path}
              className={cn(
                "flex flex-col items-center justify-center min-w-0 flex-1 py-2 px-1 rounded-lg transition-all duration-200 touch-manipulation",
                isActive(path)
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <Icon className={cn(
                "w-5 h-5 mb-1 transition-transform duration-200",
                isActive(path) && "scale-110"
              )} />
              <span className="text-xs font-medium truncate max-w-full">
                {label}
              </span>
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default BottomNavigation;