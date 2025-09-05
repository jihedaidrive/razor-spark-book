import React from 'react';
import { cn } from '@/lib/utils';

interface MobileLayoutProps {
  children: React.ReactNode;
  className?: string;
  showBottomPadding?: boolean;
}

const MobileLayout: React.FC<MobileLayoutProps> = ({ 
  children, 
  className,
  showBottomPadding = true 
}) => {
  return (
    <div className={cn(
      "bg-background",
      showBottomPadding && "pb-24", // More space for bottom navigation
      className
    )}>
      <div className="w-full px-4 py-4 mx-auto max-w-md sm:max-w-2xl lg:max-w-4xl xl:max-w-6xl">
        {children}
      </div>
    </div>
  );
};

export default MobileLayout;