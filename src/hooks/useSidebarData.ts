import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useUser } from '@/contexts/UserContext';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { performanceMonitor } from '@/lib/unifiedPerformance';

export interface Producer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  farm_name?: string;
  farm_location?: string;
  location?: string; // Add this for backward compatibility
  created_at?: string;
  updated_at?: string;
  is_online?: boolean;
  last_seen?: string;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  department?: string;
  created_at?: string;
  updated_at?: string;
  is_online?: boolean;
  last_seen?: string;
}

// Alias for backward compatibility
export type Employee = TeamMember;

type SidebarItem = (Producer & { type: 'producer' }) | (TeamMember & { type: 'team_member' });

interface SidebarData {
  items: SidebarItem[];
  isLoading: boolean;
  error: string | null;
  onlineCount: number;
  refresh: () => Promise<void>;
}

// Cache configuration for performance optimization
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const cache = {
  data: null as SidebarItem[] | null,
  timestamp: 0,
  isValid: () => cache.data && (Date.now() - cache.timestamp) < CACHE_DURATION
};

// Mock data for fallback
const getMockData = (userContext: any): SidebarItem[] => {
  const isConsultant = userContext?.isConsultor || false;
  
  if (isConsultant) {
    // Mock producers for consultants
    return [
      {
        id: 'mock-prod-1',
        name: 'José da Silva',
        email: 'jose@fazenda.com',
        farm_name: 'Fazenda Santa Maria',
        farm_location: 'Ribeirão Preto, SP',
        is_online: true,
        last_seen: new Date().toISOString(),
        type: 'producer' as const
      },
      {
        id: 'mock-prod-2', 
        name: 'Maria Santos',
        email: 'maria@sitio.com',
        farm_name: 'Sítio Boa Esperança',
        farm_location: 'Uberaba, MG',
        is_online: false,
        last_seen: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        type: 'producer' as const
      }
    ];
  } else {
    // Mock team members for producers
    return [
      {
        id: 'mock-team-1',
        name: 'Carlos Silva',
        email: 'carlos@equipe.com',
        role: 'Operador de Campo',
        department: 'Operações',
        is_online: true,
        last_seen: new Date().toISOString(),
        type: 'team_member' as const
      },
      {
        id: 'mock-team-2',
        name: 'Ana Costa',
        email: 'ana@equipe.com',
        role: 'Técnico Agrícola',
        department: 'Técnico',
        is_online: false,
        last_seen: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
        type: 'team_member' as const
      }
    ];
  }
};

export function useSidebarData(): SidebarData {
  const userContext = useUser();
  const [items, setItems] = useState<SidebarItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const refreshTimeoutRef = useRef<NodeJS.Timeout>();

  const fetchData = useCallback(async (useCache = true) => {
    // Guard clause for undefined userContext
    if (!userContext) {
      setIsLoading(false);
      return;
    }

    // Check cache first for performance
    if (useCache && cache.isValid()) {
      setItems(cache.data!);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await performanceMonitor.measure('sidebar-data-fetch', async () => {
        const isConsultant = userContext.isConsultor || false;
        
        if (isConsultant) {
          // Consultants see their assigned producers - using existing producers table
          const { data: producers, error: producersError } = await supabase
            .from('producers')
            .select('*')
            .order('is_online', { ascending: false })
            .order('last_seen', { ascending: false });

          if (producersError) {
            logger.error('Error fetching producers:', producersError);
            throw producersError;
          }

          return (producers || []).map(producer => ({
            id: producer.id,
            name: producer.name || 'Produtor',
            email: producer.email || '',
            phone: producer.phone,
            farm_name: producer.farm_name,
            farm_location: producer.location,
            created_at: producer.created_at,
            updated_at: producer.updated_at,
            is_online: producer.is_online || false,
            last_seen: producer.last_seen,
            type: 'producer' as const
          }));
        } else {
          // For now, return mock team members since team_members table may not exist
          return getMockData(userContext).filter(item => item.type === 'team_member');
        }
      });

      // Update cache for performance
      cache.data = result;
      cache.timestamp = Date.now();
      
      setItems(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      logger.error('Error in useSidebarData:', err);
      
      // Fallback to mock data on error
      const fallbackData = getMockData(userContext);
      setItems(fallbackData);
      
      // Cache fallback data temporarily (shorter duration)
      cache.data = fallbackData;
      cache.timestamp = Date.now() - (CACHE_DURATION / 2);
    } finally {
      setIsLoading(false);
    }
  }, [userContext?.isConsultor, userContext?.isProdutor]);

  // Optimized refresh with debouncing to prevent spam
  const refresh = useCallback(async () => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }
    
    refreshTimeoutRef.current = setTimeout(() => {
      fetchData(false); // Force refresh, skip cache
    }, 300); // Debounce rapid refresh calls
  }, [fetchData]);

  // Initial load with cache
  useEffect(() => {
    fetchData(true);
  }, [fetchData]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, []);

  // Memoized online count calculation for performance
  const onlineCount = useMemo(() => {
    return items.filter(item => item.is_online).length;
  }, [items]);

  return {
    items,
    isLoading,
    error,
    onlineCount,
    refresh
  };
}