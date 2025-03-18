import { useQuery } from "@tanstack/react-query";
import { EventParticipant } from "@shared/schema";
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
import { Download } from "lucide-react";

type ParticipantWithUser = EventParticipant & {
  user: {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
  };
};

interface ParticipantListProps {
  eventId: number;
}

export function ParticipantList({ eventId }: ParticipantListProps) {
  const { data: participants = [] } = useQuery<ParticipantWithUser[]>({
    queryKey: [`/api/events/${eventId}/participants`],
  });

  const exportToExcel = () => {
    const csvContent = [
      ["Ad", "Soyad", "Telefon", "E-posta", "Oda Tercihi", "Ödeme Durumu", "Katılım Durumu"].join(","),
      ...participants.map(p => [
        p.user.firstName,
        p.user.lastName,
        p.user.phone,
        p.user.email,
        p.roomPreference || "-",
        p.paymentStatus === "paid" ? "Ödendi" : "Beklemede",
        p.status === "attending" ? "Katılıyor" : p.status === "maybe" ? "Belki" : "Katılmıyor"
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", "katilimcilar.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Katılımcı Listesi</h3>
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
              <TableHead>E-posta</TableHead>
              <TableHead>Oda Tercihi</TableHead>
              <TableHead>Ödeme Durumu</TableHead>
              <TableHead>Katılım Durumu</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {participants.map((participant) => (
              <TableRow key={participant.id}>
                <TableCell>
                  {participant.user.firstName} {participant.user.lastName}
                </TableCell>
                <TableCell>{participant.user.phone}</TableCell>
                <TableCell>{participant.user.email}</TableCell>
                <TableCell>
                  {participant.roomPreference ? `${participant.roomPreference} Kişilik` : "-"}
                </TableCell>
                <TableCell>
                  <Badge variant={participant.paymentStatus === "paid" ? "default" : "secondary"}>
                    {participant.paymentStatus === "paid" ? "Ödendi" : "Beklemede"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge 
                    variant={
                      participant.status === "attending" 
                        ? "default" 
                        : participant.status === "maybe" 
                          ? "outline" 
                          : "destructive"
                    }
                  >
                    {participant.status === "attending" 
                      ? "Katılıyor" 
                      : participant.status === "maybe" 
                        ? "Belki" 
                        : "Katılmıyor"}
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
