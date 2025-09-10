import React, { memo, useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Cloud, MapPin, Calendar, Bot, FileText } from 'lucide-react';
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
  const {
    toast
  } = useToast();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: 'center',
    skipSnaps: false,
    containScroll: 'trimSnaps'
  });
  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => {
      setSelectedIndex(emblaApi.selectedScrollSnap());
    };
    emblaApi.on('select', onSelect);
    onSelect();
    return () => {
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi]);

  // Memoized handlers with enhanced functionality
  const handleClimaCard = useCallback(() => {
    toast({
      title: "🌤️ Centro Meteorológico",
      description: "Previsão do tempo, alertas climáticos e dados meteorológicos para sua região",
      duration: 4000
    });
    
    // Future: Navigate to weather dashboard
    setTimeout(() => {
      toast({
        title: "⚡ Em desenvolvimento",
        description: "Sistema meteorológico avançado chegará em breve com dados em tempo real",
        duration: 3000
      });
    }, 500);
  }, [toast]);

  const handleAgendaCard = useCallback(() => {
    if (onChatFilterChange) {
      onChatFilterChange("Agenda");
      toast({
        title: "📅 Agenda Ativada",
        description: "Visualizando compromissos, eventos e atividades programadas",
        duration: 3000
      });
    } else {
      toast({
        title: "📅 Central de Agenda",
        description: "Gerencie plantios, pulverizações, colheitas e reuniões em um só lugar",
        duration: 4000
      });
    }
  }, [onChatFilterChange, toast]);

  const handleMapCard = useCallback(() => {
    toast({
      title: "🗺️ Abrindo Mapa Técnico",
      description: "Carregando visualização de propriedades, campos e análises geoespaciais...",
      duration: 2500
    });
    setTimeout(() => navigate("/technical-map"), 400);
  }, [navigate, toast]);

  const handleIACard = useCallback(() => {
    if (onChatFilterChange) {
      onChatFilterChange("IA");
      toast({
        title: "🤖 Assistente IA Ativo",
        description: "Converse sobre agricultura, obtenha insights e tire dúvidas técnicas",
        duration: 3000
      });
    } else {
      toast({
        title: "🤖 Inteligência Artificial",
        description: "Assistente especializado em agricultura e agronegócio",
        duration: 2500
      });
    }
  }, [onChatFilterChange, toast]);

  const handleRelatorioCard = useCallback(() => {
    toast({
      title: "📊 Central de Relatórios",
      description: "Análises de produtividade, custos, safras e indicadores de performance",
      duration: 4000
    });
    
    // Future: Navigate to reports dashboard  
    setTimeout(() => {
      toast({
        title: "⚡ Novidade chegando",
        description: "Dashboard completo de relatórios e analytics será lançado em breve",
        duration: 3000
      });
    }, 500);
  }, [toast]);
  const cards = [{
    icon: <Cloud size={20} strokeWidth={1.8} />,
    title: "Clima",
    subtitle: "Meteorologia",
    onClick: handleClimaCard,
    accentColor: "#0EA5E9"
  }, {
    icon: <Calendar size={20} strokeWidth={1.8} />,
    title: "Agenda", 
    subtitle: "Atividades",
    onClick: handleAgendaCard,
    accentColor: "#F59E0B",
    isActive: currentFilter === "Agenda"
  }, {
    icon: <MapPin size={20} strokeWidth={1.8} />,
    title: "Mapa",
    subtitle: "Propriedades",
    onClick: handleMapCard,
    accentColor: "#16A34A"
  }, {
    icon: <Bot size={20} strokeWidth={1.8} />,
    title: "IA",
    subtitle: "Assistente",
    onClick: handleIACard,
    accentColor: "#8B5CF6",
    isActive: currentFilter === "IA"
  }, {
    icon: <FileText size={20} strokeWidth={1.8} />,
    title: "Relatórios",
    subtitle: "Analytics",
    onClick: handleRelatorioCard,
    accentColor: "#EF4444"
  }];
  return <div className={cn("relative w-full max-w-6xl mx-auto", className)}>
      {/* Grok-style background gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-background pointer-events-none z-10" />
      
      {/* Central FlowAgro Logo - Fixed Position */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30">
        
      </div>

      {/* Carousel Container - Ultra compact, no padding */}
      <div className="overflow-hidden px-4 sm:px-8 md:px-12" ref={emblaRef}>
        <div className="flex gap-1.5 sm:gap-2 py-1 sm:py-1.5">
          {cards.map((card, index) => <div key={index} className={cn("flex-[0_0_170px] sm:flex-[0_0_210px] min-w-0 transition-all duration-500", selectedIndex === index ? "scale-105 z-20" : "scale-95 opacity-70")}>
              <QuickAccessCard icon={card.icon} title={card.title} subtitle={card.subtitle} onClick={card.onClick} accentColor={card.accentColor} isActive={card.isActive} className={cn("h-14 sm:h-18 transform transition-all duration-500", selectedIndex === index ? "shadow-2xl ring-2 ring-primary/20" : "shadow-lg hover:shadow-xl")} />
            </div>)}
        </div>
      </div>


      {/* Side navigation hints */}
      <div className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 opacity-30 hover:opacity-70 transition-opacity z-20">
        <button onClick={() => emblaApi?.scrollPrev()} className="p-2 rounded-full bg-background/80 backdrop-blur-sm border border-border/50 hover:bg-background/90" aria-label="Card anterior">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
      
      <div className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 opacity-30 hover:opacity-70 transition-opacity z-20">
        <button onClick={() => emblaApi?.scrollNext()} className="p-2 rounded-full bg-background/80 backdrop-blur-sm border border-border/50 hover:bg-background/90" aria-label="Próximo card">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>;
});
HorizontalCardCarousel.displayName = 'HorizontalCardCarousel';