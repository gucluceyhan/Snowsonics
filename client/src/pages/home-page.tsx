import { useQuery } from "@tanstack/react-query";
import { Event } from "@shared/schema";
import EventCard from "@/components/events/event-card";
import { useAuth } from "@/hooks/use-auth";
import { Navbar } from "@/components/layout/navbar";

export default function HomePage() {
  const { user } = useAuth();
  const { data: events = [] } = useQuery<Event[]>({ 
    queryKey: ["/api/events"]
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          <div>
            <h1 className="text-4xl font-bold">Welcome, {user?.firstName}!</h1>
            <p className="text-muted-foreground mt-2">
              {!user?.isApproved 
                ? "Your account is pending approval. You'll be able to participate in events once approved."
                : "Check out our upcoming events and join the ones you're interested in!"}
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
