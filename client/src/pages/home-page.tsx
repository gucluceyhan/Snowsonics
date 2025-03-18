import { useQuery } from "@tanstack/react-query";
import { Event } from "@shared/schema";
import EventCard from "@/components/events/event-card";
import { useAuth } from "@/hooks/use-auth";
import { Navbar } from "@/components/layout/navbar";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, isWithinInterval } from "date-fns";
import { useState } from "react";

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
      color: "white",
      backgroundColor: "hsl(var(--primary))",
      borderRadius: "9999px"
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          <div>
            <h1 className="text-4xl font-bold">Hoş geldin, {user?.firstName}!</h1>
            <p className="text-muted-foreground mt-2">
              {!user?.isApproved 
                ? "Hesabın onay bekliyor. Onaylandıktan sonra etkinliklere katılabilirsin."
                : "Yaklaşan etkinlikleri incele ve ilgilendiğin etkinliklere katıl!"}
            </p>
          </div>

          <Tabs defaultValue="list" className="space-y-4">
            <TabsList>
              <TabsTrigger value="list">Liste Görünümü</TabsTrigger>
              <TabsTrigger value="calendar">Takvim Görünümü</TabsTrigger>
            </TabsList>

            <TabsContent value="list">
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {futureEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="calendar">
              <div className="flex flex-col lg:flex-row gap-8">
                <div className="lg:w-1/2">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    className="rounded-md border"
                    modifiers={modifiers}
                    modifiersStyles={modifiersStyles}
                  />
                </div>
                <div className="lg:w-1/2">
                  <h2 className="text-xl font-semibold mb-4">
                    {selectedDate ? format(selectedDate, "PPP") : "Seçili tarihte"} etkinlikler
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
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}