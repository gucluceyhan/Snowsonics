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

function rgbToHex(r: number, g: number, b: number) {
  return "#" + [r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  }).join("");
}

function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

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
    mutationFn: async (data: Partial<SiteSettings>) => {
      await apiRequest("PUT", "/api/admin/site-settings", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/site-settings"] });
      toast({
        title: "Ayarlar güncellendi",
        description: "Site ayarları başarıyla güncellendi",
      });
    },
  });

  const primaryRgb = hexToRgb(settings?.primaryColor || "#914199");
  const secondaryRgb = hexToRgb(settings?.secondaryColor || "#F7E15C");

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
            <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-6">
              <FormField
                control={form.control}
                name="logoUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Logo</FormLabel>
                    <FormControl>
                      <ImageUpload
                        value={field.value ? [field.value] : []}
                        onChange={(urls) => field.onChange(urls[0])}
                        maxFiles={1}
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
                      <FormLabel>Ana Renk (RGB: {primaryRgb?.r}, {primaryRgb?.g}, {primaryRgb?.b})</FormLabel>
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
                      <FormLabel>İkincil Renk (RGB: {secondaryRgb?.r}, {secondaryRgb?.g}, {secondaryRgb?.b})</FormLabel>
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
                    <img 
                      src={form.watch("logoUrl") || "/logo.jpeg"}
                      alt="Logo Preview"
                      className="h-20 w-auto"
                    />
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
