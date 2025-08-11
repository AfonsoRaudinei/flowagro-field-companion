import React, { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { UserProvider } from "./contexts/UserContext";
import BottomNavigation from "./components/ui/bottom-navigation";
import NotFound from "./pages/NotFound";
import { Skeleton } from "@/components/ui/skeleton";

const queryClient = new QueryClient();

// Lazy-loaded pages for better TTI
const LoginForm = lazy(() => import("./pages/LoginForm"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Settings = lazy(() => import("./pages/Settings"));
const PhenologicalStages = lazy(() => import("./pages/PhenologicalStages"));

const RouteFallback = () => (
  <div className="p-4 space-y-3">
    <Skeleton className="h-6 w-24" />
    <Skeleton className="h-10 w-full" />
    <Skeleton className="h-48 w-full" />
  </div>
);

// Component to handle conditional bottom navigation
const AppLayout = () => {
  const location = useLocation();
  
  // Show bottom navigation only on authenticated screens
  const showBottomNav = ['/dashboard', '/settings'].includes(location.pathname);
  
  return (
    <>
      <div className={`w-full max-w-md mx-auto bg-background min-h-screen ${showBottomNav ? 'pb-16' : ''}`}>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/login-form" element={<LoginForm />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/phenological-stages" element={<PhenologicalStages />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </div>
      {showBottomNav && <BottomNavigation />}
    </>
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
