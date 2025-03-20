import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, LogOut } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export function Navbar() {
  const { user, logoutMutation } = useAuth();
  
  // Fetch site settings to get the logo
  const { data: settings } = useQuery({
    queryKey: ["/api/site-settings"],
    enabled: true,
  });

  // Determine which logo to use
  const logoUrl = settings?.logoUrl || "/assets/new_whatsapp_image.jpg";
  
  return (
    <nav className="border-b bg-background">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/">
          <a className="flex items-center">
            <img
              src={logoUrl}
              alt="Logo"
              className="h-10 w-auto"
              onError={(e) => {
                // If the logo fails to load, fall back to the default
                const target = e.target as HTMLImageElement;
                target.src = "/assets/new_whatsapp_image.jpg";
                console.log("Logo image failed to load, falling back to default");
              }}
            />
          </a>
        </Link>

        <div className="flex items-center gap-4">
          {user?.role === "admin" && (
            <div className="flex gap-2">
              <Link href="/admin/site-settings">
                <Button variant="outline">Site Ayarları</Button>
              </Link>
              <Link href="/admin/users">
                <Button variant="outline">Kullanıcı Yönetimi</Button>
              </Link>
              <Link href="/admin/events">
                <Button variant="outline">Etkinlik Yönetimi</Button>
              </Link>
            </div>
          )}

          <Link href="/participations">
            <Button variant="outline">Katılımlarım</Button>
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
      </div>
    </nav>
  );
}