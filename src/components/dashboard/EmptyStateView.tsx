import React from "react";
import { Calendar, Wheat, Bot, Users, Clock, Zap } from "lucide-react";
import { Card } from "@/components/ui/card";

interface EmptyStateViewProps {
  type: "Agenda" | "Campo" | "IA" | "Produtor";
}

export function EmptyStateView({ type }: EmptyStateViewProps) {
  const getEmptyStateConfig = () => {
    switch (type) {
      case "Agenda":
        return {
          icon: <Calendar className="h-16 w-16 text-primary/40" />,
          title: "Agenda em Desenvolvimento",
          description: "A funcionalidade de agenda estará disponível em breve. Aqui você poderá gerenciar seus compromissos e atividades agrícolas.",
          features: ["📅 Agendamento de tarefas", "⏰ Lembretes automáticos", "🌾 Calendário agrícola"],
          color: "from-blue-500/10 to-blue-600/5"
        };
      case "Campo":
        return {
          icon: <Wheat className="h-16 w-16 text-primary/40" />,
          title: "Campo em Desenvolvimento", 
          description: "O módulo de campo estará disponível em breve. Aqui você poderá monitorar suas culturas e atividades de campo.",
          features: ["🌱 Monitoramento de culturas", "🚜 Gestão de equipamentos", "📊 Relatórios de produção"],
          color: "from-green-500/10 to-green-600/5"
        };
      case "IA":
        return {
          icon: <Bot className="h-16 w-16 text-primary/40" />,
          title: "Assistente IA",
          description: "Converse com nossa IA especializada em agricultura para obter insights e suporte técnico.",
          features: ["🤖 Suporte técnico", "💡 Insights inteligentes", "📈 Análises avançadas"],
          color: "from-purple-500/10 to-purple-600/5"
        };
      case "Produtor":
        return {
          icon: <Users className="h-16 w-16 text-primary/40" />,
          title: "Nenhuma Conversa",
          description: "Suas conversas com produtores aparecerão aqui. Comece uma nova conversa para começar.",
          features: ["💬 Chat em tempo real", "📞 Chamadas de voz", "📸 Compartilhamento de mídia"],
          color: "from-primary/10 to-primary/5"
        };
      default:
        return {
          icon: <Clock className="h-16 w-16 text-primary/40" />,
          title: "Em Breve",
          description: "Esta funcionalidade estará disponível em breve.",
          features: [],
          color: "from-gray-500/10 to-gray-600/5"
        };
    }
  };

  const config = getEmptyStateConfig();

  return (
    <div className="flex flex-1 items-center justify-center p-xl">
      <Card className={`max-w-md w-full p-xl text-center bg-gradient-to-br ${config.color} border-border/50`}>
        {/* Icon */}
        <div className="flex justify-center mb-lg">
          <div className="p-lg bg-background/50 rounded-full backdrop-blur-sm">
            {config.icon}
          </div>
        </div>

        {/* Content */}
        <div className="space-y-md">
          <h2 className="text-xl font-semibold text-foreground">
            {config.title}
          </h2>
          
          <p className="text-sm text-muted-foreground leading-relaxed">
            {config.description}
          </p>

          {/* Features List */}
          {config.features.length > 0 && (
            <div className="mt-lg">
              <h3 className="text-sm font-medium text-foreground mb-md">
                Funcionalidades planejadas:
              </h3>
              <div className="space-y-sm">
                {config.features.map((feature, index) => (
                  <div key={index} className="flex items-center justify-center gap-sm text-sm text-muted-foreground">
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Coming Soon Badge */}
          {type !== "Produtor" && type !== "IA" && (
            <div className="inline-flex items-center gap-sm px-md py-sm bg-primary/10 text-primary rounded-full text-xs font-medium mt-lg">
              <Zap className="h-3 w-3" />
              Em desenvolvimento
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}