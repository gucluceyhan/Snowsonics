import { useQuery } from "@tanstack/react-query";
import { Event } from "@shared/schema";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import EventForm from "@/components/events/event-form";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { Plus, Edit, Trash, Users } from "lucide-react";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ParticipantList } from "@/components/admin/participant-list";
import { ContextualTooltip } from "@/components/ui/contextual-tooltip";
import { useLanguage } from "@/hooks/use-language";

export default function EventsPage() {
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isNewEventDialogOpen, setIsNewEventDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const { toast } = useToast();
  const { t } = useLanguage();

  const { data: events = [] } = useQuery<Event[]>({ 
    queryKey: ["/api/events"]
  });

  const deleteMutation = useMutation({
    mutationFn: async (eventId: number) => {
      await apiRequest("DELETE", `/api/events/${eventId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      toast({
        title: t.events.eventDeleted,
        description: t.events.eventDeleted,
      });
      setIsDeleteDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: t.errors.genericError,
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const confirmDelete = (event: Event) => {
    setSelectedEvent(event);
    setIsDeleteDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          <div className="md:flex md:items-center md:justify-between block">
            <div className="mb-4 md:mb-0">
              <h1 className="text-4xl font-bold">{t.events.title}</h1>
              <p className="text-muted-foreground mt-2">
                {t.events.subtitle}
              </p>
            </div>

            <ContextualTooltip
              id="add-event-button"
              content="Yeni etkinlik oluşturmak için tıklayın"
              position="left"
              showOnce={true}
            >
              <Button 
                onClick={() => {
                  console.log("Add Event button clicked");
                  setIsNewEventDialogOpen(true);
                }}
                className="w-full md:w-auto"
              >
                <Plus className="mr-2 h-4 w-4" />
                {t.events.addEvent}
              </Button>
            </ContextualTooltip>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t.events.eventTitle}</TableHead>
                  <TableHead>{t.events.eventDate}</TableHead>
                  <TableHead>{t.events.location}</TableHead>
                  <TableHead className="w-[150px]">{t.users.actions}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell className="font-medium">{event.title}</TableCell>
                    <TableCell>{format(new Date(event.date), "PPP")}</TableCell>
                    <TableCell>{event.location}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <ContextualTooltip
                          id="view-participants-button"
                          content="Katılımcı listesini görüntüle"
                          position="top"
                          showOnce={true}
                        >
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedEvent(event);
                              setShowParticipants(true);
                            }}
                          >
                            <Users className="h-4 w-4" />
                          </Button>
                        </ContextualTooltip>

                        <ContextualTooltip
                          id="edit-event-button"
                          content="Etkinlik bilgilerini düzenle"
                          position="top"
                          showOnce={true}
                        >
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => {
                              setSelectedEvent(event);
                              setIsEditDialogOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </ContextualTooltip>

                        <ContextualTooltip
                          id="delete-event-button"
                          content="Etkinliği sil"
                          position="top"
                          showOnce={true}
                        >
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => confirmDelete(event)}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </ContextualTooltip>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* New Event Dialog */}
        <Dialog open={isNewEventDialogOpen} onOpenChange={setIsNewEventDialogOpen}>
          <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t.events.addEvent}</DialogTitle>
            </DialogHeader>
            <EventForm 
              onSuccess={() => {
                queryClient.invalidateQueries({ queryKey: ["/api/events"] });
                setIsNewEventDialogOpen(false);
              }} 
            />
          </DialogContent>
        </Dialog>

        {/* Edit Event Dialog */}
        {selectedEvent && (
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{t.events.editEvent}</DialogTitle>
              </DialogHeader>
              <EventForm 
                event={selectedEvent}
                onSuccess={() => {
                  queryClient.invalidateQueries({ queryKey: ["/api/events"] });
                  setIsEditDialogOpen(false);
                }} 
              />
            </DialogContent>
          </Dialog>
        )}

        {/* Participants Dialog */}
        <Dialog open={showParticipants} onOpenChange={setShowParticipants}>
          <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t.events.participants} - {selectedEvent?.title}</DialogTitle>
            </DialogHeader>
            {selectedEvent && <ParticipantList eventId={selectedEvent.id} />}
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t.events.confirmDeleteTitle}</AlertDialogTitle>
              <AlertDialogDescription>
                {t.events.confirmDeleteMessage}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (selectedEvent) {
                    deleteMutation.mutate(selectedEvent.id);
                  }
                }}
              >
                {t.common.delete}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  );
}