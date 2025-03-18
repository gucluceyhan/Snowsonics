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

export function UserList() {
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
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
<Cell><Data ss:Type="String">Meslek</Data></Cell>
<Cell><Data ss:Type="String">Şehir</Data></Cell>
</Row>`;

    users.forEach(user => {
      excelContent += `
<Row>
<Cell><Data ss:Type="String">${user.firstName}</Data></Cell>
<Cell><Data ss:Type="String">${user.lastName}</Data></Cell>
<Cell><Data ss:Type="String">${user.phone}</Data></Cell>
<Cell><Data ss:Type="String">${user.occupation}</Data></Cell>
<Cell><Data ss:Type="String">${user.city}</Data></Cell>
</Row>`;
    });

    excelContent += `
</Table>
</Worksheet>
</Workbook>`;

    const blob = new Blob([excelContent], { 
      type: "application/vnd.ms-excel" 
    });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", "kullanicilar.xls");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Onaylı Kullanıcılar</h3>
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
              <TableHead>Telefon</TableHead>
              <TableHead>Meslek</TableHead>
              <TableHead>Şehir</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  {user.firstName} {user.lastName}
                </TableCell>
                <TableCell>{user.phone}</TableCell>
                <TableCell>{user.occupation}</TableCell>
                <TableCell>{user.city}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
