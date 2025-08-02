import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { UserProvider } from "./contexts/UserContext";
import BottomNavigation from "./components/ui/bottom-navigation";
import LoginMapa from "./pages/LoginMapa";
import LoginForm from "./pages/LoginForm";
import TechnicalMap from "./pages/TechnicalMap";
import Dashboard from "./pages/Dashboard";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Component to handle conditional bottom navigation
const AppLayout = () => {
  const location = useLocation();
  
  // Show bottom navigation only on authenticated screens
  const showBottomNav = ['/technical-map', '/dashboard', '/settings'].includes(location.pathname);
  
  return (
    <>
      <div className={`w-full max-w-md mx-auto bg-background min-h-screen ${showBottomNav ? 'pb-16' : ''}`}>
        <Routes>
          <Route path="/" element={<LoginMapa />} />
          <Route path="/login-mapa" element={<LoginMapa />} />
          <Route path="/login-form" element={<LoginForm />} />
          <Route path="/technical-map" element={<TechnicalMap />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
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
        <Sonner />
        <BrowserRouter>
          <AppLayout />
        </BrowserRouter>
      </TooltipProvider>
    </UserProvider>
  </QueryClientProvider>
);

export default App;
