import React, { memo } from 'react';
import { RefreshCw, Users2, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSidebarData, Producer, TeamMember } from '@/hooks/useSidebarData';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

interface FlowAgroSidebarProps {
  onItemSelect?: (item: any) => void;
  isOpen: boolean;
}

export const FlowAgroSidebar = memo<FlowAgroSidebarProps>(({ onItemSelect, isOpen }) => {
  const { items, isLoading, error, onlineCount, refresh } = useSidebarData();

  // Event handlers
  const handleItemClick = (item: Producer | TeamMember) => {
    onItemSelect?.(item);
  };

  const handleRefresh = async () => {
    await refresh();
  };

  // Helper functions
  const getItemInitials = (name: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const isProducer = (item: Producer | TeamMember): item is Producer => {
    return 'farm_name' in item;
  };

  const formatLastSeen = (lastSeen: string) => {
    const now = new Date();
    const lastSeenDate = new Date(lastSeen);
    const diffInMinutes = Math.floor((now.getTime() - lastSeenDate.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'agora mesmo';
    if (diffInMinutes < 60) return `${diffInMinutes}min atrás`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h atrás`;
    return `${Math.floor(diffInMinutes / 1440)}d atrás`;
  };

  return (
    <>
      {/* Sidebar overlay/container */}
      <div className={cn(
        "fixed top-0 left-0 h-full w-80 bg-sidebar-background border-r border-sidebar-border z-[9998]",
        "transform transition-transform duration-300 ease-out shadow-2xl",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        
        {/* Sidebar content */}
        <div className="flex flex-col h-full">
          
          {/* Header Section */}
          <div className="flex-shrink-0 p-6 border-b border-sidebar-border bg-gradient-to-br from-sidebar-background to-sidebar-background/95">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Users2 className="w-5 h-5 text-flowagro-primary" />
                <div>
                  <h2 className="font-heading font-semibold text-sm text-foreground">
                    Equipe FlowAgro
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    {items.length} {items.length === 1 ? 'pessoa' : 'pessoas'} • {onlineCount} online
                  </p>
                </div>
              </div>
              
              <Button
                variant="ghost"
                size="sm" 
                onClick={handleRefresh}
                disabled={isLoading}
                className="h-8 w-8 p-0 hover:bg-flowagro-primary/10"
              >
                <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
              </Button>
            </div>
          </div>

          {/* Content Section */}
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            
            {isLoading ? (
              <div className="space-y-3 animate-pulse">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center space-x-3 p-3 rounded-xl bg-muted/30">
                    <div className="w-10 h-10 rounded-xl bg-muted/50" />
                    <div className="flex-1">
                      <div className="h-3 bg-muted/60 rounded w-24 mb-2" />
                      <div className="h-2 bg-muted/40 rounded w-32" />
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-6">
                <p className="text-sm text-destructive mb-2">Erro ao carregar dados</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  className="text-xs"
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Tentar Novamente
                </Button>
              </div>
            ) : items.length === 0 ? (
              <div className="text-center py-8">
                <Users2 className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Nenhum item encontrado</p>
              </div>
            ) : (
              <div className="space-y-1">
                {items.map((item) => {
                  const displayName = item.name || 'Usuário';
                  const displayDetail = isProducer(item) 
                    ? item.farm_name || item.location || item.farm_location || 'Fazenda' 
                    : item.role || 'Função';
                  const isOnline = item.is_online || false;
                  
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleItemClick(item)}
                      className={cn(
                        "w-full flex items-center space-x-3 p-3 rounded-xl transition-all duration-200",
                        "hover:bg-flowagro-primary/5 active:scale-[0.98]",
                        "focus:outline-none focus:ring-2 focus:ring-flowagro-primary/20 focus:bg-flowagro-primary/5"
                      )}
                    >
                      <div className="relative flex-shrink-0">
                        <Avatar className="w-10 h-10 border-2 border-background shadow-sm">
                          <AvatarFallback className="bg-flowagro-secondary/10 text-flowagro-primary font-medium text-sm">
                            {getItemInitials(displayName)}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className={cn(
                          "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-sidebar-background",
                          isOnline ? "bg-green-500" : "bg-muted-foreground/40"
                        )} />
                      </div>
                      
                      <div className="flex-1 min-w-0 text-left">
                        <p className="font-medium text-sm text-foreground truncate font-secondary">
                          {displayName}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {displayDetail}
                        </p>
                        
                        {!isOnline && item.last_seen && (
                          <div className="flex items-center gap-1 mt-1">
                            <Clock className="w-3 h-3 text-muted-foreground/60" />
                            <span className="text-xs text-muted-foreground/80">
                              {formatLastSeen(item.last_seen)}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-shrink-0">
                        <Badge 
                          variant={isOnline ? "default" : "secondary"}
                          className={cn(
                            "text-xs px-2 py-0.5 font-medium",
                            isOnline 
                              ? "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800" 
                              : "bg-muted/50 text-muted-foreground border-muted"
                          )}
                        >
                          {isOnline ? "Online" : "Offline"}
                        </Badge>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex-shrink-0 p-4 border-t border-sidebar-border">
            <p className="text-xs text-muted-foreground/60 text-center">
              © 2024 FlowAgro. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </div>
    </>
  );
});

FlowAgroSidebar.displayName = 'FlowAgroSidebar';