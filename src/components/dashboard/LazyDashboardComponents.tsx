/**
 * Lazy Loading Dashboard Components - Fase 2 Otimização
 * Componentes pesados carregados sob demanda
 */

import React, { lazy, Suspense, memo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

// Lazy loading dos componentes pesados do Dashboard
const LazyConversationView = lazy(() => 
  import('./ConversationView').then(module => ({
    default: module.ConversationView
  }))
);

const LazyTechnicalChatView = lazy(() => 
  import('./TechnicalChatView').then(module => ({
    default: module.TechnicalChatView
  }))
);

const LazyVirtualizedChatList = lazy(() => 
  import('./VirtualizedChatList')
);

const LazyHorizontalCardCarousel = lazy(() => 
  import('./HorizontalCardCarousel').then(module => ({
    default: module.HorizontalCardCarousel
  }))
);

// Fallback components otimizados
const ConversationFallback = memo(() => (
  <div className="flex flex-col h-full">
    <div className="p-4 border-b">
      <div className="flex items-center space-x-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
    </div>
    <div className="flex-1 p-4 space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
          <Skeleton className={`h-12 ${i % 2 === 0 ? 'w-48' : 'w-36'} rounded-lg`} />
        </div>
      ))}
    </div>
  </div>
));

const ChatListFallback = memo(() => (
  <div className="space-y-3 p-4">
    {Array.from({ length: 8 }).map((_, i) => (
      <div key={i} className="flex items-center space-x-3">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-full max-w-48" />
          <Skeleton className="h-3 w-full max-w-32" />
        </div>
      </div>
    ))}
  </div>
));

const CarouselFallback = memo(() => (
  <div className="flex space-x-4 p-4">
    {Array.from({ length: 4 }).map((_, i) => (
      <Skeleton key={i} className="h-24 w-24 rounded-lg flex-shrink-0" />
    ))}
  </div>
));

// Componentes otimizados com lazy loading
export const OptimizedConversationView = memo((props: any) => (
  <Suspense fallback={<ConversationFallback />}>
    <LazyConversationView {...props} />
  </Suspense>
));

export const OptimizedTechnicalChatView = memo((props: any) => (
  <Suspense fallback={<ConversationFallback />}>
    <LazyTechnicalChatView {...props} />
  </Suspense>
));

export const OptimizedVirtualizedChatList = memo((props: any) => (
  <Suspense fallback={<ChatListFallback />}>
    <LazyVirtualizedChatList {...props} />
  </Suspense>
));

export const OptimizedHorizontalCardCarousel = memo((props: any) => (
  <Suspense fallback={<CarouselFallback />}>
    <LazyHorizontalCardCarousel {...props} />
  </Suspense>
));

// Performance monitoring wrapper
export const withPerformanceMonitoring = <P extends object>(
  Component: React.ComponentType<P>,
  componentName: string
) => {
  return memo((props: P) => {
    React.useEffect(() => {
      const startTime = performance.now();
      
      return () => {
        const endTime = performance.now();
        if (process.env.NODE_ENV === 'development') {
          console.log(`[Performance] ${componentName} render time: ${endTime - startTime}ms`);
        }
      };
    });

    return <Component {...props} />;
  });
};