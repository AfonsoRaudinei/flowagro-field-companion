import React, { useState } from "react";
import { ArrowLeft, Send, Plus, MessageCircle, FileText, Image, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";

// Mini-componente: Header do Chat
const ChatHeader: React.FC<{
  onBack: () => void;
}> = ({
  onBack
}) => {
  return (
    <div className="flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur-sm">
      <Button
        variant="ghost"
        size="sm"
        onClick={onBack}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Voltar</span>
      </Button>
      <h1 className="text-lg font-semibold text-foreground">Chat Técnico</h1>
      <div className="w-20" /> {/* Spacer para centralizar o título */}
    </div>
  );
};

// Mini-componente: Tabs superiores (estilo "Produtor")
const ChatTabs = () => {
  const [activeTab, setActiveTab] = useState("chat");
  const tabs = [{
    id: "chat",
    label: "Chat",
    icon: MessageCircle,
    emoji: "💬"
  }, {
    id: "reports",
    label: "Relatórios",
    icon: FileText,
    emoji: "📑"
  }, {
    id: "gallery",
    label: "Galeria",
    icon: Image,
    emoji: "🖼️"
  }, {
    id: "history",
    label: "Histórico",
    icon: BarChart3,
    emoji: "📊"
  }];
  
  return (
    <div className="bg-background/95 backdrop-blur-sm border-b border-border/50 p-3">
      <div className="flex gap-2 overflow-x-auto">
        {tabs.map(tab => {
          const isActive = activeTab === tab.id;
          
          return (
            <Button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                relative inline-flex items-center gap-2 px-4 py-2.5 rounded-full font-medium text-sm
                transition-all duration-300 ease-out min-w-fit whitespace-nowrap
                ${isActive 
                  ? 'bg-gradient-to-r from-primary via-primary/95 to-primary/90 text-primary-foreground shadow-lg shadow-primary/25 scale-105' 
                  : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground hover:scale-102'
                }
              `}
              variant="ghost"
            >
              <span className="text-base leading-none">{tab.emoji}</span>
              {isActive && (
                <span className="font-semibold animate-fade-in">
                  {tab.label}
                </span>
              )}
              
              {/* Efeito de brilho quando ativo */}
              {isActive && (
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent rounded-full animate-pulse" />
              )}
            </Button>
          );
        })}
      </div>
    </div>
  );
};

// Mini-componente: Área de mensagens
const ChatMessages = () => {
  return <ScrollArea className="flex-1 p-4">
      <div className="space-y-4">
        {/* Placeholder para mensagens futuras */}
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-4">
            <MessageCircle className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Bem-vindo ao Chat Técnico
          </h3>
          <p className="text-sm text-muted-foreground max-w-xs">
            Converse com a IA especializada em agricultura para obter insights técnicos
          </p>
        </div>
      </div>
    </ScrollArea>;
};

// Mini-componente: Input de mensagem
const ChatInput = () => {
  const [message, setMessage] = useState("");
  const handleSend = () => {
    if (!message.trim()) return;
    // TODO: Implementar envio de mensagem
    setMessage("");
  };
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  return <div className="border-t bg-background/95 backdrop-blur-sm p-4">
      <div className="flex items-end gap-2">
        {/* Dropdown de anexos */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-10 w-10 p-0 border-input hover:bg-muted/50">
              <Plus className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuItem className="flex items-center gap-2">
              <Image className="h-4 w-4" />
              <span>Imagem</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span>PDF</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Input de texto */}
        <div className="flex-1 relative">
          <Textarea value={message} onChange={e => setMessage(e.target.value)} onKeyPress={handleKeyPress} placeholder="Digite sua pergunta técnica..." className="min-h-[40px] max-h-32 resize-none pr-12 text-sm border-input focus:border-primary" rows={1} />
        </div>

        {/* Botão enviar */}
        <Button onClick={handleSend} disabled={!message.trim()} size="sm" className="h-10 w-10 p-0 bg-primary hover:bg-primary/90">
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>;
};

// Componente principal: Technical Chat View
export const TechnicalChatView = ({
  onBack
}: {
  onBack: () => void;
}) => {
  return <div className="flex flex-col h-screen bg-background">
      <ChatHeader onBack={onBack} />
      <ChatTabs />
      <ChatMessages />
      <ChatInput />
    </div>;
};
export default TechnicalChatView;