import { useQuery } from "@tanstack/react-query";
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download } from "lucide-react";

export default function UsersPage() {
  const { data: users = [] } = useQuery<User[]>({ 
    queryKey: ["/api/admin/users"]
  });

  const exportToExcel = () => {
    let excelContent = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
xmlns:o="urn:schemas-microsoft-com:office:office"
xmlns:x="urn:schemas-microsoft-com:office:excel"
xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
xmlns:html="http://www.w3.org/TR/REC-html40">
<Worksheet ss:Name="Kullanıcılar">
<Table>
<Row>
<Cell><Data ss:Type="String">Ad</Data></Cell>
<Cell><Data ss:Type="String">Soyad</Data></Cell>
<Cell><Data ss:Type="String">Telefon</Data></Cell>
<Cell><Data ss:Type="String">E-posta</Data></Cell>
<Cell><Data ss:Type="String">Şehir</Data></Cell>
<Cell><Data ss:Type="String">Meslek</Data></Cell>
</Row>`;

    users.forEach(user => {
      excelContent += `
<Row>
<Cell><Data ss:Type="String">${user.firstName || ""}</Data></Cell>
<Cell><Data ss:Type="String">${user.lastName || ""}</Data></Cell>
<Cell><Data ss:Type="String">${user.phone || ""}</Data></Cell>
<Cell><Data ss:Type="String">${user.email || ""}</Data></Cell>
<Cell><Data ss:Type="String">${user.city || ""}</Data></Cell>
<Cell><Data ss:Type="String">${user.occupation || ""}</Data></Cell>
</Row>`;
    });

    excelContent += `
</Table>
</Worksheet>
</Workbook>`;

    const blob = new Blob([excelContent], { type: 'application/vnd.ms-excel' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = 'kullanicilar.xls';
    link.click();
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold">Kullanıcı Yönetimi</h1>
              <p className="text-muted-foreground mt-2">
                Onaylı kullanıcıların listesi
              </p>
            </div>

            <Button onClick={exportToExcel}>
              <Download className="mr-2 h-4 w-4" />
              Excel'e Aktar
            </Button>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kullanıcı Adı</TableHead>
                  <TableHead>Ad Soyad</TableHead>
                  <TableHead>İletişim</TableHead>
                  <TableHead>Şehir</TableHead>
                  <TableHead>Meslek</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.username}</TableCell>
                    <TableCell>{user.firstName} {user.lastName}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{user.phone}</div>
                        <div className="text-muted-foreground">{user.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>{user.city || "-"}</TableCell>
                    <TableCell>{user.occupation || "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </main>
    </div>
  );
}