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

export default function EventDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  
  const { data: event } = useQuery<Event>({ 
    queryKey: [`/api/events/${id}`]
  });

  const { data: participants = [] } = useQuery({ 
    queryKey: [`/api/events/${id}/participants`]
  });

  const participateMutation = useMutation({
    mutationFn: async (status: string) => {
      await apiRequest("POST", `/api/events/${id}/participate`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/events/${id}/participants`] });
    },
  });

  if (!event) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {event.imageUrl && (
            <div className="aspect-video w-full overflow-hidden rounded-lg bg-muted">
              <img 
                src={event.imageUrl} 
                alt={event.title}
                className="object-cover w-full h-full"
              />
            </div>
          )}

          <div className="space-y-4">
            <h1 className="text-4xl font-bold">{event.title}</h1>
            
            <div className="flex flex-wrap gap-4 text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                {format(new Date(event.date), "PPP")}
              </div>
              
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                {event.location}
              </div>

              <div className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                {participants.length} katılımcı
              </div>
            </div>

            <div className="prose prose-gray dark:prose-invert max-w-none">
              <div dangerouslySetInnerHTML={{ __html: event.content }} />
            </div>
          </div>

          {user?.isApproved && (
            <div className="flex gap-2 pt-8 border-t">
              <Button
                className="flex-1"
                onClick={() => participateMutation.mutate("attending")}
                disabled={participateMutation.isPending}
              >
                Katılıyorum
              </Button>
              <Button
                className="flex-1"
                variant="outline"
                onClick={() => participateMutation.mutate("maybe")}
                disabled={participateMutation.isPending}
              >
                Belki
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
