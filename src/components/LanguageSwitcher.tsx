import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Globe, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Language {
  code: string;
  name: string;
  flag: string;
  nativeName: string;
}

const languages: Language[] = [
  { code: 'en', name: 'English', flag: '🇺🇸', nativeName: 'English' },
  { code: 'fr', name: 'French', flag: '🇫🇷', nativeName: 'Français' },
  { code: 'ar', name: 'Arabic', flag: '🇸🇦', nativeName: 'العربية' },
];

interface LanguageSwitcherProps {
  variant?: 'default' | 'compact' | 'minimal';
  className?: string;
}

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ 
  variant = 'default',
  className 
}) => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  const changeLanguage = (languageCode: string) => {
    i18n.changeLanguage(languageCode);
    setIsOpen(false);
  };

  if (variant === 'compact') {
    return (
      <div className={cn("flex gap-1", className)}>
        {languages.map((lang) => (
          <Button
            key={lang.code}
            size="sm"
            variant={i18n.language === lang.code ? 'default' : 'ghost'}
            onClick={() => changeLanguage(lang.code)}
            className={cn(
              "h-8 px-2 text-xs font-medium transition-all duration-200",
              i18n.language === lang.code 
                ? "bg-primary text-primary-foreground shadow-sm" 
                : "hover:bg-muted text-muted-foreground hover:text-foreground"
            )}
          >
            <span className="mr-1">{lang.flag}</span>
            {lang.code.toUpperCase()}
          </Button>
        ))}
      </div>
    );
  }

  if (variant === 'minimal') {
    return (
      <div className={cn("flex gap-2", className)}>
        {languages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => changeLanguage(lang.code)}
            className={cn(
              "flex items-center gap-1 px-2 py-1 rounded-md text-sm transition-all duration-200",
              i18n.language === lang.code
                ? "bg-primary/10 text-primary font-medium"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            <span className="text-base">{lang.flag}</span>
            <span className="text-xs font-medium">{lang.code.toUpperCase()}</span>
          </button>
        ))}
      </div>
    );
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "h-9 px-3 gap-2 bg-background/95 backdrop-blur-sm border-border/50",
            "hover:bg-muted/50 hover:border-border transition-all duration-200",
            "shadow-sm hover:shadow-md",
            className
          )}
        >
          <Globe className="h-4 w-4 text-muted-foreground" />
          <span className="flex items-center gap-1.5">
            <span className="text-base">{currentLanguage.flag}</span>
            <span className="font-medium text-sm">{currentLanguage.code.toUpperCase()}</span>
          </span>
          <ChevronDown className={cn(
            "h-3 w-3 text-muted-foreground transition-transform duration-200",
            isOpen && "rotate-180"
          )} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-48 bg-background/95 backdrop-blur-sm border-border/50 shadow-lg"
      >
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => changeLanguage(lang.code)}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors duration-200",
              i18n.language === lang.code 
                ? "bg-primary/10 text-primary font-medium" 
                : "hover:bg-muted/50"
            )}
          >
            <span className="text-lg">{lang.flag}</span>
            <div className="flex flex-col">
              <span className="font-medium text-sm">{lang.name}</span>
              <span className="text-xs text-muted-foreground">{lang.nativeName}</span>
            </div>
            {i18n.language === lang.code && (
              <div className="ml-auto w-2 h-2 bg-primary rounded-full" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSwitcher;