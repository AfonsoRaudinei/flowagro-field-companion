import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { NavigationHeader } from '@/components/ui/unified-header';
import { useOptimizedNavigation } from '@/hooks/useOptimizedNavigation';

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
const LazyWebhookSettings = lazy(() => import('@/pages/WebhookSettings'));
const LazyAccountSecurity = lazy(() => import('@/pages/AccountSecurity'));
const LazyQAAuditoria = lazy(() => import('@/pages/QAAuditoria'));
const LazyRecover = lazy(() => import('@/pages/Recover'));
const LazyResetPassword = lazy(() => import('@/pages/ResetPassword'));

// Heavy map components
const LazyMapTest = lazy(() => 
  import('@/pages/MapTest').then(module => {
    import('mapbox-gl');
    return { default: module.default };
  })
);
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

  // Authenticated routes with sidebar
  return (
    <SidebarProvider 
      defaultOpen={false} // Start collapsed on mobile
    >
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        
        <main className="flex-1 flex flex-col">
          {/* Global header with sidebar trigger */}
          <NavigationHeader
            title={currentTitle}
            onBack={() => window.history.back()}
            showBackButton={location.pathname !== '/dashboard'}
            rightActions={
              <SidebarTrigger className="lg:hidden" />
            }
          />
          
          {/* Main content area */}
          <div className="flex-1 overflow-auto">
            <div className="max-w-md mx-auto lg:max-w-none lg:mx-0">
              <Suspense fallback={<RouteFallback />}>
                <Routes>
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
                  {/* Backward compatibility redirect */}
                  <Route path="/technical-map-simplified" element={<LazyTechnicalMap />} />
                  <Route path="/qa/auditoria" element={<LazyQAAuditoria />} />
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