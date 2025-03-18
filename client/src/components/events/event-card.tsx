import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Event } from "@shared/schema";
import { format } from "date-fns";
import { Calendar, MapPin, Info } from "lucide-react";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";

type EventCardProps = {
  event: Event;
  variant?: "default" | "horizontal";
};

export default function EventCard({ event, variant = "default" }: EventCardProps) {
  const [, setLocation] = useLocation();

  const { data: myParticipation } = useQuery({
    queryKey: [`/api/events/${event.id}/my-participation`],
  });

  const getParticipationStatus = () => {
    if (!myParticipation) return null;
    if (myParticipation.isApproved) return "Onaylandı";
    return "Admin Onayı Bekliyor";
  };

  const participationStatus = getParticipationStatus();

  const cardContent = (
    <>
      <CardHeader>
        {variant !== "horizontal" && event.images?.length > 0 && (
          <div className="relative aspect-square mb-4 overflow-hidden rounded-lg bg-muted">
            <img 
              src={event.images[0]} 
              alt={event.title}
              className="object-cover w-full h-full"
            />
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

        {participationStatus && (
          <div className="flex items-center gap-2">
            <Badge variant={myParticipation?.isApproved ? "default" : "secondary"}>
              {participationStatus}
            </Badge>
          </div>
        )}
      </CardContent>

      <CardFooter>
        <Button
          className="flex-1"
          variant="outline"
          onClick={() => setLocation(`/events/${event.id}`)}
        >
          <Info className="w-4 h-4 mr-2" />
          Detaylar
        </Button>
      </CardFooter>
    </>
  );

  return variant === "horizontal" ? (
    <Card className="flex flex-col md:flex-row overflow-hidden">
      {event.images?.length > 0 && (
        <div className="md:w-1/3 h-[200px]">
          <img 
            src={event.images[0]} 
            alt={event.title}
            className="object-cover w-full h-full"
          />
        </div>
      )}
      <div className="md:w-2/3">
        {cardContent}
      </div>
    </Card>
  ) : (
    <Card className="flex flex-col h-full">
      {cardContent}
    </Card>
  );
}