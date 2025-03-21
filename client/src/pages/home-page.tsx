import { useQuery } from "@tanstack/react-query";
import { Event } from "@shared/schema";
import EventCard from "@/components/events/event-card";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/hooks/use-language";
import { Navbar } from "@/components/layout/navbar";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, isWithinInterval } from "date-fns";
import { useState } from "react";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { Grid, GridItem } from "@/components/ui/grid";
import { Spacer } from "@/components/ui/spacer";
import { ContextualTooltip } from "@/components/ui/contextual-tooltip";

export default function HomePage() {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date>();
  const { data: events = [] } = useQuery<Event[]>({ 
    queryKey: ["/api/events"]
  });

  // Filter future events and sort by date
  const futureEvents = events
    .filter(event => new Date(event.endDate) > new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Create a Map of event dates for highlighting
  const eventDates = new Map<string, boolean>();
  events.forEach(event => {
    const startDate = new Date(event.date);
    const endDate = new Date(event.endDate);
    let currentDate = startDate;

    while (currentDate <= endDate) {
      eventDates.set(format(currentDate, "yyyy-MM-dd"), true);
      currentDate.setDate(currentDate.getDate() + 1);
    }
  });

  // Custom styling for days with events
  const modifiers = {
    hasEvent: (date: Date) => eventDates.has(format(date, "yyyy-MM-dd"))
  };

  const modifiersStyles = {
    hasEvent: {
      backgroundColor: "hsl(var(--primary))",
      color: "white",
      borderRadius: "9999px"
    }
  };

  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <Container>
        <Section size="md">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-[#914199]">
              {t.common.welcome}, {user?.firstName}!
            </h1>
            <p className="text-muted-foreground mt-2">
              {!user?.isApproved 
                ? t.auth.approvalPendingMessage
                : t.auth.approvedMessage}
            </p>
          </div>

          <Spacer size="lg" />

          <Tabs defaultValue="list" className="space-y-4">
            <TabsList className="mx-auto">
              <TabsTrigger value="list">{t.events.listView}</TabsTrigger>
              <TabsTrigger value="calendar">{t.events.calendarView}</TabsTrigger>
            </TabsList>

            <TabsContent value="list">
              <Grid cols={1} colsSm={2} colsLg={3} gap={6}>
                {futureEvents.map((event) => (
                  <GridItem key={event.id}>
                    <EventCard event={event} />
                  </GridItem>
                ))}
                {futureEvents.length === 0 && (
                  <GridItem className="col-span-full text-center p-8">
                    <p className="text-muted-foreground">{t.events.noEvents}</p>
                  </GridItem>
                )}
              </Grid>
            </TabsContent>

            <TabsContent value="calendar">
              <Grid cols={1} colsLg={2} gap={8}>
                <GridItem>
                  <ContextualTooltip
                    id="calendar-navigation"
                    content={t.tooltips.calendarNavigation}
                    position="top"
                    showOnce={true}
                  >
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      className="rounded-md border mx-auto max-w-full"
                      modifiers={modifiers}
                      modifiersStyles={modifiersStyles}
                    />
                  </ContextualTooltip>
                </GridItem>
                <GridItem>
                  <h2 className="text-xl font-semibold mb-4">
                    {selectedDate ? format(selectedDate, "PPP") : t.common.selectedDate} {t.events.eventsOn}
                  </h2>
                  <div className="space-y-4">
                    {futureEvents
                      .filter(event => 
                        selectedDate ? 
                          isWithinInterval(selectedDate, {
                            start: new Date(event.date),
                            end: new Date(event.endDate)
                          })
                          : true
                      )
                      .map((event) => (
                        <EventCard key={event.id} event={event} variant="horizontal" />
                      ))
                    }
                    {(selectedDate && futureEvents.filter(event => 
                      isWithinInterval(selectedDate, {
                        start: new Date(event.date),
                        end: new Date(event.endDate)
                      })).length === 0) && (
                      <p className="text-muted-foreground">{t.common.noEventsOnDate}</p>
                    )}
                  </div>
                </GridItem>
              </Grid>
            </TabsContent>
          </Tabs>
        </Section>
      </Container>
    </div>
  );
}