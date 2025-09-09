import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CloudSun, MapPin, Calendar, Bot } from 'lucide-react';
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
        "relative overflow-hidden rounded-xl bg-card border border-border",
        "p-4 text-left transition-all duration-200",
        
        // iOS shadows and elevation
        "shadow-ios-sm hover:shadow-ios-md",
        
        // Hover effects - lift and subtle glow
        "hover:animate-hover-lift active:animate-bounce-press",
        
        // Touch targets and accessibility
        "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        
        className
      )}
      style={{
        // Custom accent color for hover glow
        '--accent-glow': `${accentColor}20`,
      } as React.CSSProperties}
    >
      {/* Accent gradient background */}
      <div 
        className="absolute inset-0 opacity-0 hover:opacity-5 transition-opacity duration-300"
        style={{
          background: `linear-gradient(135deg, ${accentColor}15, transparent 70%)`
        }}
      />
      
      {/* Content */}
      <div className="relative z-10 flex items-center space-x-3">
        {/* Icon container with accent color */}
        <div 
          className="flex-shrink-0 p-2 rounded-lg transition-colors duration-200"
          style={{
            backgroundColor: `${accentColor}10`,
            color: accentColor
          }}
        >
          {icon}
        </div>
        
        {/* Text content */}
        <div className="flex-1 min-w-0">
          <h3 className="font-secondary font-medium text-ios-base text-card-foreground leading-tight">
            {title}
          </h3>
          <p className="font-secondary text-ios-sm text-muted-foreground mt-0.5 leading-tight">
            {subtitle}
          </p>
        </div>
      </div>
      
      {/* Subtle shine effect on hover */}
      <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none">
        <div 
          className="absolute top-0 left-0 w-full h-px bg-white/20" 
          style={{
            background: `linear-gradient(90deg, transparent, ${accentColor}30, transparent)`
          }}
        />
      </div>
    </button>
  );
};

interface DashboardQuickCardsProps {
  onChatFilterChange?: (filter: "Produtor" | "Agenda" | "IA" | "Campo") => void;
  className?: string;
}

export const DashboardQuickCards: React.FC<DashboardQuickCardsProps> = ({
  onChatFilterChange,
  className
}) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  // Card actions
  const handleClimateCard = () => {
    toast({
      title: "🌤️ Clima",
      description: "Previsão do tempo em desenvolvimento. Em breve você poderá acompanhar as condições climáticas da sua propriedade.",
      duration: 4000,
    });
  };

  const handleMapCard = () => {
    toast({
      title: "🗺️ Abrindo Mapa Técnico",
      description: "Carregando visualização de propriedades...",
      duration: 2000,
    });
    // Pequeno delay para melhor UX
    setTimeout(() => {
      navigate("/technical-map");
    }, 300);
  };

  const handleAgendaCard = () => {
    toast({
      title: "📅 Agenda",
      description: "Sistema de agenda em desenvolvimento. Em breve você poderá gerenciar suas atividades programadas.",
      duration: 4000,
    });
  };

  const handleIACard = () => {
    if (onChatFilterChange) {
      onChatFilterChange("IA");
      toast({
        title: "🤖 Assistente IA Ativado",
        description: "Agora você pode conversar com nosso assistente inteligente!",
        duration: 3000,
      });
    } else {
      toast({
        title: "🤖 Assistente IA",
        description: "Modo de chat inteligente ativado",
        duration: 2000,
      });
    }
  };

  return (
    <div className={cn("w-full px-4 py-3", className)}>
      {/* Grid responsivo: 2x2 em mobile, 4x1 em desktop */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Card de Clima - Azul Samsung */}
        <QuickCard
          icon={<CloudSun size={20} />}
          title="Clima"
          subtitle="Previsão local"
          onClick={handleClimateCard}
          accentColor="#0057FF" // FlowAgro Blue
          className="hover:bg-gradient-to-br from-blue-50/50 to-transparent"
        />

        {/* Card de Mapa - Verde FlowAgro */}
        <QuickCard
          icon={<MapPin size={20} />}
          title="Mapa Técnico"
          subtitle="Visualizar propriedades"
          onClick={handleMapCard}
          accentColor="#16A34A" // FlowAgro Green
          className="hover:bg-gradient-to-br from-green-50/50 to-transparent"
        />

        {/* Card de Agenda - Verde Água */}
        <QuickCard
          icon={<Calendar size={20} />}
          title="Agenda"
          subtitle="Atividades programadas"
          onClick={handleAgendaCard}
          accentColor="#00C4B4" // FlowAgro Teal
          className="hover:bg-gradient-to-br from-teal-50/50 to-transparent"
        />

        {/* Card de IA - Azul Samsung */}
        <QuickCard
          icon={<Bot size={20} />}
          title="Assistente IA"
          subtitle="Chat inteligente"
          onClick={handleIACard}
          accentColor="#0057FF" // FlowAgro Blue
          className="hover:bg-gradient-to-br from-blue-50/50 to-transparent"
        />
      </div>
    </div>
  );
};

export default DashboardQuickCards;