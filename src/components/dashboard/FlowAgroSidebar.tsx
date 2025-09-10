import React from 'react';
import { Users, Building2, MapPin, UserCheck, Loader2, RefreshCw } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useSidebarData, type Producer, type Employee } from '@/hooks/useSidebarData';

interface FlowAgroSidebarProps {
  onItemSelect?: (item: Producer | Employee) => void;
  isOpen?: boolean;
}

export function FlowAgroSidebar({ onItemSelect, isOpen = false }: FlowAgroSidebarProps) {
  const { displayData, loading, error, refresh, stats } = useSidebarData();

  const handleItemClick = (item: Producer | Employee) => {
    onItemSelect?.(item);
  };

  const handleRefresh = async () => {
    await refresh();
  };

  const getItemInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const isProducer = (item: Producer | Employee): item is Producer => {
    return displayData.type === 'producers';
  };

  const formatLastSeen = (lastSeen?: string) => {
    if (!lastSeen) return '';
    
    const diff = Date.now() - new Date(lastSeen).getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Agora mesmo';
    if (minutes < 60) return `${minutes}min atrás`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h atrás`;
    
    const days = Math.floor(hours / 24);
    return `${days}d atrás`;
  };

  return (
    <div 
      className={cn(
        "fixed left-0 top-0 h-screen z-[9998]",
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
            {displayData.type === 'producers' ? (
              <Users className="w-6 h-6 text-white" />
            ) : (
              <Building2 className="w-6 h-6 text-white" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-white text-lg truncate">
              {displayData.title}
            </h3>
            <p className="text-white/60 text-sm font-medium truncate">
              {displayData.subtitle}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-2 h-2 bg-accent rounded-full animate-pulse" />
              <span className="text-xs text-white/50">
                {stats.onlineCount} online
              </span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRefresh}
            disabled={loading}
            className="text-white/60 hover:text-white hover:bg-white/10 w-8 h-8"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Content Section */}
      <div className="flex-1 overflow-y-auto py-4">
        <div className="px-4">
          <div className="text-white/70 font-medium mb-4 text-xs uppercase tracking-wider px-2">
            {displayData.type === 'producers' ? 'Produtores Vinculados' : 'Equipe de Trabalho'}
          </div>
          
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                className="mt-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 h-8 px-2"
              >
                Tentar novamente
              </Button>
            </div>
          )}
          
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="p-4 bg-white/5 rounded-xl animate-pulse">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 bg-white/10 rounded-full" />
                    <div className="flex-1">
                      <div className="h-4 bg-white/10 rounded mb-2" />
                      <div className="h-3 bg-white/5 rounded w-3/4" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {displayData.items.map((item, index) => {
                const isOnline = isProducer(item) ? item.is_online : item.isOnline;
                const lastSeen = isProducer(item) ? item.last_seen : item.last_seen;
                
                return (
                  <button
                    key={item.id}
                    className={cn(
                      "w-full p-4 rounded-xl border-0 transition-all duration-200",
                      "bg-white/5 hover:bg-white/10 text-white text-left group",
                      "hover:shadow-lg hover:shadow-primary/10 hover:scale-[1.01]",
                      "focus:ring-2 focus:ring-primary/50 focus:ring-offset-0 focus:outline-none",
                      "active:scale-[0.98]"
                    )}
                    onClick={() => handleItemClick(item)}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-center gap-3 w-full">
                      <div className="relative">
                        <Avatar className="w-11 h-11 border-2 border-white/20 group-hover:border-primary/30 transition-colors">
                          <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-white font-semibold text-sm">
                            {getItemInitials(item.name)}
                          </AvatarFallback>
                        </Avatar>
                        {isOnline && (
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-accent rounded-full border-2 border-[#2D2D30] animate-pulse">
                            <div className="w-2 h-2 bg-white rounded-full m-auto mt-0.5" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-white mb-1 group-hover:text-primary/90 transition-colors truncate">
                          {item.name}
                        </div>
                        
                        {isProducer(item) ? (
                          <>
                            <div className="flex items-center gap-2 mb-1">
                              <Building2 className="w-3 h-3 text-white/50 flex-shrink-0" />
                              <span className="text-sm text-white/70 truncate">
                                {item.farm_name}
                              </span>
                            </div>
                            {item.location && (
                              <div className="flex items-center gap-2">
                                <MapPin className="w-3 h-3 text-white/50 flex-shrink-0" />
                                <span className="text-xs text-white/50 truncate">
                                  {item.location}
                                </span>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="text-sm text-white/70 mb-1 truncate">
                            {item.role}
                          </div>
                        )}
                        
                        {!isOnline && lastSeen && (
                          <div className="text-xs text-white/40 truncate">
                            {formatLastSeen(lastSeen)}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge 
                          variant="secondary" 
                          className={cn(
                            "border-0 text-xs font-medium",
                            isOnline 
                              ? "bg-accent/20 text-accent hover:bg-accent/30"
                              : "bg-white/10 text-white/60"
                          )}
                        >
                          {isOnline ? 'Online' : 'Offline'}
                        </Badge>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {!loading && displayData.items.length === 0 && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                {displayData.type === 'producers' ? (
                  <Users className="w-8 h-8 text-white/30" />
                ) : (
                  <Building2 className="w-8 h-8 text-white/30" />
                )}
              </div>
              <p className="text-white/60 text-sm mb-2">{displayData.emptyMessage}</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                className="text-white/50 hover:text-white hover:bg-white/10"
              >
                Tentar novamente
              </Button>
            </div>
          )}
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