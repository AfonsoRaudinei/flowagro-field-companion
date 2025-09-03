import React, { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { UserProvider } from "./contexts/UserContext";
import NotFound from "./pages/NotFound";
import { Skeleton } from "@/components/ui/skeleton";

// Optimized query client configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (renamed from cacheTime)
      retry: 1, // Reduce retries for faster fails
      refetchOnWindowFocus: false, // Disable refetch on focus for better performance
    },
  },
});

// Critical pages - loaded immediately
import Dashboard from "./pages/Dashboard";
import TelaInicial from "./pages/TelaInicial"; // High priority - entry point

// High priority pages - preloaded
const LoginForm = lazy(() => 
  import("./pages/LoginForm").then(module => ({ default: module.default }))
);

// Medium priority pages - standard lazy loading
const Settings = lazy(() => import("./pages/Settings"));
const Calculator = lazy(() => import("./pages/Calculator"));
const Profile = lazy(() => import("./pages/Profile"));

// Low priority pages - aggressive lazy loading
const PhenologicalStages = lazy(() => import("./pages/PhenologicalStages"));
const ConsultoriaComunicacao = lazy(() => import("./pages/ConsultoriaComunicacao"));
const WebhookSettings = lazy(() => import("./pages/WebhookSettings"));
const AccountSecurity = lazy(() => import("./pages/AccountSecurity"));
const QAAuditoria = lazy(() => import("./pages/QAAuditoria"));
const Recover = lazy(() => import("./pages/Recover"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));

// Map pages - very aggressive lazy loading (heaviest components)
const MapTest = lazy(() => 
  import("./pages/MapTest").then(module => {
    // Preload critical map dependencies
    import("mapbox-gl");
    return { default: module.default };
  })
);
const TechnicalMap = lazy(() => 
  import("./pages/TechnicalMap").then(module => {
    // Preload critical map dependencies
    import("mapbox-gl");
    return { default: module.default };
  })
);

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
