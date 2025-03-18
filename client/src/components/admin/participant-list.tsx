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
import { Check, Download } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

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
        title: "Participant approved",
        description: "The participant has been approved successfully",
      });
    },
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
              <TableHead>İşlemler</TableHead>
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