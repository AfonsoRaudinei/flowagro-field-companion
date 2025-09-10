import React, { memo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Calendar, Bot, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { QuickAccessCard } from './QuickAccessCard';

interface QuickAccessGridProps {
  onChatFilterChange?: (filter: "Produtor" | "Agenda" | "IA" | "Campo") => void;
  currentFilter?: "Produtor" | "Agenda" | "IA" | "Campo";
}

/**
 * Optimized grid component for quick access cards
 * Memoized and optimized for performance
 */
export const QuickAccessGrid = memo<QuickAccessGridProps>(({
  onChatFilterChange,
  currentFilter = "Produtor"
}) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  // Memoized handlers for better performance
  const handleMapCard = useCallback(() => {
    toast({
      title: "🗺️ Abrindo Mapa Técnico",
      description: "Carregando visualização avançada...",
      duration: 2000,
    });
    setTimeout(() => navigate("/technical-map"), 400);
  }, [navigate, toast]);

  const handleAgendaCard = useCallback(() => {
    if (onChatFilterChange) {
      onChatFilterChange("Agenda");
      toast({
        title: "📅 Filtro Agenda Ativado",
        description: "Visualizando conversas relacionadas à agenda",
        duration: 3000,
      });
    } else {
      toast({
        title: "📅 Agenda",
        description: "Sistema de agenda em desenvolvimento. Gerencie suas atividades em breve.",
        duration: 4000,
      });
    }
  }, [onChatFilterChange, toast]);

  const handleIACard = useCallback(() => {
    if (onChatFilterChange) {
      onChatFilterChange("IA");
      toast({
        title: "🤖 Assistente IA Ativado",
        description: "Converse com nosso assistente inteligente!",
        duration: 3000,
      });
    } else {
      toast({
        title: "🤖 Assistente IA",
        description: "Modo inteligente ativado",
        duration: 2000,
      });
    }
  }, [onChatFilterChange, toast]);

  const handleProducerCard = useCallback(() => {
    if (onChatFilterChange) {
      onChatFilterChange("Produtor");
      toast({
        title: "👥 Filtro Produtores Ativado",
        description: "Visualizando conversas com produtores",
        duration: 3000,
      });
    }
  }, [onChatFilterChange, toast]);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
      {/* Card de Produtores - Verde FlowAgro */}
      <QuickAccessCard
        icon={<Users size={20} strokeWidth={1.8} />}
        title="Produtores"
        subtitle="Conversas ativas"
        onClick={handleProducerCard}
        accentColor="#16A34A"
        isActive={currentFilter === "Produtor"}
        className="sm:hover:shadow-[0_8px_30px_rgba(22,163,74,0.15)]"
      />

      {/* Card de Mapa - Verde FlowAgro */}
      <QuickAccessCard
        icon={<MapPin size={20} strokeWidth={1.8} />}
        title="Mapa Técnico"
        subtitle="Suas propriedades"
        onClick={handleMapCard}
        accentColor="#16A34A"
        className="sm:hover:shadow-[0_8px_30px_rgba(22,163,74,0.15)]"
      />

      {/* Card de Agenda - Verde Água */}
      <QuickAccessCard
        icon={<Calendar size={20} strokeWidth={1.8} />}
        title="Agenda"
        subtitle="Atividades"
        onClick={handleAgendaCard}
        accentColor="#00C4B4"
        isActive={currentFilter === "Agenda"}
        className="sm:hover:shadow-[0_8px_30px_rgba(0,196,180,0.15)]"
      />

      {/* Card de IA - Azul Samsung */}
      <QuickAccessCard
        icon={<Bot size={20} strokeWidth={1.8} />}
        title="Assistente IA"
        subtitle="Chat inteligente"
        onClick={handleIACard}
        accentColor="#0057FF"
        isActive={currentFilter === "IA"}
        className="sm:hover:shadow-[0_8px_30px_rgba(0,87,255,0.15)]"
      />
    </div>
  );
});

QuickAccessGrid.displayName = 'QuickAccessGrid';