import { useQuery, useMutation } from "@tanstack/react-query";
import { SiteSettings } from "@shared/schema";
import { Navbar } from "@/components/layout/navbar";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ImageUpload } from "@/components/ui/image-upload";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export default function SiteSettingsPage() {
  const { toast } = useToast();
  const { data: settings } = useQuery<SiteSettings>({
    queryKey: ["/api/admin/site-settings"],
  });

  const form = useForm({
    defaultValues: {
      logoUrl: settings?.logoUrl || "",
      primaryColor: settings?.primaryColor || "#914199",
      secondaryColor: settings?.secondaryColor || "#F7E15C",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await fetch('/api/admin/site-settings', {
        method: 'PUT',
        body: data,
      });
      if (!response.ok) {
        throw new Error('Ayarlar güncellenirken bir hata oluştu');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/site-settings"] });
      toast({
        title: "Ayarlar güncellendi",
        description: "Site ayarları başarıyla güncellendi",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Hata",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const onSubmit = async (data: any) => {
    const formData = new FormData();
    formData.append('primaryColor', data.primaryColor);
    formData.append('secondaryColor', data.secondaryColor);

    // Get the actual file from the input element
    const fileInput = document.getElementById('image-upload') as HTMLInputElement;
    if (fileInput?.files?.length) {
      formData.append('logo', fileInput.files[0]);
    }

    mutation.mutate(formData);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-8">
          <div>
            <h1 className="text-4xl font-bold">Site Ayarları</h1>
            <p className="text-muted-foreground mt-2">
              Site görünümünü ve renklerini buradan yönetebilirsiniz
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="logoUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Logo</FormLabel>
                    <FormControl>
                      <ImageUpload
                        id="image-upload" // Added ID for file access
                        value={field.value ? [field.value] : []}
                        onChange={(urls) => field.onChange(urls[0])}
                        maxFiles={1}
                        acceptedTypes="image/jpeg,image/png"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="primaryColor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ana Renk</FormLabel>
                      <FormControl>
                        <div className="flex gap-2">
                          <Input type="color" {...field} />
                          <Input {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="secondaryColor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>İkincil Renk</FormLabel>
                      <FormControl>
                        <div className="flex gap-2">
                          <Input type="color" {...field} />
                          <Input {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Önizleme</h3>
                <div className="p-6 border rounded-lg space-y-4">
                  <div className="flex items-center justify-center">
                    {settings?.logoUrl && (
                      <img 
                        src={settings.logoUrl}
                        alt="Logo Preview"
                        className="h-20 w-auto"
                      />
                    )}
                  </div>
                  <div 
                    className="h-20 rounded-lg" 
                    style={{
                      background: `linear-gradient(to right, ${form.watch("primaryColor")}, ${form.watch("secondaryColor")})`
                    }}
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full"
                disabled={mutation.isPending}
              >
                {mutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Ayarları Kaydet
              </Button>
            </form>
          </Form>
        </div>
      </main>
    </div>
  );
}