import React from 'react';
import { Users, Building2, MapPin, UserCheck } from 'lucide-react';
import { useUser } from '@/contexts/UserContext';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// Mock data for employees and producers
const mockEmployees = [
  { id: 'emp1', name: 'Carlos Silva', role: 'Operador de Campo', isOnline: true },
  { id: 'emp2', name: 'Ana Souza', role: 'Técnico Agrícola', isOnline: false },
  { id: 'emp3', name: 'João Santos', role: 'Supervisor', isOnline: true },
  { id: 'emp4', name: 'Maria Lima', role: 'Analista de Solo', isOnline: false }
];

// Mock data for producers (when user is consultant)
const mockProducers = [
  { id: 'prod1', name: 'José da Silva', farm: 'Fazenda Santa Maria', location: 'Ribeirão Preto, SP' },
  { id: 'prod2', name: 'Maria Santos', farm: 'Sítio Boa Esperança', location: 'Uberaba, MG' },
  { id: 'prod3', name: 'Carlos Oliveira', farm: 'Fazenda Progresso', location: 'Goiânia, GO' },
  { id: 'prod4', name: 'Ana Costa', farm: 'Rancho Verde', location: 'Campo Grande, MS' }
];

interface FlowAgroSidebarProps {
  onItemSelect?: (item: any) => void;
  isOpen?: boolean;
}

export function FlowAgroSidebar({ onItemSelect, isOpen = false }: FlowAgroSidebarProps) {
  const { isConsultor, isProdutor, linkedProducers } = useUser();
  
  // Use mock data if no real data is available
  const displayProducers = linkedProducers.length > 0 ? linkedProducers : mockProducers;
  const producerCount = displayProducers.length;

  const handleItemClick = (item: any) => {
    onItemSelect?.(item);
  };

  return (
    <div 
      className={cn(
        "fixed left-0 top-0 h-screen w-80 z-[9998]",
        "bg-[#2D2D30] shadow-2xl border-r border-white/10",
        "transform transition-all duration-300 ease-out",
        "sm:w-80 w-[85vw] max-w-sm",
        isOpen ? "translate-x-0 animate-fade-in" : "-translate-x-full"
      )}
    >
      {/* Header Section */}
      <div className="px-6 py-6 border-b border-white/10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg">
            {isConsultor ? (
              <Users className="w-6 h-6 text-white" />
            ) : (
              <Building2 className="w-6 h-6 text-white" />
            )}
          </div>
          <div>
            <h3 className="font-semibold text-white text-lg">
              {isConsultor ? 'Meus Clientes' : 'Minha Equipe'}
            </h3>
            <p className="text-white/60 text-sm font-medium">
              {isConsultor 
                ? `${producerCount} produtores vinculados` 
                : `${mockEmployees.length} funcionários ativos`
              }
            </p>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="flex-1 overflow-y-auto py-4">
        <div className="px-4">
          <div className="text-white/70 font-medium mb-4 text-xs uppercase tracking-wider px-2">
            {isConsultor ? 'Produtores Vinculados' : 'Funcionários da Equipe'}
          </div>
          
          <div className="space-y-2">
            {isConsultor ? (
              displayProducers.map((producer, index) => (
                <button
                  key={producer.id}
                  className={cn(
                    "w-full p-4 rounded-xl border-0 transition-all duration-200",
                    "bg-white/5 hover:bg-white/10 text-white text-left group",
                    "hover:shadow-lg hover:shadow-primary/10 hover:scale-[1.01]",
                    "focus:ring-2 focus:ring-primary/50 focus:ring-offset-0 focus:outline-none",
                    "active:scale-[0.98]"
                  )}
                  onClick={() => handleItemClick(producer)}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-center gap-3 w-full">
                    <Avatar className="w-11 h-11 border-2 border-white/20 group-hover:border-primary/30 transition-colors">
                      <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-white font-semibold text-sm">
                        {producer.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-white mb-1 group-hover:text-primary/90 transition-colors truncate">
                        {producer.name}
                      </div>
                      <div className="flex items-center gap-2 mb-1">
                        <Building2 className="w-3 h-3 text-white/50 flex-shrink-0" />
                        <span className="text-sm text-white/70 truncate">
                          {producer.farm}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3 h-3 text-white/50 flex-shrink-0" />
                        <span className="text-xs text-white/50 truncate">
                          {producer.location}
                        </span>
                      </div>
                    </div>
                    <Badge 
                      variant="secondary" 
                      className="bg-accent/20 text-accent border-0 hover:bg-accent/30 text-xs font-medium"
                    >
                      Ativo
                    </Badge>
                  </div>
                </button>
              ))
            ) : (
              mockEmployees.map((employee, index) => (
                <button
                  key={employee.id}
                  className={cn(
                    "w-full p-4 rounded-xl border-0 transition-all duration-200",
                    "bg-white/5 hover:bg-white/10 text-white text-left group",
                    "hover:shadow-lg hover:shadow-primary/10 hover:scale-[1.01]",
                    "focus:ring-2 focus:ring-primary/50 focus:ring-offset-0 focus:outline-none",
                    "active:scale-[0.98]"
                  )}
                  onClick={() => handleItemClick(employee)}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-center gap-3 w-full">
                    <div className="relative">
                      <Avatar className="w-11 h-11 border-2 border-white/20 group-hover:border-primary/30 transition-colors">
                        <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-white font-semibold text-sm">
                          {employee.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      {employee.isOnline && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-accent rounded-full border-2 border-[#2D2D30] animate-pulse">
                          <div className="w-2 h-2 bg-white rounded-full m-auto mt-0.5" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-white mb-1 group-hover:text-primary/90 transition-colors truncate">
                        {employee.name}
                      </div>
                      <div className="text-sm text-white/70 mb-1 truncate">
                        {employee.role}
                      </div>
                    </div>
                    <Badge 
                      variant="secondary" 
                      className={cn(
                        "border-0 text-xs font-medium",
                        employee.isOnline 
                          ? "bg-accent/20 text-accent hover:bg-accent/30"
                          : "bg-white/10 text-white/60"
                      )}
                    >
                      {employee.isOnline ? 'Online' : 'Offline'}
                    </Badge>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <div className="px-6 py-4 border-t border-white/10">
        <div className="text-center text-white/40 text-xs">
          FlowAgro • {new Date().getFullYear()}
        </div>
      </div>
    </div>
  );
}