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

// Route-based code splitting with strategic loading
const LazyLoginForm = lazy(() => import('./pages/LoginForm'));
const LazySettings = lazy(() => import('./pages/Settings'));
const LazyCalculator = lazy(() => import('./pages/Calculator'));
const LazyProfile = lazy(() => import("./pages/Profile"));

// Low priority pages - aggressive lazy loading
const LazyPhenologicalStages = lazy(() => import("./pages/PhenologicalStages"));
const LazyConsultoriaComunicacao = lazy(() => import("./pages/ConsultoriaComunicacao"));
const LazyWebhookSettings = lazy(() => import("./pages/WebhookSettings"));
const LazyAccountSecurity = lazy(() => import("./pages/AccountSecurity"));
const LazyQAAuditoria = lazy(() => import("./pages/QAAuditoria"));
const LazyRecover = lazy(() => import("./pages/Recover"));
const LazyResetPassword = lazy(() => import("./pages/ResetPassword"));

// Map pages - very aggressive lazy loading (heaviest components)
const LazyMapTest = lazy(() => 
  import("./pages/MapTest").then(module => {
    // Preload critical map dependencies
    import("mapbox-gl");
    return { default: module.default };
  })
);
const LazyTechnicalMap = lazy(() => 
  import("./pages/TechnicalMapSimplified").then(module => {
    // Preload critical map dependencies
    import("mapbox-gl");
    return { default: module.default };
  })
);

// Preload critical components
const preloadCritical = async () => {
  if (typeof window !== 'undefined') {
    // Preload Dashboard and TechnicalMap for faster navigation
    Promise.all([
      import('./pages/Dashboard'),
      import('./pages/TechnicalMap')
    ]);
  }
};

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
          <Route path="/login-form" element={<LazyLoginForm />} />
          <Route path="/recover" element={<LazyRecover />} />
          <Route path="/reset-password" element={<LazyResetPassword />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/settings" element={<LazySettings />} />
          <Route path="/calculator" element={<LazyCalculator />} />
          <Route path="/settings/security" element={<LazyAccountSecurity />} />
          <Route path="/settings/webhooks" element={<LazyWebhookSettings />} />
          <Route path="/profile" element={<LazyProfile />} />
          <Route path="/phenological-stages" element={<LazyPhenologicalStages />} />
          <Route path="/consultoria/comunicacao" element={<LazyConsultoriaComunicacao />} />
          <Route path="/map-test" element={<LazyMapTest />} />
          <Route path="/technical-map" element={<LazyTechnicalMap />} />
          <Route path="/qa/auditoria" element={<LazyQAAuditoria />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </div>
  );
};

function App() {
  // Initialize critical preloading
  React.useEffect(() => {
    preloadCritical();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <UserProvider>
        <TooltipProvider>
          <BrowserRouter>
            <AppLayout />
          </BrowserRouter>
          <Toaster />
        </TooltipProvider>
      </UserProvider>
    </QueryClientProvider>
  );
}

export default App;