import React from 'react';
import { Users, Building2, MapPin, UserCheck } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
} from '@/components/ui/sidebar';
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
}

export function FlowAgroSidebar({ onItemSelect }: FlowAgroSidebarProps) {
  const { isConsultor, isProdutor, linkedProducers } = useUser();
  
  // Use mock data if no real data is available
  const displayProducers = linkedProducers.length > 0 ? linkedProducers : mockProducers;
  const producerCount = displayProducers.length;

  const handleItemClick = (item: any) => {
    onItemSelect?.(item);
  };

  return (
    <Sidebar 
      className="w-80 border-0 bg-[#2D2D30] z-50" 
      side="left"
    >
      <SidebarHeader className="px-6 py-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            {isConsultor ? <Users className="w-5 h-5 text-white" /> : <Building2 className="w-5 h-5 text-white" />}
          </div>
          <div>
            <h3 className="font-semibold text-white text-base">
              {isConsultor ? 'Meus Clientes' : 'Minha Equipe'}
            </h3>
            <p className="text-white/60 text-sm">
              {isConsultor 
                ? `${producerCount} produtores` 
                : `${mockEmployees.length} funcionários`
              }
            </p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3 py-4">
        <SidebarGroup>
          <SidebarGroupLabel className="text-white/70 font-medium mb-3">
            {isConsultor ? 'Produtores Vinculados' : 'Funcionários Ativos'}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2">
              {isConsultor ? (
                displayProducers.map((producer) => (
                  <SidebarMenuItem key={producer.id}>
                    <SidebarMenuButton
                      className={cn(
                        "w-full p-4 rounded-xl border-0 transition-all duration-200",
                        "bg-white/5 hover:bg-white/10 text-white",
                        "hover:shadow-lg hover:shadow-primary/20",
                        "focus:ring-2 focus:ring-primary/50 focus:ring-offset-0",
                        "active:scale-[0.98]"
                      )}
                      onClick={() => handleItemClick(producer)}
                    >
                      <div className="flex items-center gap-3 w-full">
                        <Avatar className="w-10 h-10 border-2 border-white/20">
                          <AvatarFallback className="bg-primary text-white font-semibold text-sm">
                            {producer.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 text-left">
                          <div className="font-medium text-white mb-1">
                            {producer.name}
                          </div>
                          <div className="flex items-center gap-2 mb-1">
                            <Building2 className="w-3 h-3 text-white/60" />
                            <span className="text-sm text-white/80">
                              {producer.farm}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-3 h-3 text-white/60" />
                            <span className="text-xs text-white/60">
                              {producer.location}
                            </span>
                          </div>
                        </div>
                        <Badge 
                          variant="secondary" 
                          className="bg-accent/20 text-accent border-0 hover:bg-accent/30"
                        >
                          Ativo
                        </Badge>
                      </div>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))
              ) : (
                mockEmployees.map((employee) => (
                  <SidebarMenuItem key={employee.id}>
                    <SidebarMenuButton
                      className={cn(
                        "w-full p-4 rounded-xl border-0 transition-all duration-200",
                        "bg-white/5 hover:bg-white/10 text-white",
                        "hover:shadow-lg hover:shadow-primary/20",
                        "focus:ring-2 focus:ring-primary/50 focus:ring-offset-0",
                        "active:scale-[0.98]"
                      )}
                      onClick={() => handleItemClick(employee)}
                    >
                      <div className="flex items-center gap-3 w-full">
                        <div className="relative">
                          <Avatar className="w-10 h-10 border-2 border-white/20">
                            <AvatarFallback className="bg-primary text-white font-semibold text-sm">
                              {employee.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          {employee.isOnline && (
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-accent rounded-full border-2 border-[#2D2D30]">
                              <UserCheck className="w-2 h-2 text-white m-auto mt-0.5" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 text-left">
                          <div className="font-medium text-white mb-1">
                            {employee.name}
                          </div>
                          <div className="text-sm text-white/80 mb-1">
                            {employee.role}
                          </div>
                        </div>
                        <Badge 
                          variant="secondary" 
                          className={cn(
                            "border-0 text-xs",
                            employee.isOnline 
                              ? "bg-accent/20 text-accent hover:bg-accent/30"
                              : "bg-white/10 text-white/60"
                          )}
                        >
                          {employee.isOnline ? 'Online' : 'Offline'}
                        </Badge>
                      </div>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}