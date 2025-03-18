import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Event } from "@shared/schema";
import { format } from "date-fns";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Calendar, MapPin, Info } from "lucide-react";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

type EventCardProps = {
  event: Event;
  variant?: "default" | "horizontal";
};

export default function EventCard({ event, variant = "default" }: EventCardProps) {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const participateMutation = useMutation({
    mutationFn: async (status: string) => {
      await apiRequest("POST", `/api/events/${event.id}/participate`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      queryClient.invalidateQueries({ queryKey: [`/api/events/${event.id}/participants`] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/participations"] });
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

const cardContent = (
  <>
    <CardHeader>
      {event.images?.length > 0 && (
        <div className={cn(
          "relative aspect-square mb-4 overflow-hidden rounded-lg bg-muted",
          variant === "horizontal" && "aspect-video"
        )}>
          <img 
            src={event.images[0]} 
            alt={event.title}
            className="object-cover w-full h-full"
          />
          {event.images.length > 1 && (
            <div className="absolute bottom-2 right-2 bg-background/80 px-2 py-1 rounded text-xs">
              +{event.images.length - 1} fotoğraf
            </div>
          )}
        </div>
      )}
      <CardTitle>{event.title}</CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      <p className="text-muted-foreground line-clamp-2">{event.description}</p>

      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Calendar className="h-4 w-4" />
        {format(new Date(event.date), "PPP")}
      </div>

      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <MapPin className="h-4 w-4" />
        {event.location}
      </div>
    </CardContent>

    <CardFooter className="gap-2">
      <Button
        className="flex-1"
        variant="outline"
        onClick={() => setLocation(`/events/${event.id}`)}
      >
        <Info className="w-4 h-4 mr-2" />
        Detaylar
      </Button>

      {user?.isApproved && (
        <Button 
          variant="default"
          onClick={() => participateMutation.mutate("attending")}
          disabled={participateMutation.isPending}
        >
          Katıl
        </Button>
      )}
    </CardFooter>
  </>
);

  return variant === "horizontal" ? (
    <Card className="flex flex-col md:flex-row overflow-hidden">
      <div className="md:w-1/3">
        {event.images?.length > 0 && (
          <div className="relative aspect-video md:h-full">
            <img 
              src={event.images[0]} 
              alt={event.title}
              className="object-cover w-full h-full"
            />
          </div>
        )}
      </div>
      <div className="md:w-2/3 flex flex-col">
        {cardContent}
      </div>
    </Card>
  ) : (
    <Card className="flex flex-col h-full">
      {cardContent}
    </Card>
  );
}