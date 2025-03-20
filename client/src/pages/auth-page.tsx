import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema, type InsertUser } from "@shared/schema";
import { Redirect } from "wouter";
import { Loader2, Check, AlertCircle } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useState } from "react";
import { z } from "zod";

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const { toast } = useToast();
  const [resetStep, setResetStep] = useState<'email' | 'success'>('email');
  
  // Fetch site settings to get the logo
  const { data: settings } = useQuery({
    queryKey: ["/api/admin/site-settings"],
    enabled: true,
  });
  
  // Form şeması şifre sıfırlama için
  const forgotPasswordSchema = z.object({
    email: z.string().email({ message: "Geçerli bir e-posta adresi girin" }),
  });
  
  const forgotPasswordForm = useForm({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });
  
  // Şifre sıfırlama mutasyonu
  const resetPasswordMutation = useMutation({
    mutationFn: async (data: { email: string }) => {
      return await apiRequest("POST", "/api/reset-password", data);
    },
    onSuccess: () => {
      setResetStep('success');
    },
    onError: (error: Error) => {
      toast({
        title: "Hata",
        description: error.message || "Şifre sıfırlama işlemi sırasında bir hata oluştu",
        variant: "destructive",
      });
    },
  });

  const loginForm = useForm({
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const registerForm = useForm({
    resolver: zodResolver(insertUserSchema),
    defaultValues: {
      username: "",
      password: "",
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      city: "",
      occupation: "",
      instagram: "",
    },
  });

  if (user) {
    return <Redirect to="/" />;
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="container mx-auto grid gap-8 lg:grid-cols-2 lg:gap-12 items-center">
        <div className="space-y-6">
          <div className="flex flex-col items-center mb-8">
            <img 
              src={settings?.logoUrl || "/assets/new_whatsapp_image.jpg"}
              alt="Logo" 
              className="h-40 w-40 rounded-full"
              onError={(e) => {
                // If the logo fails to load, fall back to the default
                const target = e.target as HTMLImageElement;
                target.src = "/assets/new_whatsapp_image.jpg";
                console.log("Logo image failed to load, falling back to default");
              }}
            />
          </div>
          <h1 className="text-4xl font-bold text-[#914199]">
            Snowsonics'e Hoş Geldiniz
          </h1>
          <p className="text-muted-foreground text-lg">
            Topluluğumuza katılın ve heyecan verici etkinliklere katılın.
          </p>
        </div>

        <Card className="w-full">
          <CardHeader>
            <CardTitle>Hesap İşlemleri</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="login">Giriş</TabsTrigger>
                <TabsTrigger value="register">Kayıt</TabsTrigger>
                <TabsTrigger value="forgot-password">Şifremi Unuttum</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit((data) => loginMutation.mutate(data))} className="space-y-4">
                    <FormField
                      control={loginForm.control}
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
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Şifre</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex items-center justify-end">
                      <Button 
                        variant="link" 
                        className="p-0 h-auto text-sm text-primary hover:text-primary/80"
                        type="button"
                        onClick={() => {
                          // Tabs'teki değeri değiştirerek 'forgot-password' tabına geçiyoruz
                          document.querySelector('[data-value="forgot-password"]')?.click();
                        }}
                      >
                        Şifremi Unuttum
                      </Button>
                    </div>
                    <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
                      {loginMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Giriş Yap
                    </Button>
                  </form>
                </Form>
              </TabsContent>

              <TabsContent value="register">
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit((data) => registerMutation.mutate(data))} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={registerForm.control}
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
                        control={registerForm.control}
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
                      control={registerForm.control}
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
                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Şifre</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>E-posta</FormLabel>
                          <FormControl>
                            <Input type="email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
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
                    <FormField
                      control={registerForm.control}
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
                      control={registerForm.control}
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
                    <FormField
                      control={registerForm.control}
                      name="instagram"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Instagram (Opsiyonel)</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full" disabled={registerMutation.isPending}>
                      {registerMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Kayıt Ol
                    </Button>
                  </form>
                </Form>
              </TabsContent>
              
              <TabsContent value="forgot-password">
                {resetStep === 'email' ? (
                  <Form {...forgotPasswordForm}>
                    <form 
                      onSubmit={forgotPasswordForm.handleSubmit((data) => resetPasswordMutation.mutate(data))} 
                      className="space-y-4"
                    >
                      <div className="mb-4 text-center">
                        <h3 className="text-lg font-medium">Şifrenizi mi unuttunuz?</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          Hesabınızla ilişkili e-posta adresinizi girin. Size şifre sıfırlama talimatlarını göndereceğiz.
                        </p>
                      </div>
                      
                      <FormField
                        control={forgotPasswordForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>E-posta</FormLabel>
                            <FormControl>
                              <Input type="email" {...field} placeholder="ornek@email.com" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button 
                        type="submit" 
                        className="w-full" 
                        disabled={resetPasswordMutation.isPending}
                      >
                        {resetPasswordMutation.isPending && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Şifre Sıfırlama Bağlantısı Gönder
                      </Button>
                      
                      <div className="text-center mt-4">
                        <Button
                          variant="link"
                          type="button"
                          onClick={() => {
                            document.querySelector('[data-value="login"]')?.dispatchEvent(
                              new MouseEvent('click', { bubbles: true })
                            );
                          }}
                        >
                          Giriş sayfasına dön
                        </Button>
                      </div>
                    </form>
                  </Form>
                ) : (
                  <div className="py-8 text-center space-y-4">
                    <div className="mx-auto w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                      <Check className="h-6 w-6 text-green-600" />
                    </div>
                    <h3 className="text-xl font-medium">Kontrol Edin</h3>
                    <p className="text-muted-foreground">
                      Şifre sıfırlama talimatlarını içeren bir e-posta gönderdik. Lütfen gelen kutunuzu kontrol edin.
                    </p>
                    <Button
                      onClick={() => {
                        setResetStep('email');
                        document.querySelector('[data-value="login"]')?.dispatchEvent(
                          new MouseEvent('click', { bubbles: true })
                        );
                      }}
                      className="mt-4"
                    >
                      Giriş sayfasına dön
                    </Button>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}