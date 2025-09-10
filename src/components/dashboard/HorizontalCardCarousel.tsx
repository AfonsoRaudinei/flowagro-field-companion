import React, { memo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Calendar, Bot, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { FlowAgroLogo } from '@/components/ui/flowagro-brand';
import { QuickAccessCard } from './QuickAccessCard';
import useEmblaCarousel from 'embla-carousel-react';

interface HorizontalCardCarouselProps {
  onChatFilterChange?: (filter: "Produtor" | "Agenda" | "IA" | "Campo") => void;
  currentFilter?: "Produtor" | "Agenda" | "IA" | "Campo";
  className?: string;
}

/**
 * Grok-style horizontal carousel with FlowAgro logo in center
 */
export const HorizontalCardCarousel = memo<HorizontalCardCarouselProps>(({
  onChatFilterChange,
  currentFilter = "Produtor",
  className
}) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    loop: true,
    align: 'center',
    skipSnaps: false,
    dragFree: true
  });

  // Memoized handlers
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

  const cards = [
    {
      icon: <Users size={20} strokeWidth={1.8} />,
      title: "Produtores",
      subtitle: "Conversas ativas",
      onClick: handleProducerCard,
      accentColor: "#16A34A",
      isActive: currentFilter === "Produtor"
    },
    {
      icon: <MapPin size={20} strokeWidth={1.8} />,
      title: "Mapa Técnico", 
      subtitle: "Suas propriedades",
      onClick: handleMapCard,
      accentColor: "#16A34A"
    },
    {
      icon: <Calendar size={20} strokeWidth={1.8} />,
      title: "Agenda",
      subtitle: "Atividades",
      onClick: handleAgendaCard,
      accentColor: "#00C4B4",
      isActive: currentFilter === "Agenda"
    },
    {
      icon: <Bot size={20} strokeWidth={1.8} />,
      title: "Assistente IA",
      subtitle: "Chat inteligente", 
      onClick: handleIACard,
      accentColor: "#0057FF",
      isActive: currentFilter === "IA"
    }
  ];

  return (
    <div className={cn("relative w-full", className)}>
      {/* Central FlowAgro Logo */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20">
        <div className="bg-background/95 backdrop-blur-sm rounded-full p-3 shadow-lg border border-border/50">
          <FlowAgroLogo className="w-8 h-8" />
        </div>
      </div>

      {/* Carousel Container */}
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex gap-4 py-4">
          {cards.map((card, index) => (
            <div key={index} className="flex-[0_0_280px] min-w-0">
              <QuickAccessCard
                icon={card.icon}
                title={card.title}
                subtitle={card.subtitle}
                onClick={card.onClick}
                accentColor={card.accentColor}
                isActive={card.isActive}
                className="h-full"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Scroll indicators */}
      <div className="flex justify-center mt-4 gap-2">
        {cards.map((_, index) => (
          <button
            key={index}
            className="w-2 h-2 rounded-full bg-muted-foreground/30 hover:bg-muted-foreground/60 transition-colors"
            onClick={() => emblaApi?.scrollTo(index)}
          />
        ))}
      </div>
    </div>
  );
});

HorizontalCardCarousel.displayName = 'HorizontalCardCarousel';