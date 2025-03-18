import { useQuery } from "@tanstack/react-query";
import { Event, EventParticipant } from "@shared/schema";
import { useParams } from "wouter";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Users, Edit2 } from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/hooks/use-auth";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import cn from 'classnames';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";

export default function EventDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [roomType, setRoomType] = useState<string | null>(null);
  const [roomOccupancy, setRoomOccupancy] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const { data: event } = useQuery<Event>({ 
    queryKey: [`/api/events/${id}`]
  });

  const { data: myParticipation } = useQuery<EventParticipant>({ 
    queryKey: [`/api/events/${id}/my-participation`],
    enabled: !!user
  });

  const participateMutation = useMutation({
    mutationFn: async (data: {status: string, roomType?: string, roomOccupancy?: number}) => {
      await apiRequest("POST", `/api/events/${id}/participate`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/events/${id}/participants`] });
      queryClient.invalidateQueries({ queryKey: [`/api/events/${id}/my-participation`] });
      toast({
        title: "Katılım talebi gönderildi",
        description: "Admin onayından sonra katılımınız onaylanacaktır.",
      });
      setIsEditing(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Hata",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateParticipationMutation = useMutation({
    mutationFn: async (data: {roomType: string, roomOccupancy: number}) => {
      await apiRequest("PUT", `/api/events/${id}/participate`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/events/${id}/participants`] });
      queryClient.invalidateQueries({ queryKey: [`/api/events/${id}/my-participation`] });
      toast({
        title: "Güncelleme talebi gönderildi",
        description: "Admin onayından sonra değişiklikler yansıyacaktır.",
      });
      setIsEditing(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Hata",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Başlangıç değerlerini ayarla
  useState(() => {
    if (myParticipation?.isApproved) {
      setRoomType(myParticipation.roomType || null);
      setRoomOccupancy(myParticipation.roomOccupancy || null);
    }
  }, [myParticipation]);

  if (!event) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {event.images?.length > 0 && (
            <div className="grid grid-cols-1 gap-4">
              <div className="aspect-video overflow-hidden rounded-lg bg-muted">
                <img 
                  src={event.images[0]}
                  alt={event.title}
                  className="object-cover w-full h-full"
                />
              </div>
            </div>
          )}

          <div className="space-y-4">
            <h1 className="text-4xl font-bold">{event.title}</h1>

            <div className="flex flex-wrap gap-4 text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                {format(new Date(event.date), "PPP")} - {format(new Date(event.endDate), "PPP")}
              </div>

              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                {event.location || "Konum belirtilmemiş"}
              </div>
            </div>

            <div 
              className="prose prose-gray dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: event.content as string }}
            />
          </div>

          {user?.isApproved && (
            <div className="flex flex-col gap-4 pt-8 border-t">
              {myParticipation?.isApproved && !isEditing ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Badge variant="default">Katılımınız Onaylandı</Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditing(true)}
                    >
                      <Edit2 className="w-4 h-4 mr-2" />
                      Düzenle
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-muted-foreground">Oda Tipi</span>
                      <p>{myParticipation.roomType === 'single' ? 'Tek Kişilik' : 
                         myParticipation.roomType === 'double' ? 'İki Kişilik' : 
                         myParticipation.roomType === 'triple' ? 'Üç Kişilik' : 
                         'Dört Kişilik'} Oda</p>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Kişi Sayısı</span>
                      <p>{myParticipation.roomOccupancy} Kişi</p>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Select 
                      value={roomType || ''} 
                      onValueChange={(value) => setRoomType(value)}
                      disabled={myParticipation?.isApproved && !isEditing}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Oda tipi seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="single">Tek Kişilik Oda</SelectItem>
                        <SelectItem value="double">İki Kişilik Oda</SelectItem>
                        <SelectItem value="triple">Üç Kişilik Oda</SelectItem>
                        <SelectItem value="quad">Dört Kişilik Oda</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select 
                      value={roomOccupancy?.toString() || ''} 
                      onValueChange={(value) => setRoomOccupancy(parseInt(value))}
                      disabled={myParticipation?.isApproved && !isEditing}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Kişi sayısı seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 Kişi</SelectItem>
                        <SelectItem value="2">2 Kişi</SelectItem>
                        <SelectItem value="3">3 Kişi</SelectItem>
                        <SelectItem value="4">4 Kişi</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    className="w-full"
                    onClick={() => {
                      if (isEditing) {
                        updateParticipationMutation.mutate({
                          roomType: roomType!,
                          roomOccupancy: roomOccupancy!
                        });
                      } else {
                        participateMutation.mutate({
                          status: "attending",
                          roomType,
                          roomOccupancy
                        });
                      }
                    }}
                    disabled={(!roomType || !roomOccupancy) || 
                            (participateMutation.isPending || updateParticipationMutation.isPending)}
                  >
                    {isEditing ? "Değişiklikleri Kaydet" : "Katılıyorum"}
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}