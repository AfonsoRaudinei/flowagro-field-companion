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
    <div className="flex items-center gap-3 p-4 border-b bg-background/95 backdrop-blur-sm">
      <Button variant="ghost" size="sm" onClick={onBack} className="h-9 w-9 p-0">
        <ArrowLeft className="h-4 w-4" />
      </Button>
      <h1 className="text-lg font-semibold text-foreground">Chat Técnico</h1>
    </div>
  );
};

// Mini-componente: Tabs superiores
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
  return <div className="border-b bg-muted/30">
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex gap-1 p-2">
          {tabs.map(tab => <Button key={tab.id} variant={activeTab === tab.id ? "default" : "ghost"} size="sm" onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 min-w-fit px-4 h-9 rounded-lg transition-all ${activeTab === tab.id ? "bg-primary text-primary-foreground shadow-sm" : "hover:bg-primary/10 text-muted-foreground hover:text-foreground"}`}>
              <span className="text-sm">{tab.emoji}</span>
              <span className="text-sm font-medium">{tab.label}</span>
            </Button>)}
        </div>
      </ScrollArea>
    </div>;
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