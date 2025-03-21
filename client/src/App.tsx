import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/use-auth";
import { LanguageProvider } from "@/hooks/use-language";
import { TooltipProvider } from "@/hooks/use-tooltips";
import { ProtectedRoute } from "@/lib/protected-route";
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import NotFound from "@/pages/not-found";
import AdminUsersPage from "@/pages/admin/users";
import AdminEventsPage from "@/pages/admin/events";
import EventDetailPage from "@/pages/events/[id]";
import ParticipationsPage from "@/pages/participations";
import AdminSiteSettingsPage from "@/pages/admin/site-settings";
import ProfilePage from "@/pages/profile";
import GridDemo from "@/pages/grid-demo";

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={HomePage} />
      <ProtectedRoute path="/events/:id" component={EventDetailPage} />
      <ProtectedRoute path="/participations" component={ParticipationsPage} />
      <ProtectedRoute path="/profile" component={ProfilePage} />
      <ProtectedRoute path="/admin/users" component={AdminUsersPage} requireAdmin />
      <ProtectedRoute path="/admin/events" component={AdminEventsPage} requireAdmin />
      <ProtectedRoute path="/admin/site-settings" component={AdminSiteSettingsPage} requireAdmin />
      <Route path="/auth" component={AuthPage} />
      <Route path="/grid-demo" component={GridDemo} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <AuthProvider>
          <TooltipProvider>
            <Router />
            <Toaster />
          </TooltipProvider>
        </AuthProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;