import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/hooks/use-language";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { User, LogOut, Home, Menu, Globe, HelpCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState } from "react";
import { Language } from "@/i18n";
import { ContextualTooltip } from "@/components/ui/contextual-tooltip";
import { TooltipResetButton } from "@/components/ui/tooltip-reset-button";

export function Navbar() {
  const { user, logoutMutation } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleLanguage = () => {
    setLanguage(language === 'tr' ? 'en' : 'tr');
  };
  
  return (
    <nav className="border-b bg-background sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/">
          <div className="flex items-center cursor-pointer">
            <Button variant="ghost" size="icon" className="p-0">
              <Home className="h-6 w-6 text-primary" />
            </Button>
          </div>
        </Link>

        {/* Mobile menu button */}
        {isMobile && (
          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden" 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <Menu className="h-6 w-6" />
          </Button>
        )}

        {/* Desktop navigation */}
        {!isMobile && (
          <div className="flex items-center gap-2">
            {user?.role === "admin" && (
              <>
                <Link href="/admin/site-settings">
                  <Button variant="outline" size="sm">{t.nav.siteSettings}</Button>
                </Link>
                <Link href="/admin/users">
                  <Button variant="outline" size="sm">{t.nav.users}</Button>
                </Link>
                <Link href="/admin/events">
                  <Button variant="outline" size="sm">{t.nav.events}</Button>
                </Link>
              </>
            )}

            <Link href="/participations">
              <Button variant="outline" size="sm">{t.nav.participations}</Button>
            </Link>
            
            {/* Language toggle button */}
            <ContextualTooltip 
              id="language-switcher" 
              content={t.tooltips.languageSwitcher}
              position="bottom"
              showOnce={true}
            >
              <Button 
                variant="ghost" 
                size="icon"
                onClick={toggleLanguage}
                className="mr-1"
              >
                <Globe className="h-5 w-5" />
                <span className="ml-1 text-xs font-medium">{language.toUpperCase()}</span>
              </Button>
            </ContextualTooltip>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <Link href="/profile">
                  <DropdownMenuItem>
                    <User className="mr-2 h-4 w-4" />
                    {t.nav.myProfile}
                  </DropdownMenuItem>
                </Link>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={toggleLanguage}>
                  <Globe className="mr-2 h-4 w-4" />
                  {language === 'tr' ? 'English' : 'Türkçe'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => {
                  const { resetTooltips } = require('@/hooks/use-tooltips').useTooltips();
                  const { toast } = require('@/hooks/use-toast').useToast();
                  resetTooltips();
                  toast({
                    title: t.common.success,
                    description: t.tooltips.gotIt,
                    duration: 3000,
                  });
                }}>
                  <HelpCircle className="mr-2 h-4 w-4" />
                  {t.tooltips.showHelpTips}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => logoutMutation.mutate()}>
                  <LogOut className="mr-2 h-4 w-4" />
                  {t.auth.logout}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      {/* Mobile navigation menu */}
      {isMobile && mobileMenuOpen && (
        <div className="px-4 py-2 bg-background border-t flex overflow-x-auto no-scrollbar">
          <div className="flex space-x-2 items-center">
            {user?.role === "admin" && (
              <>
                <Link href="/admin/site-settings">
                  <Button variant="outline" size="sm">{t.nav.siteSettings}</Button>
                </Link>
                <Link href="/admin/users">
                  <Button variant="outline" size="sm">{t.nav.users}</Button>
                </Link>
                <Link href="/admin/events">
                  <Button variant="outline" size="sm">{t.nav.events}</Button>
                </Link>
              </>
            )}
            <Link href="/participations">
              <Button variant="outline" size="sm">{t.nav.participations}</Button>
            </Link>
            <Link href="/profile">
              <Button variant="outline" size="sm">{t.nav.myProfile}</Button>
            </Link>
            <Button 
              variant="outline" 
              size="sm"
              onClick={toggleLanguage}
              className="whitespace-nowrap"
            >
              {language === 'tr' ? 'EN' : 'TR'}
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                const { resetTooltips } = require('@/hooks/use-tooltips').useTooltips();
                const { toast } = require('@/hooks/use-toast').useToast();
                resetTooltips();
                toast({
                  title: t.common.success,
                  description: t.tooltips.gotIt,
                  duration: 3000,
                });
              }}
              className="whitespace-nowrap"
            >
              {t.tooltips.showHelpTips}
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => logoutMutation.mutate()}
              className="whitespace-nowrap"
            >
              {t.auth.logout}
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
}