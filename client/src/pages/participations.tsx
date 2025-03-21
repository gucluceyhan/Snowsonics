import { useQuery } from "@tanstack/react-query";
import { EventParticipant, Event } from "@shared/schema";
import { Navbar } from "@/components/layout/navbar";
import EventCard from "@/components/events/event-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLanguage } from "@/hooks/use-language";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";

type ParticipationWithEvent = EventParticipant & {
  event: Event;
};

export default function ParticipationsPage() {
  const { t } = useLanguage();
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

      <Container>
        <Section size="md">
          <div className="space-y-8">
            <div>
              <h1 className="text-4xl font-bold">{t.nav.participations}</h1>
              <p className="text-muted-foreground mt-2">
                {t.participation.yourParticipations || "Katıldığınız ve katılmayı planladığınız etkinlikler"}
              </p>
            </div>

            <Tabs defaultValue="upcoming" className="space-y-4">
              <TabsList>
                <TabsTrigger value="upcoming">{t.participation.upcomingEvents || "Yaklaşan Etkinlikler"}</TabsTrigger>
                <TabsTrigger value="past">{t.participation.pastEvents || "Geçmiş Etkinlikler"}</TabsTrigger>
              </TabsList>

              <TabsContent value="upcoming">
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {upcomingEvents.map((p) => (
                    <EventCard key={p.id} event={p.event} />
                  ))}
                  {upcomingEvents.length === 0 && (
                    <div className="col-span-full text-center p-8">
                      <p className="text-muted-foreground">{t.participation.noUpcomingParticipations || "Yaklaşan etkinlik katılımınız bulunmamaktadır."}</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="past">
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {pastEvents.map((p) => (
                    <EventCard key={p.id} event={p.event} />
                  ))}
                  {pastEvents.length === 0 && (
                    <div className="col-span-full text-center p-8">
                      <p className="text-muted-foreground">{t.participation.noPastParticipations || "Geçmiş etkinlik katılımınız bulunmamaktadır."}</p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </Section>
      </Container>
    </div>
  );
}
