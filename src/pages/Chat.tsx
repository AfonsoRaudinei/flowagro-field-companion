import React, { useState } from 'react';
import { Send, Phone, Video, MoreVertical, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const Chat: React.FC = () => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'consultant',
      content: 'Olá! Como está a safra hoje? Vi que você fez check-in no Campo Norte.',
      timestamp: '14:30',
      avatar: '/placeholder.svg'
    },
    {
      id: 2,
      sender: 'user',
      content: 'Tudo bem! Estou analisando a área de milho. Notei algumas plantas com sintomas estranhos.',
      timestamp: '14:32'
    },
    {
      id: 3,
      sender: 'consultant',
      content: 'Pode enviar algumas fotos? Vou analisar e te dar um feedback técnico.',
      timestamp: '14:33',
      avatar: '/placeholder.svg'
    }
  ]);

  const handleSendMessage = () => {
    if (!message.trim()) return;
    
    const newMessage = {
      id: messages.length + 1,
      sender: 'user',
      content: message,
      timestamp: new Date().toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    };
    
    setMessages([...messages, newMessage]);
    setMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Chat Header */}
      <div className="bg-card border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src="/placeholder.svg" alt="Consultor" />
              <AvatarFallback className="bg-primary text-primary-foreground">
                CT
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-foreground">Carlos Técnico</h3>
              <p className="text-sm text-muted-foreground">Consultor Agrícola • Online</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Phone className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Video className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] ${
                msg.sender === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card border border-border'
              } rounded-2xl px-4 py-2 shadow-sm`}
            >
              <p className="text-sm">{msg.content}</p>
              <p className={`text-xs mt-1 ${
                msg.sender === 'user' 
                  ? 'text-primary-foreground/70' 
                  : 'text-muted-foreground'
              }`}>
                {msg.timestamp}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Message Input */}
      <div className="border-t border-border p-4">
        <div className="flex items-center space-x-2">
          <div className="flex-1 relative">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Digite sua mensagem..."
              className="pr-12 h-10 bg-card border-border focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          <Button
            onClick={handleSendMessage}
            disabled={!message.trim()}
            className="h-10 w-10 p-0 bg-primary hover:bg-primary/90"
            size="icon"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="border-t border-border p-4 bg-card/50">
        <div className="flex space-x-2 overflow-x-auto">
          <Button
            variant="outline"
            size="sm"
            className="flex-shrink-0 text-xs"
          >
            📸 Enviar Foto
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-shrink-0 text-xs"
          >
            📍 Compartilhar Localização
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-shrink-0 text-xs"
          >
            📊 Relatório do Campo
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Chat;