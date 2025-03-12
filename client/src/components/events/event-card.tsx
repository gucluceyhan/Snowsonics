import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Event } from "@shared/schema";
import { format } from "date-fns";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Calendar, MapPin } from "lucide-react";

type EventCardProps = {
  event: Event;
};

export default function EventCard({ event }: EventCardProps) {
  const { user } = useAuth();

  const participateMutation = useMutation({
    mutationFn: async (status: string) => {
      await apiRequest("POST", `/api/events/${event.id}/participate`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{event.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground">{event.description}</p>
        
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          {format(new Date(event.date), "PPP")}
        </div>
        
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4" />
          {event.location}
        </div>
      </CardContent>
      
      {user?.isApproved && (
        <CardFooter className="gap-2">
          <Button 
            variant="default"
            onClick={() => participateMutation.mutate("attending")}
            disabled={participateMutation.isPending}
          >
            Attend
          </Button>
          <Button
            variant="outline"
            onClick={() => participateMutation.mutate("maybe")}
            disabled={participateMutation.isPending}
          >
            Maybe
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
