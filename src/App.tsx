import React, { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { UserProvider } from "./contexts/UserContext";
import NotFound from "./pages/NotFound";
import { Skeleton } from "@/components/ui/skeleton";
import Dashboard from "./pages/Dashboard";

const queryClient = new QueryClient();

// Lazy-loaded pages for better TTI
const TelaInicial = lazy(() => import("./pages/TelaInicial"));
const LoginForm = lazy(() => import("./pages/LoginForm"));
const Settings = lazy(() => import("./pages/Settings"));
const Calculator = lazy(() => import("./pages/Calculator"));
const PhenologicalStages = lazy(() => import("./pages/PhenologicalStages"));
const ConsultoriaComunicacao = lazy(() => import("./pages/ConsultoriaComunicacao"));
const MapTest = lazy(() => import("./pages/MapTest"));
const TechnicalMap = lazy(() => import("./pages/TechnicalMap"));
const WebhookSettings = lazy(() => import("./pages/WebhookSettings"));
const QAAuditoria = lazy(() => import("./pages/QAAuditoria"));

const Recover = lazy(() => import("./pages/Recover"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Profile = lazy(() => import("./pages/Profile"));
const AccountSecurity = lazy(() => import("./pages/AccountSecurity"));

const RouteFallback = () => (
  <div className="p-4 space-y-3">
    <Skeleton className="h-6 w-24" />
    <Skeleton className="h-10 w-full" />
    <Skeleton className="h-48 w-full" />
  </div>
);

// Application layout component  
const AppLayout = () => {
  return (
    <div className="w-full max-w-md mx-auto bg-background min-h-screen">
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<TelaInicial />} />
          <Route path="/login-form" element={<LoginForm />} />
          <Route path="/recover" element={<Recover />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/calculator" element={<Calculator />} />
          <Route path="/settings/security" element={<AccountSecurity />} />
          <Route path="/settings/webhooks" element={<WebhookSettings />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/phenological-stages" element={<PhenologicalStages />} />
          <Route path="/consultoria/comunicacao" element={<ConsultoriaComunicacao />} />
          <Route path="/map-test" element={<MapTest />} />
          <Route path="/technical-map" element={<TechnicalMap />} />
          <Route path="/qa/auditoria" element={<QAAuditoria />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <UserProvider>
      <TooltipProvider>
        <Toaster />
        
        <BrowserRouter>
          <AppLayout />
        </BrowserRouter>
      </TooltipProvider>
    </UserProvider>
  </QueryClientProvider>
);

export default App;
