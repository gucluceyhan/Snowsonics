import { useQuery, useMutation } from "@tanstack/react-query";
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
import { Check, Download, Euro } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
  const { toast } = useToast();
  const { data: participants = [] } = useQuery<ParticipantWithUser[]>({
    queryKey: [`/api/events/${eventId}/participants`],
  });

  const approveMutation = useMutation({
    mutationFn: async (participantId: number) => {
      await apiRequest("POST", `/api/admin/events/${eventId}/participants/${participantId}/approve`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/events/${eventId}/participants`] });
      toast({
        title: "Katılımcı onaylandı",
        description: "Katılımcı başarıyla onaylandı",
      });
    },
  });

  const updatePaymentStatusMutation = useMutation({
    mutationFn: async ({ participantId, status }: { participantId: number; status: string }) => {
      await apiRequest("PUT", `/api/admin/events/${eventId}/participants/${participantId}/payment`, {
        status,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/events/${eventId}/participants`] });
      toast({
        title: "Ödeme durumu güncellendi",
        description: "Katılımcının ödeme durumu başarıyla güncellendi",
      });
    },
  });

  const exportToExcel = () => {
    // Excel başlık satırı
    const xlsContent = [
      ["Ad", "Soyad", "Telefon", "E-posta", "Oda Tipi", "Kişi Sayısı", "Ödeme Durumu", "Katılım Durumu"].join("\t"),
      ...participants.map(p => [
        p.user.firstName,
        p.user.lastName,
        p.user.phone,
        p.user.email,
        p.roomType ? getRoomTypeLabel(p.roomType) : "-",
        p.roomOccupancy || "-",
        p.paymentStatus === "paid" ? "Ödendi" : "Beklemede",
        p.status === "attending" ? "Katılıyor" : p.status === "maybe" ? "Belki" : "Katılmıyor"
      ].join("\t"))
    ].join("\n");

    const blob = new Blob(["\ufeff" + xlsContent], { type: "application/vnd.ms-excel;charset=utf-8" });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", "katilimcilar.xls");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const getRoomTypeLabel = (type: string) => {
    switch (type) {
      case 'single': return 'Tek Kişilik';
      case 'double': return 'İki Kişilik';
      case 'triple': return 'Üç Kişilik';
      case 'quad': return 'Dört Kişilik';
      default: return '-';
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
              <TableHead>İletişim</TableHead>
              <TableHead>Oda Tipi</TableHead>
              <TableHead>Kişi Sayısı</TableHead>
              <TableHead>Ödeme Durumu</TableHead>
              <TableHead>Katılım Durumu</TableHead>
              <TableHead>İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {participants.map((participant) => (
              <TableRow key={participant.id}>
                <TableCell>
                  {participant.user.firstName} {participant.user.lastName}
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    <div>{participant.user.phone}</div>
                    <div className="text-muted-foreground">{participant.user.email}</div>
                  </div>
                </TableCell>
                <TableCell>
                  {participant.roomType ? getRoomTypeLabel(participant.roomType) : "-"}
                </TableCell>
                <TableCell>
                  {participant.roomOccupancy || "-"}
                </TableCell>
                <TableCell>
                  <Select
                    value={participant.paymentStatus || "pending"}
                    onValueChange={(value) =>
                      updatePaymentStatusMutation.mutate({
                        participantId: participant.id,
                        status: value,
                      })
                    }
                  >
                    <SelectTrigger className="w-[130px]">
                      <SelectValue>
                        <Badge variant={participant.paymentStatus === "paid" ? "default" : "secondary"}>
                          {participant.paymentStatus === "paid" ? "Ödendi" : "Beklemede"}
                        </Badge>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Beklemede</SelectItem>
                      <SelectItem value="paid">Ödendi</SelectItem>
                    </SelectContent>
                  </Select>
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
                <TableCell>
                  {!participant.isApproved && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => approveMutation.mutate(participant.id)}
                      disabled={approveMutation.isPending}
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Onayla
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}