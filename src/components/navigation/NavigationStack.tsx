import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { NavigationHeader } from '@/components/ui/unified-header';
import { useOptimizedNavigation } from '@/hooks/useOptimizedNavigation';
import { useIsMobile } from '@/hooks/use-mobile';
import IOSNavigation from '@/components/ui/ios-navigation';
import { HeaderSettings } from './HeaderSettings';

// Import critical pages
import Dashboard from '@/pages/Dashboard';
import TelaInicial from '@/pages/TelaInicial';
import NotFound from '@/pages/NotFound';

// Lazy-loaded pages
import { Suspense, lazy } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

const LazyLoginForm = lazy(() => import('@/pages/LoginForm'));
const LazySettings = lazy(() => import('@/pages/Settings'));
const LazyCalculator = lazy(() => import('@/pages/Calculator'));
const LazyProfile = lazy(() => import('@/pages/Profile'));
const LazyPhenologicalStages = lazy(() => import('@/pages/PhenologicalStages'));
const LazyConsultoriaComunicacao = lazy(() => import('@/pages/ConsultoriaComunicacao'));
const LazyAccountSecurity = lazy(() => import('@/pages/AccountSecurity'));
const LazyRecover = lazy(() => import('@/pages/Recover'));
const LazyResetPassword = lazy(() => import('@/pages/ResetPassword'));

// Heavy map components
const LazyTechnicalMap = lazy(() => 
  import('@/pages/TechnicalMap').then(module => {
    import('mapbox-gl');
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

interface NavigationStackProps {
  children?: React.ReactNode;
}

export const NavigationStack: React.FC<NavigationStackProps> = () => {
  const location = useLocation();
  const { getRouteTitle, navigate } = useOptimizedNavigation();
  const isMobile = useIsMobile();
  
  // Routes that don't need sidebar
  const publicRoutes = [
    '/',
    '/login-form',
    '/recover',
    '/reset-password'
  ];
  
  const isPublicRoute = publicRoutes.includes(location.pathname);
  const currentTitle = getRouteTitle(location.pathname);
  
  if (isPublicRoute) {
    // Public routes without sidebar
    return (
      <div className="w-full max-w-md mx-auto bg-background min-h-screen">
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<TelaInicial />} />
            <Route path="/login-form" element={<LazyLoginForm />} />
            <Route path="/recover" element={<LazyRecover />} />
            <Route path="/reset-password" element={<LazyResetPassword />} />
          </Routes>
        </Suspense>
      </div>
    );
  }

  // Mobile layout
  if (isMobile) {
    return (
      <div className="min-h-screen w-full bg-background">
        {/* Mobile header */}
        <NavigationHeader
          title={currentTitle}
          onBack={() => window.history.back()}
          showBackButton={location.pathname !== '/dashboard'}
          rightActions={<HeaderSettings />}
        />
        
        {/* Main content area with bottom padding for navigation */}
        <div className="flex-1 overflow-auto pb-20">
          <div className="max-w-md mx-auto">
            <Suspense fallback={<RouteFallback />}>
              <Routes>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/settings" element={<LazySettings />} />
                <Route path="/calculator" element={<LazyCalculator />} />
                <Route path="/settings/security" element={<LazyAccountSecurity />} />
                <Route path="/profile" element={<LazyProfile />} />
                <Route path="/phenological-stages" element={<LazyPhenologicalStages />} />
                <Route path="/consultoria/comunicacao" element={<LazyConsultoriaComunicacao />} />
                <Route path="/technical-map" element={<LazyTechnicalMap />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </div>
        </div>
        
        {/* Mobile bottom navigation */}
        <IOSNavigation />
      </div>
    );
  }

  // Desktop layout with sidebar
  return (
    <SidebarProvider 
      defaultOpen={true} // Open by default on desktop
    >
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        
        <main className="flex-1 flex flex-col">
          {/* Desktop header with settings */}
          <NavigationHeader
            title={currentTitle}
            onBack={() => window.history.back()}
            showBackButton={location.pathname !== '/dashboard'}
            rightActions={
              <div className="flex items-center gap-2">
                <SidebarTrigger />
                <HeaderSettings />
              </div>
            }
          />
          
          {/* Main content area */}
          <div className="flex-1 overflow-auto">
            <div className="w-full px-4 py-4">
              <Suspense fallback={<RouteFallback />}>
                <Routes>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/settings" element={<LazySettings />} />
                  <Route path="/calculator" element={<LazyCalculator />} />
                  <Route path="/settings/security" element={<LazyAccountSecurity />} />
                  <Route path="/profile" element={<LazyProfile />} />
                  <Route path="/phenological-stages" element={<LazyPhenologicalStages />} />
                  <Route path="/consultoria/comunicacao" element={<LazyConsultoriaComunicacao />} />
                  <Route path="/technical-map" element={<LazyTechnicalMap />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};