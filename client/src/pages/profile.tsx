import { useAuth } from "@/hooks/use-auth";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { InsertUser, insertUserSchema } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { User } from "lucide-react";
import { useEffect } from "react";

export default function ProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  console.log("Profil sayfası yükleniyor, mevcut kullanıcı bilgileri:", user);

  const form = useForm<InsertUser>({
    resolver: zodResolver(insertUserSchema.partial()),
    defaultValues: {
      username: user?.username || "",
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
      phone: user?.phone || "",
      city: user?.city || "",
      occupation: user?.occupation || "",
      instagram: user?.instagram || "",
    },
  });
  
  // Kullanıcı verisi değiştiğinde form alanlarını güncelle
  useEffect(() => {
    if (user) {
      form.reset({
        username: user.username || "",
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        phone: user.phone || "",
        city: user.city || "",
        occupation: user.occupation || "",
        instagram: user.instagram || "",
      });
    }
  }, [user, form]);

  // Doğrudan fetch API kullan
  const updateProfile = async (formData: Partial<InsertUser>) => {
    try {
      console.log('Profil güncelleme isteği gönderiliyor:', formData);
      
      // Parola alanını temizle
      const { password, ...updatedData } = formData;
      
      // Null değerleri boş stringe çevir
      const sanitizedData = Object.fromEntries(
        Object.entries(updatedData).map(([key, value]) => [key, value === null ? "" : value])
      );
      
      console.log('Hazırlanan ve gönderilecek veri:', sanitizedData);
      
      // Fetch API ile istek gönder
      const response = await fetch(`/api/user/profile?t=${Date.now()}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        body: JSON.stringify(sanitizedData),
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Profil güncellenirken bir hata oluştu');
      }
      
      const result = await response.json();
      console.log('Sunucudan dönen güncelleme yanıtı:', result);
      
      return result;
    } catch (error) {
      console.error('Profil güncelleme hatası:', error);
      throw error;
    }
  };
  
  const updateProfileMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: () => {
      // Önbelleği temizle
      queryClient.clear();
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      
      toast({
        title: "Profil güncellendi",
        description: "Bilgileriniz başarıyla güncellendi.",
      });
      
      // Sayfayı yenile
      window.location.reload();
    },
    onError: (error: Error) => {
      console.error('Profil güncelleme hatası:', error);
      toast({
        title: "Hata",
        description: error.message || "Profil güncellenirken bir hata oluştu.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertUser) => {
    updateProfileMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-8">
          <div className="flex items-center gap-6">
            <Avatar className="h-24 w-24">
              {user?.avatarUrl ? (
                <AvatarImage src={user.avatarUrl} alt={user.username} />
              ) : (
                <AvatarFallback>
                  <User className="h-12 w-12" />
                </AvatarFallback>
              )}
            </Avatar>
            
            <div>
              <h1 className="text-2xl font-bold">Profil Bilgilerim</h1>
              <p className="text-muted-foreground">
                Kişisel bilgilerinizi güncelleyebilirsiniz
              </p>
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kullanıcı Adı</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ad</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Soyad</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-posta</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefon</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Şehir</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="occupation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Meslek</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="instagram"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Instagram Kullanıcı Adı</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full"
                disabled={updateProfileMutation.isPending}
              >
                Değişiklikleri Kaydet
              </Button>
            </form>
          </Form>
        </div>
      </main>
    </div>
  );
}
