import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { InsertEvent, insertEventSchema, Event } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { ImageUpload } from "@/components/ui/image-upload";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface EventFormProps {
  event?: Event;
  onSuccess?: () => void;
}

export default function EventForm({ event, onSuccess }: EventFormProps) {
  const { toast } = useToast();
  const defaultValues = event ? {
    ...event,
    date: event.date.toString(),
    endDate: event.endDate.toString(),
  } : {
    title: "",
    description: "",
    content: "",
    date: new Date().toISOString(),
    endDate: new Date().toISOString(),
    location: "",
    images: [],
  };

  const form = useForm<InsertEvent>({
    resolver: zodResolver(insertEventSchema),
    defaultValues,
  });

  const mutation = useMutation({
    mutationFn: async (data: InsertEvent) => {
      const formData = new FormData();

      // Event data'yı ekle
      formData.append('title', data.title);
      formData.append('description', data.description);
      formData.append('content', data.content);
      formData.append('date', data.date);
      formData.append('endDate', data.endDate);
      formData.append('location', data.location);

      // Dosyaları ekle
      if (data.images) {
        const images = Array.isArray(data.images) ? data.images : [data.images];
        images.forEach(image => {
          if (image instanceof File) {
            formData.append('images', image);
          }
        });
      }

      const response = await fetch(event ? `/api/events/${event.id}` : '/api/events', {
        method: event ? 'PUT' : 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Etkinlik işlemi başarısız oldu');
      }

      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: `Etkinlik ${event ? "güncellendi" : "oluşturuldu"}`,
        description: `Etkinlik başarıyla ${event ? "güncellendi" : "oluşturuldu"}`,
      });
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast({
        title: "Hata",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <Form {...form}>
      <form 
        onSubmit={form.handleSubmit((data) => mutation.mutate(data))}
        className="space-y-4"
        encType="multipart/form-data"
      >
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Başlık</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Kısa Açıklama</FormLabel>
              <FormControl>
                <Textarea {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>İçerik</FormLabel>
              <FormControl>
                <RichTextEditor
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Etkinlik içeriğini giriniz..."
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Başlangıç Tarihi</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(new Date(field.value), "PPP")
                        ) : (
                          <span>Tarih seçin</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={new Date(field.value)}
                      onSelect={(date) => field.onChange(date?.toISOString())}
                      disabled={(date) =>
                        date < new Date(new Date().setHours(0, 0, 0, 0))
                      }
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="endDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Bitiş Tarihi</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(new Date(field.value), "PPP")
                        ) : (
                          <span>Tarih seçin</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={new Date(field.value)}
                      onSelect={(date) => field.onChange(date?.toISOString())}
                      disabled={(date) =>
                        date < new Date(field.value || new Date().setHours(0, 0, 0, 0))
                      }
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Konum</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="images"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fotoğraflar</FormLabel>
              <FormControl>
                <ImageUpload
                  onChange={(files) => {
                    field.onChange(files);
                  }}
                  maxFiles={5}
                  preview={Array.isArray(field.value) ? field.value : []}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button 
          type="submit" 
          className="w-full"
          disabled={mutation.isPending}
        >
          {mutation.isPending && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          {event ? "Etkinliği Güncelle" : "Etkinlik Oluştur"}
        </Button>
      </form>
    </Form>
  );
}