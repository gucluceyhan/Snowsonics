import { useQuery, useMutation } from "@tanstack/react-query";
import { User } from "@shared/schema";
import { Navbar } from "@/components/layout/navbar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Shield, MoreVertical, CheckCircle, UserCheck, UserCog, AlertCircle, UserX, UserPlus, Download } from "lucide-react";
import * as XLSX from "xlsx";
import { useLanguage } from "@/hooks/use-language";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { ContextualTooltip } from "@/components/ui/contextual-tooltip";

export default function UsersPage() {
  const { toast } = useToast();
  const { t } = useLanguage();
  const { data: users = [] } = useQuery<User[]>({ 
    queryKey: ["/api/admin/users"]
  });

  // Separate users into approved and pending
  const approvedUsers = users.filter(user => user.isApproved);
  const pendingUsers = users.filter(user => !user.isApproved);

  const approveMutation = useMutation({
    mutationFn: async (userId: number) => {
      await apiRequest("POST", `/api/admin/users/${userId}/approve`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: t.users.approveUser,
        description: t.users.approvedMessage,
      });
    },
  });

  const roleUpdateMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: number; role: string }) => {
      await apiRequest("POST", `/api/admin/users/${userId}/role`, { role });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: t.common.success,
        description: t.users.roleUpdated || "Kullanıcı rolü başarıyla güncellendi",
      });
    },
  });
  
  const toggleActiveStatusMutation = useMutation({
    mutationFn: async (userId: number) => {
      await apiRequest("POST", `/api/admin/users/${userId}/toggle-active`);
    },
    onSuccess: (_, userId) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      
      // Kullanıcı bilgilerini al ve aktif duruma göre mesaj göster
      const user = users.find(u => u.id === userId);
      const isNowActive = user ? !user.isActive : false;
      
      toast({
        title: isNowActive ? t.users.activateUser : t.users.deactivateUser,
        description: isNowActive 
          ? t.users.activatedMessage || "Kullanıcı artık sisteme giriş yapabilir" 
          : t.users.deactivatedMessage || "Kullanıcı artık sisteme giriş yapamaz, admin ile iletişime geçmelidir",
      });
    },
  });

  const renderUserRow = (user: User) => (
    <TableRow key={user.id} className={
      !user.isApproved 
        ? "bg-yellow-50 dark:bg-yellow-950/20" 
        : !user.isActive 
          ? "bg-red-50 dark:bg-red-950/20" 
          : ""
    }>
      <TableCell>{user.username}</TableCell>
      <TableCell>{user.firstName} {user.lastName}</TableCell>
      <TableCell>{user.email}</TableCell>
      <TableCell className="space-y-1">
        {user.isApproved ? (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200">
            <UserCheck className="w-3 h-3 mr-1" />
            {t.users.approved}
          </Badge>
        ) : (
          <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200">
            <UserCog className="w-3 h-3 mr-1" />
            {t.users.pending}
          </Badge>
        )}
        
        {/* Aktif/Pasif durumu göster */}
        {user.isApproved && (
          <div className="mt-1">
            {user.isActive ? (
              <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300 border-green-200 dark:border-green-800">
                <UserPlus className="w-3 h-3 mr-1" />
                {t.users.active}
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300 border-red-200 dark:border-red-800">
                <UserX className="w-3 h-3 mr-1" />
                {t.users.inactive}
              </Badge>
            )}
          </div>
        )}
      </TableCell>
      <TableCell>
        <Badge 
          variant={user.role === "admin" ? "destructive" : "outline"}
        >
          {user.role === "admin" ? t.users.admin : t.users.user}
        </Badge>
      </TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {!user.isApproved && (
              <ContextualTooltip
                id="admin-approve-user"
                content={t.tooltips.adminApproveUser}
                position="left"
                showOnce={true}
              >
                <DropdownMenuItem
                  onClick={() => approveMutation.mutate(user.id)}
                  disabled={approveMutation.isPending}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  {t.users.approveUser}
                </DropdownMenuItem>
              </ContextualTooltip>
            )}
            
            <ContextualTooltip
              id="admin-user-role"
              content={t.tooltips.adminUserRole}
              position="left"
              showOnce={true}
            >
              <DropdownMenuItem
                onClick={() => roleUpdateMutation.mutate({
                  userId: user.id,
                  role: user.role === "admin" ? "user" : "admin"
                })}
                disabled={roleUpdateMutation.isPending}
              >
                <Shield className="mr-2 h-4 w-4" />
                {user.role === "admin" ? t.users.makeUser : t.users.makeAdmin}
              </DropdownMenuItem>
            </ContextualTooltip>
            
            {user.isApproved && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => toggleActiveStatusMutation.mutate(user.id)}
                  disabled={toggleActiveStatusMutation.isPending}
                  className={user.isActive ? "text-red-600" : "text-green-600"}
                >
                  {user.isActive ? (
                    <>
                      <UserX className="mr-2 h-4 w-4" />
                      {t.users.deactivateUser}
                    </>
                  ) : (
                    <>
                      <UserPlus className="mr-2 h-4 w-4" />
                      {t.users.activateUser}
                    </>
                  )}
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          <div className="md:flex md:items-center md:justify-between block">
            <div className="mb-4 md:mb-0">
              <h1 className="text-4xl font-bold">{t.users.title}</h1>
              <p className="text-muted-foreground mt-2">
                {t.users.subtitle}
              </p>
            </div>
            
            <ContextualTooltip
              id="export-excel-button"
              content="Kullanıcı listesini bilgisayarınıza Excel dosyası olarak kaydedin"
              position="left"
              showOnce={true}
            >
              <Button
                variant="default"
                className="bg-primary hover:bg-primary/90 w-full md:w-auto"
                onClick={() => {
                  // Excel verileri için uygun formatta bir dizi oluştur
                  const excelData = [
                    // Başlık satırı
                    ['Ad', 'Soyad', 'Telefon Numarası', 'E-posta Adresi', 'Meslek', 'Yaşadığı İl', 'Durum']
                  ];
                  
                  // Kullanıcı verilerini ekle
                  users.forEach(user => {
                    excelData.push([
                      user.firstName || '',
                      user.lastName || '',
                      user.phone || '',
                      user.email || '',
                      user.occupation || '',
                      user.city || '',
                      user.isActive ? 'Aktif' : 'Pasif'
                    ]);
                  });
                  
                  // XLSX Workbook oluştur
                  const wb = XLSX.utils.book_new();
                  const ws = XLSX.utils.aoa_to_sheet(excelData);
                  
                  // Sütun genişliklerini ayarla
                  const colWidths = [
                    { wch: 15 }, // Ad
                    { wch: 15 }, // Soyad
                    { wch: 20 }, // Telefon
                    { wch: 30 }, // E-posta
                    { wch: 20 }, // Meslek
                    { wch: 15 }, // Şehir
                    { wch: 10 }  // Durum
                  ];
                  ws['!cols'] = colWidths;
                  
                  // Çalışma sayfasını workbook'a ekle
                  XLSX.utils.book_append_sheet(wb, ws, "Kullanıcılar");
                  
                  // Excel dosyasını indir
                  XLSX.writeFile(wb, "kullanicilar.xlsx");
                  
                  toast({
                    title: t.users.exportComplete,
                    description: t.users.exportMessage,
                  });
                }}
              >
                <Download className="w-4 h-4 mr-2" />
                {t.users.exportToExcel}
              </Button>
            </ContextualTooltip>
          </div>

          {pendingUsers.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-yellow-600 dark:text-yellow-400 flex items-center">
                <AlertCircle className="mr-2 h-5 w-5" />
                {t.users.pendingUsers} ({pendingUsers.length})
              </h3>
              <div className="rounded-md border border-yellow-200 dark:border-yellow-900 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-yellow-50 dark:bg-yellow-950/40">
                      <TableHead>{t.users.username}</TableHead>
                      <TableHead>{t.users.fullName}</TableHead>
                      <TableHead>{t.users.email}</TableHead>
                      <TableHead>{t.users.status}</TableHead>
                      <TableHead>{t.users.role}</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingUsers.map(renderUserRow)}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
          
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-green-600 dark:text-green-400 flex items-center">
              <UserCheck className="mr-2 h-5 w-5" />
              {t.users.approvedUsers} ({approvedUsers.length})
            </h3>
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t.users.username}</TableHead>
                    <TableHead>{t.users.fullName}</TableHead>
                    <TableHead>{t.users.email}</TableHead>
                    <TableHead>{t.users.status}</TableHead>
                    <TableHead>{t.users.role}</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {approvedUsers.map(renderUserRow)}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
