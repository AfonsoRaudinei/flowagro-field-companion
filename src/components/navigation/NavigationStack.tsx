import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { NavigationHeader } from '@/components/ui/unified-header';
import { useOptimizedNavigation } from '@/hooks/useOptimizedNavigation';
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
  const { getRouteTitle } = useOptimizedNavigation();
  
  // Routes that don't need navigation
  const publicRoutes = [
    '/',
    '/login-form',
    '/recover',
    '/reset-password'
  ];

  // Routes with custom headers (no default header)
  const customHeaderRoutes = ['/technical-map'];
  
  const isPublicRoute = publicRoutes.includes(location.pathname);
  const isCustomHeaderRoute = customHeaderRoutes.includes(location.pathname);
  const currentTitle = getRouteTitle(location.pathname);
  
  if (isPublicRoute) {
    // Public routes without navigation
    return (
      <div className="w-full min-h-screen bg-background">
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

  // Routes with custom headers - no default navigation
  if (isCustomHeaderRoute) {
    return (
      <div className="w-full min-h-screen bg-background">
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/technical-map" element={<LazyTechnicalMap />} />
          </Routes>
        </Suspense>
      </div>
    );
  }

  // Unified layout for all authenticated routes
  return (
    <div className="min-h-screen w-full bg-background">
      {/* Header for all screens */}
      <NavigationHeader
        title={currentTitle}
        onBack={() => window.history.back()}
        showBackButton={location.pathname !== '/dashboard'}
        rightActions={<HeaderSettings />}
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
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </div>
      </div>
    </div>
  );
};