import { useQuery } from "@tanstack/react-query";
import { EventParticipant, Event } from "@shared/schema";
import { Navbar } from "@/components/layout/navbar";
import EventCard from "@/components/events/event-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type ParticipationWithEvent = EventParticipant & {
  event: Event;
};

export default function ParticipationsPage() {
  const { data: participations = [] } = useQuery<ParticipationWithEvent[]>({
    queryKey: ["/api/user/participations"],
  });

  const now = new Date();
  const pastEvents = participations
    .filter(p => new Date(p.event.date) < now)
    .sort((a, b) => new Date(b.event.date).getTime() - new Date(a.event.date).getTime());

  const upcomingEvents = participations
    .filter(p => new Date(p.event.date) >= now)
    .sort((a, b) => new Date(a.event.date).getTime() - new Date(b.event.date).getTime());

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          <div>
            <h1 className="text-4xl font-bold">Etkinlik Katılımlarım</h1>
            <p className="text-muted-foreground mt-2">
              Katıldığınız ve katılmayı planladığınız etkinlikler
            </p>
          </div>

          <Tabs defaultValue="upcoming" className="space-y-4">
            <TabsList>
              <TabsTrigger value="upcoming">Yaklaşan Etkinlikler</TabsTrigger>
              <TabsTrigger value="past">Geçmiş Etkinlikler</TabsTrigger>
            </TabsList>

            <TabsContent value="upcoming">
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {upcomingEvents.map((p) => (
                  <EventCard key={p.id} event={p.event} />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="past">
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {pastEvents.map((p) => (
                  <EventCard key={p.id} event={p.event} />
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
