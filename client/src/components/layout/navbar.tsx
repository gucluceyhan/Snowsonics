import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, LogOut, Home, Menu } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState } from "react";

export function Navbar() {
  const { user, logoutMutation } = useAuth();
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
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
                  <Button variant="outline" size="sm">Site Ayarları</Button>
                </Link>
                <Link href="/admin/users">
                  <Button variant="outline" size="sm">Kullanıcı Yönetimi</Button>
                </Link>
                <Link href="/admin/events">
                  <Button variant="outline" size="sm">Etkinlik Yönetimi</Button>
                </Link>
              </>
            )}

            <Link href="/participations">
              <Button variant="outline" size="sm">Katılımlarım</Button>
            </Link>

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
                    Profil
                  </DropdownMenuItem>
                </Link>
                <DropdownMenuItem onClick={() => logoutMutation.mutate()}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Çıkış Yap
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
                  <Button variant="outline" size="sm">Site Ayarları</Button>
                </Link>
                <Link href="/admin/users">
                  <Button variant="outline" size="sm">Kullanıcı Yönetimi</Button>
                </Link>
                <Link href="/admin/events">
                  <Button variant="outline" size="sm">Etkinlik Yönetimi</Button>
                </Link>
              </>
            )}
            <Link href="/participations">
              <Button variant="outline" size="sm">Katılımlarım</Button>
            </Link>
            <Link href="/profile">
              <Button variant="outline" size="sm">Profil</Button>
            </Link>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => logoutMutation.mutate()}
              className="whitespace-nowrap"
            >
              Çıkış Yap
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
}