import { useQuery } from "@tanstack/react-query";
import { Event } from "@shared/schema";
import { useParams } from "wouter";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Users } from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/hooks/use-auth";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import cn from 'classnames';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";

export default function EventDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [roomType, setRoomType] = useState<string | null>(null);
  const [roomOccupancy, setRoomOccupancy] = useState<number | null>(null);

  const { data: event } = useQuery<Event>({ 
    queryKey: [`/api/events/${id}`]
  });

  const { data: participants = [] } = useQuery({ 
    queryKey: [`/api/events/${id}/participants`]
  });

  const participateMutation = useMutation({
    mutationFn: async (data: {status: string, roomType?: string, roomOccupancy?: number}) => {
      await apiRequest("POST", `/api/events/${id}/participate`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/events/${id}/participants`] });
      toast({
        title: "Katılım talebi gönderildi",
        description: "Admin onayından sonra katılımınız onaylanacaktır.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Hata",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (!event) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {event.images?.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {event.images.map((image, index) => (
                <div 
                  key={index}
                  className={cn(
                    "aspect-video overflow-hidden rounded-lg bg-muted",
                    index === 0 && "md:col-span-2 lg:col-span-3"
                  )}
                >
                  <img 
                    src={image}
                    alt={`${event.title} - ${index + 1}`}
                    className="object-cover w-full h-full"
                  />
                </div>
              ))}
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

              <div className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                {participants.length} katılımcı
              </div>
            </div>

            <div 
              className="prose prose-gray dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: event.content as string }}
            />
          </div>

          {user?.isApproved && (
            <div className="flex flex-col gap-4 pt-8 border-t">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select onValueChange={(value) => setRoomType(value)}>
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

                <Select onValueChange={(value) => setRoomOccupancy(parseInt(value))}>
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
                onClick={() => participateMutation.mutate({
                  status: "attending",
                  roomType,
                  roomOccupancy
                })}
                disabled={participateMutation.isPending || !roomType || !roomOccupancy}
              >
                Katılıyorum
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}