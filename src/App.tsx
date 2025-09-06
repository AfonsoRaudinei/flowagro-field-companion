import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { UserProvider } from "./contexts/UserContext";
import { NavigationStack } from "./components/navigation/NavigationStack";

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

// Preload critical components
const preloadCritical = async () => {
  if (typeof window !== 'undefined') {
    // Preload Dashboard and TechnicalMapSimplified for faster navigation
    Promise.all([
      import('./pages/Dashboard'),
      import('./pages/TechnicalMapSimplified')
    ]);
  }
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
            <NavigationStack />
          </BrowserRouter>
          <Toaster />
        </TooltipProvider>
      </UserProvider>
    </QueryClientProvider>
  );
}

export default App;