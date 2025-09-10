import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CloudSun, MapPin, Calendar, Bot, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface QuickCardProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onClick: () => void;
  accentColor: string;
  className?: string;
}

const QuickCard: React.FC<QuickCardProps> = ({
  icon,
  title,
  subtitle,
  onClick,
  accentColor,
  className
}) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        // Base styling - Grok-inspired with FlowAgro silver/prata
        "group relative overflow-hidden rounded-2xl bg-card/95 backdrop-blur-sm",
        "border border-border/50 p-4 text-left",
        
        // Enhanced transitions and spring animations
        "transition-all duration-300 ease-out",
        "transform-gpu will-change-transform",
        
        // Grok-style shadows with silver undertones
        "shadow-[0_2px_8px_rgba(214,211,209,0.15),0_1px_3px_rgba(214,211,209,0.1)]",
        "hover:shadow-[0_8px_30px_rgba(214,211,209,0.25),0_4px_15px_rgba(214,211,209,0.15)]",
        
        // Premium hover effects - Grok-style lift
        "hover:scale-[1.02] hover:-translate-y-1",
        "active:scale-[0.98] active:translate-y-0",
        
        // Focus states with FlowAgro primary color
        "focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-offset-2",
        "focus:ring-offset-background",
        
        // Disabled states
        "disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none",
        
        className
      )}
      style={{
        // CSS custom properties for dynamic theming
        '--card-accent': accentColor,
        '--card-accent-light': `${accentColor}15`,
        '--card-accent-glow': `${accentColor}25`,
      } as React.CSSProperties}
    >
      {/* Animated background gradient - only visible on hover */}
      <div 
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: `linear-gradient(135deg, var(--card-accent-light) 0%, transparent 60%)`
        }}
      />
      
      {/* Subtle border glow on hover */}
      <div 
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          boxShadow: `inset 0 1px 0 rgba(255,255,255,0.1), 0 0 20px var(--card-accent-glow)`
        }}
      />
      
      {/* Premium shine effect - Grok signature */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none">
        <div 
          className="absolute top-0 left-0 w-full h-[1px] transform translate-y-0 group-hover:translate-y-2 transition-transform duration-700"
          style={{
            background: `linear-gradient(90deg, transparent 0%, var(--card-accent) 50%, transparent 100%)`,
            filter: 'blur(0.5px)'
          }}
        />
      </div>
      
      {/* Content container */}
      <div className="relative z-10 flex items-start space-x-4">
        {/* Icon container with enhanced styling */}
        <div 
          className={cn(
            "flex-shrink-0 p-3 rounded-xl",
            "bg-gradient-to-br from-muted/40 to-muted/20",
            "border border-border/30",
            "group-hover:scale-110 group-hover:rotate-3",
            "transition-all duration-300 ease-out transform-gpu"
          )}
          style={{
            backgroundColor: `var(--card-accent-light)`,
            borderColor: `${accentColor}20`,
            color: accentColor
          }}
        >
          <div className="transform group-hover:scale-110 transition-transform duration-300">
            {icon}
          </div>
        </div>
        
        {/* Text content with Grok typography */}
        <div className="flex-1 min-w-0 pt-1">
          {/* Title with FlowAgro secondary font */}
          <h3 className={cn(
            "font-secondary font-semibold text-card-foreground",
            "text-[15px] leading-tight tracking-[-0.01em]",  // Grok-style tight tracking
            "group-hover:text-foreground transition-colors duration-200"
          )}>
            {title}
          </h3>
          
          {/* Subtitle with muted styling */}
          <p className={cn(
            "font-secondary text-muted-foreground mt-1",
            "text-[13px] leading-tight tracking-[-0.005em]",  // Slightly tighter tracking
            "group-hover:text-muted-foreground/80 transition-colors duration-200"
          )}>
            {subtitle}
          </p>
        </div>
        
        {/* Subtle chevron indicator - Grok-style */}
        <div className={cn(
          "flex-shrink-0 opacity-30 group-hover:opacity-60",
          "transform translate-x-0 group-hover:translate-x-1",
          "transition-all duration-300 ease-out"
        )}>
          <svg 
            width="12" 
            height="12" 
            viewBox="0 0 12 12" 
            fill="none" 
            className="text-muted-foreground"
          >
            <path 
              d="M4.5 3L7.5 6L4.5 9" 
              stroke="currentColor" 
              strokeWidth="1.5" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
      
      {/* Bottom highlight line - Grok signature element */}
      <div 
        className={cn(
          "absolute bottom-0 left-4 right-4 h-[1px]",
          "opacity-0 group-hover:opacity-100",
          "transform scale-x-0 group-hover:scale-x-100",
          "transition-all duration-500 ease-out origin-center"
        )}
        style={{
          background: `linear-gradient(90deg, transparent 0%, var(--card-accent) 50%, transparent 100%)`
        }}
      />
    </button>
  );
};

interface DashboardQuickCardsProps {
  onChatFilterChange?: (filter: "Produtor" | "Agenda" | "IA" | "Campo") => void;
  currentFilter?: "Produtor" | "Agenda" | "IA" | "Campo";
  className?: string;
}

export const DashboardQuickCards: React.FC<DashboardQuickCardsProps> = ({
  onChatFilterChange,
  currentFilter = "Produtor",
  className
}) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  // Enhanced card actions with filter integration
  const handleClimateCard = () => {
    toast({
      title: "🌤️ Clima",
      description: "Previsão do tempo em breve. Acompanhe as condições da sua propriedade.",
      duration: 4000,
    });
  };

  const handleMapCard = () => {
    toast({
      title: "🗺️ Abrindo Mapa Técnico",
      description: "Carregando visualização avançada...",
      duration: 2000,
    });
    setTimeout(() => {
      navigate("/technical-map");
    }, 400);
  };

  const handleAgendaCard = () => {
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
  };

  const handleIACard = () => {
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
  };

  const handleProducerCard = () => {
    if (onChatFilterChange) {
      onChatFilterChange("Produtor");
      toast({
        title: "👥 Filtro Produtores Ativado",
        description: "Visualizando conversas com produtores",
        duration: 3000,
      });
    }
  };

  return (
    <div className={cn(
      "w-full px-4 py-4",
      // Subtle background with silver undertones
      "bg-gradient-to-b from-muted/20 to-transparent",
      className
    )}>
      {/* Header section - Grok-style */}
      <div className="mb-4">
        <h2 className={cn(
          "font-secondary font-semibold text-foreground",
          "text-[17px] leading-tight tracking-[-0.01em]",
          "opacity-90"
        )}>
          Acesso Rápido
        </h2>
        <p className={cn(
          "font-secondary text-muted-foreground mt-0.5",
          "text-[13px] leading-tight tracking-[-0.005em]"
        )}>
          Suas ferramentas principais
        </p>
      </div>

      {/* Enhanced grid with better spacing and active states */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card de Produtores - Verde FlowAgro */}
        <QuickCard
          icon={<Users size={22} strokeWidth={1.8} />}
          title="Produtores"
          subtitle="Conversas ativas"
          onClick={handleProducerCard}
          accentColor="#16A34A"
          className={cn(
            "hover:shadow-[0_8px_30px_rgba(22,163,74,0.15)]",
            currentFilter === "Produtor" && "ring-2 ring-primary/40 bg-primary/5"
          )}
        />

        {/* Card de Mapa - Verde FlowAgro */}
        <QuickCard
          icon={<MapPin size={22} strokeWidth={1.8} />}
          title="Mapa Técnico"
          subtitle="Suas propriedades"
          onClick={handleMapCard}
          accentColor="#16A34A"
          className="hover:shadow-[0_8px_30px_rgba(22,163,74,0.15)]"
        />

        {/* Card de Agenda - Verde Água */}
        <QuickCard
          icon={<Calendar size={22} strokeWidth={1.8} />}
          title="Agenda"
          subtitle="Atividades"
          onClick={handleAgendaCard}
          accentColor="#00C4B4"
          className={cn(
            "hover:shadow-[0_8px_30px_rgba(0,196,180,0.15)]",
            currentFilter === "Agenda" && "ring-2 ring-primary/40 bg-primary/5"
          )}
        />

        {/* Card de IA - Azul Samsung */}
        <QuickCard
          icon={<Bot size={22} strokeWidth={1.8} />}
          title="Assistente IA"
          subtitle="Chat inteligente"
          onClick={handleIACard}
          accentColor="#0057FF"
          className={cn(
            "hover:shadow-[0_8px_30px_rgba(0,87,255,0.15)]",
            currentFilter === "IA" && "ring-2 ring-primary/40 bg-primary/5"
          )}
        />
      </div>
      
      {/* Subtle bottom separator */}
      <div className="mt-6 border-b border-border/30" />
    </div>
  );
};

export default DashboardQuickCards;