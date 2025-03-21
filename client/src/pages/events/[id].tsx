import { useQuery } from "@tanstack/react-query";
import { Event, EventParticipant } from "@shared/schema";
import { useParams } from "wouter";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Users, Edit2, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/hooks/use-auth";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import cn from 'classnames';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { Grid, GridItem } from "@/components/ui/grid";
import { Spacer } from "@/components/ui/spacer";
import { useLanguage } from "@/hooks/use-language";
import { ContextualTooltip } from "@/components/ui/contextual-tooltip";

export default function EventDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
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
        title: t.participation.participationSubmitted,
        description: t.participation.pending,
      });
      setIsEditing(false);
    },
    onError: (error: Error) => {
      toast({
        title: t.errors.genericError,
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
        title: t.participation.participationUpdated,
        description: t.participation.pending,
      });
      setIsEditing(false);
    },
    onError: (error: Error) => {
      toast({
        title: t.errors.genericError,
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

      <Container>
        <Section size="md" className="max-w-4xl mx-auto">
          {event.images?.length > 0 && (
            <div className="aspect-video overflow-hidden rounded-lg bg-muted mb-8">
              <img 
                src={event.images[0]}
                alt={event.title}
                className="object-cover w-full h-full"
              />
            </div>
          )}

          <div className="space-y-4 mb-8">
            <h1 className="text-4xl font-bold">{event.title}</h1>

            <Grid cols={1} colsMd={2} colsLg={3} gap={4} className="text-muted-foreground">
              <GridItem className="flex items-center gap-2">
                <Calendar className="h-5 w-5 flex-shrink-0" />
                <span>{format(new Date(event.date), "PPP")} - {format(new Date(event.endDate), "PPP")}</span>
              </GridItem>

              <GridItem className="flex items-center gap-2">
                <MapPin className="h-5 w-5 flex-shrink-0" />
                <span>{event.location || t.participation.locationNotSpecified}</span>
              </GridItem>

              {myParticipation && (
                <GridItem className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 flex-shrink-0" />
                  <span>
                    {t.participation.participationStatus}:{" "}
                    <Badge variant={myParticipation.isApproved ? "default" : "secondary"}>
                      {myParticipation.isApproved ? t.participation.approved : t.participation.pending}
                    </Badge>
                  </span>
                </GridItem>
              )}
            </Grid>

            <Spacer size="md" />
            
            <div 
              className="prose prose-gray dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: event.content as string }}
            />
          </div>

          {user?.isApproved && (
            <div className="pt-8 border-t">
              {myParticipation?.isApproved && !isEditing ? (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <Badge variant="default">{t.participation.participationApproved}</Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditing(true)}
                    >
                      <Edit2 className="w-4 h-4 mr-2" />
                      {t.participation.edit}
                    </Button>
                  </div>
                  
                  <Grid cols={1} colsMd={2} gap={4}>
                    <GridItem>
                      <span className="text-sm text-muted-foreground block">{t.participation.roomType}</span>
                      <p>{myParticipation.roomType === 'single' ? t.participation.singleRoom : 
                        myParticipation.roomType === 'double' ? t.participation.doubleRoom : 
                        myParticipation.roomType === 'triple' ? t.participation.tripleRoom : 
                        t.participation.quadRoom}</p>
                    </GridItem>
                    <GridItem>
                      <span className="text-sm text-muted-foreground block">{t.participation.roomOccupancy}</span>
                      <p>{myParticipation.roomOccupancy} {t.participation.person}</p>
                    </GridItem>
                  </Grid>
                </div>
              ) : (
                <div className="space-y-6">
                  <Grid cols={1} colsMd={2} gap={4}>
                    <GridItem>
                      <ContextualTooltip
                        id="room-type-select"
                        content={t.tooltips.roomTypeSelect}
                        position="top"
                        showOnce={true}
                      >
                        <Select 
                          value={roomType || ''} 
                          onValueChange={(value) => setRoomType(value)}
                          disabled={myParticipation?.isApproved && !isEditing}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={t.participation.selectRoomType} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="single">{t.participation.singleRoom}</SelectItem>
                            <SelectItem value="double">{t.participation.doubleRoom}</SelectItem>
                            <SelectItem value="triple">{t.participation.tripleRoom}</SelectItem>
                            <SelectItem value="quad">{t.participation.quadRoom}</SelectItem>
                          </SelectContent>
                        </Select>
                      </ContextualTooltip>
                    </GridItem>

                    <GridItem>
                      <Select 
                        value={roomOccupancy?.toString() || ''} 
                        onValueChange={(value) => setRoomOccupancy(parseInt(value))}
                        disabled={myParticipation?.isApproved && !isEditing}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t.participation.selectOccupancy} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 {t.participation.person}</SelectItem>
                          <SelectItem value="2">2 {t.participation.person}</SelectItem>
                          <SelectItem value="3">3 {t.participation.person}</SelectItem>
                          <SelectItem value="4">4 {t.participation.person}</SelectItem>
                        </SelectContent>
                      </Select>
                    </GridItem>
                  </Grid>

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
                    {isEditing ? t.participation.saveChanges : t.participation.join}
                  </Button>
                </div>
              )}
            </div>
          )}
        </Section>
      </Container>
    </div>
  );
}