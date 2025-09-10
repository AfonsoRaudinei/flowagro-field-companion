import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUser } from '@/contexts/UserContext';

// Centralized mock data - fallback when no real data exists
const MOCK_EMPLOYEES = [
  { 
    id: 'emp1', 
    name: 'Carlos Silva', 
    role: 'Operador de Campo', 
    email: 'carlos.silva@flowagro.com',
    phone: '+55 11 99999-1111',
    isOnline: true,
    avatar_url: null,
    last_seen: new Date().toISOString()
  },
  { 
    id: 'emp2', 
    name: 'Ana Souza', 
    role: 'Técnico Agrícola', 
    email: 'ana.souza@flowagro.com',
    phone: '+55 11 99999-2222',
    isOnline: false,
    avatar_url: null,
    last_seen: new Date(Date.now() - 30 * 60 * 1000).toISOString() // 30 min ago
  },
  { 
    id: 'emp3', 
    name: 'João Santos', 
    role: 'Supervisor de Qualidade', 
    email: 'joao.santos@flowagro.com',
    phone: '+55 11 99999-3333',
    isOnline: true,
    avatar_url: null,
    last_seen: new Date().toISOString()
  },
  { 
    id: 'emp4', 
    name: 'Maria Lima', 
    role: 'Analista de Solo', 
    email: 'maria.lima@flowagro.com',
    phone: '+55 11 99999-4444',
    isOnline: false,
    avatar_url: null,
    last_seen: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() // 2 hours ago
  },
  { 
    id: 'emp5', 
    name: 'Pedro Costa', 
    role: 'Especialista em Irrigação', 
    email: 'pedro.costa@flowagro.com',
    phone: '+55 11 99999-5555',
    isOnline: true,
    avatar_url: null,
    last_seen: new Date().toISOString()
  }
];

const MOCK_PRODUCERS = [
  { 
    id: 'prod1', 
    name: 'José da Silva', 
    farm_name: 'Fazenda Santa Maria', 
    location: 'Ribeirão Preto, SP',
    email: 'jose.silva@fazenda-santa-maria.com.br',
    phone: '+55 16 99999-1111',
    avatar_url: null,
    is_online: true,
    last_seen: new Date().toISOString()
  },
  { 
    id: 'prod2', 
    name: 'Maria Santos', 
    farm_name: 'Sítio Boa Esperança', 
    location: 'Uberaba, MG',
    email: 'maria.santos@sitio-boa-esperanca.com.br',
    phone: '+55 34 99999-2222',
    avatar_url: null,
    is_online: false,
    last_seen: new Date(Date.now() - 45 * 60 * 1000).toISOString() // 45 min ago
  },
  { 
    id: 'prod3', 
    name: 'Carlos Oliveira', 
    farm_name: 'Fazenda Progresso', 
    location: 'Goiânia, GO',
    email: 'carlos.oliveira@fazenda-progresso.com.br',
    phone: '+55 62 99999-3333',
    avatar_url: null,
    is_online: true,
    last_seen: new Date().toISOString()
  },
  { 
    id: 'prod4', 
    name: 'Ana Costa', 
    farm_name: 'Rancho Verde Sustentável', 
    location: 'Campo Grande, MS',
    email: 'ana.costa@rancho-verde.com.br',
    phone: '+55 67 99999-4444',
    avatar_url: null,
    is_online: true,
    last_seen: new Date().toISOString()
  },
  { 
    id: 'prod5', 
    name: 'Roberto Mendes', 
    farm_name: 'Estância do Cerrado', 
    location: 'Brasília, DF',
    email: 'roberto.mendes@estancia-cerrado.com.br',
    phone: '+55 61 99999-5555',
    avatar_url: null,
    is_online: false,
    last_seen: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString() // 3 hours ago
  }
];

// Types for better TypeScript support
export interface Employee {
  id: string;
  name: string;
  role: string;
  email?: string;
  phone?: string;
  avatar_url?: string | null;
  isOnline: boolean;
  last_seen?: string;
}

export interface Producer {
  id: string;
  name: string;
  farm_name: string;
  location?: string;
  email?: string;
  phone?: string;
  avatar_url?: string | null;
  is_online: boolean;
  last_seen?: string;
}

/**
 * Centralized hook for managing sidebar data
 * Handles both real Supabase data and mock fallbacks
 * Provides consistent interface for consultants and producers
 */
export function useSidebarData() {
  const { isConsultor, isProdutor, linkedProducers } = useUser();
  const [producers, setProducers] = useState<Producer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch producers from Supabase
  const fetchProducers = async () => {
    try {
      const { data, error: supabaseError } = await supabase
        .from('producers')
        .select('*')
        .order('name');
      
      if (supabaseError) {
        console.warn('Failed to fetch producers:', supabaseError);
        return [];
      }
      
      return data?.map(producer => ({
        id: producer.id,
        name: producer.name,
        farm_name: producer.farm_name,
        location: producer.location,
        email: producer.email,
        phone: producer.phone,
        avatar_url: producer.avatar_url,
        is_online: producer.is_online || false,
        last_seen: producer.last_seen
      })) || [];
    } catch (err) {
      console.warn('Error fetching producers:', err);
      return [];
    }
  };

  // Load data on mount and when user role changes
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        if (isConsultor) {
          // For consultants, load producers
          const supabaseProducers = await fetchProducers();
          setProducers(supabaseProducers.length > 0 ? supabaseProducers : MOCK_PRODUCERS);
        }
        // For producers, we'll use mock employees data directly
      } catch (err) {
        console.error('Error loading sidebar data:', err);
        setError('Falha ao carregar dados');
        // Use mock data as fallback
        if (isConsultor) {
          setProducers(MOCK_PRODUCERS);
        }
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isConsultor, isProdutor]);

  // Memoized computed values
  const displayData = useMemo(() => {
    if (isConsultor) {
      // For consultants: show producers (real data + linkedProducers fallback + mock fallback)
      let displayProducers = producers;
      
      // If no real producers and we have linkedProducers from UserContext
      if (displayProducers.length === 0 && linkedProducers.length > 0) {
        displayProducers = linkedProducers.map(producer => ({
          id: producer.id,
          name: producer.name,
          farm_name: producer.farm || 'Fazenda',
          location: producer.location || '',
          email: undefined,
          phone: undefined,
          avatar_url: null,
          is_online: false,
          last_seen: undefined
        }));
      }
      
      // Final fallback to mock data
      if (displayProducers.length === 0) {
        displayProducers = MOCK_PRODUCERS;
      }

      return {
        items: displayProducers,
        type: 'producers' as const,
        title: 'Meus Clientes',
        subtitle: `${displayProducers.length} produtores vinculados`,
        emptyMessage: 'Nenhum produtor encontrado'
      };
    } else {
      // For producers: show team members (using mock data)
      const displayTeamMembers = MOCK_EMPLOYEES;
      
      return {
        items: displayTeamMembers,
        type: 'employees' as const,
        title: 'Minha Equipe',
        subtitle: `${displayTeamMembers.length} funcionários ativos`,
        emptyMessage: 'Nenhum funcionário encontrado'
      };
    }
  }, [isConsultor, producers, linkedProducers]);

  // Function to refresh data
  const refresh = async () => {
    setLoading(true);
    try {
      if (isConsultor) {
        const supabaseProducers = await fetchProducers();
        setProducers(supabaseProducers.length > 0 ? supabaseProducers : MOCK_PRODUCERS);
      }
      // For producers, no need to refresh since we're using mock data
    } catch (err) {
      console.error('Error refreshing data:', err);
      setError('Falha ao atualizar dados');
    } finally {
      setLoading(false);
    }
  };

  return {
    displayData,
    loading,
    error,
    refresh,
    // Statistics
    stats: {
      totalItems: displayData.items.length,
      onlineCount: displayData.items.filter(item => 
        displayData.type === 'producers' 
          ? (item as Producer).is_online 
          : (item as Employee).isOnline
      ).length
    }
  };
}