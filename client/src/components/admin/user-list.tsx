import { useQuery } from "@tanstack/react-query";
import { User } from "@shared/schema";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import * as XLSX from "xlsx";
import { Badge } from "@/components/ui/badge";

export function UserList() {
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
  });

  const exportToExcel = () => {
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
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Tüm Kullanıcılar</h3>
        <Button onClick={exportToExcel} variant="outline" size="sm">
          <Download className="w-4 h-4 mr-2" />
          Excel'e Aktar
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ad Soyad</TableHead>
              <TableHead>E-posta</TableHead>
              <TableHead>Telefon</TableHead>
              <TableHead>Meslek</TableHead>
              <TableHead>Şehir</TableHead>
              <TableHead>Durum</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  {user.firstName} {user.lastName}
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.phone}</TableCell>
                <TableCell>{user.occupation}</TableCell>
                <TableCell>{user.city}</TableCell>
                <TableCell>
                  <Badge variant={user.isActive ? "success" : "destructive"}>
                    {user.isActive ? "Aktif" : "Pasif"}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
