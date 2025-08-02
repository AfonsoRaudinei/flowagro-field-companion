import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { UserProvider } from "./contexts/UserContext";
import SwipeNavigation from "./components/SwipeNavigation";
import LoginMapa from "./pages/LoginMapa";
import LoginForm from "./pages/LoginForm";
import NotFound from "./pages/NotFound";
import PhenologicalStages from "./pages/PhenologicalStages";

const queryClient = new QueryClient();

// Component to handle conditional navigation
const AppLayout = () => {
  const location = useLocation();
  
  // Show swipe navigation only on authenticated screens
  const showSwipeNav = ['/technical-map', '/dashboard', '/settings'].includes(location.pathname);
  
  return (
    <>
      {showSwipeNav ? (
        <SwipeNavigation />
      ) : (
        <div className="w-full max-w-md mx-auto bg-background min-h-screen">
          <Routes>
            <Route path="/" element={<LoginMapa />} />
            <Route path="/login-mapa" element={<LoginMapa />} />
            <Route path="/login-form" element={<LoginForm />} />
            <Route path="/phenological-stages" element={<PhenologicalStages />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      )}
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
