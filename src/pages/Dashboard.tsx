import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Send, Camera, Mic, User, MapPin, Settings, MessageSquare, ChevronDown, Smile, MoreHorizontal, Loader2, Calendar, Radio, Globe, Database, Package, Leaf, Mountain, Cloud } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import SyncIndicator from '@/components/ui/sync-indicator';
import { useToast } from '@/hooks/use-toast';
import ProducerChatCard from '@/components/ProducerChatCard';
import SearchBar from '@/components/SearchBar';
import { QuickActionsBar } from '@/components/QuickActionsBar';
import useVoiceRecorder from '@/hooks/useVoiceRecorder';
import { CameraService } from '@/services/cameraService';
import { IALudmilaIcon } from '@/components/icons/IALudmilaIcon';
import { supabase as sb } from '@/integrations/supabase/client';
import TechnicalMapPanel from '@/components/map/TechnicalMapPanel';

type ChatFilter = 'agenda' | 'producer' | 'ai' | 'live-field';
type ViewMode = 'list' | 'conversation';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const [chatFilter, setChatFilter] = useState<ChatFilter>('producer');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [message, setMessage] = useState('');
  const [aiMessages, setAiMessages] = useState<any[]>([]);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Tipos e estados de chat
  type Sender = 'producer' | 'consultant' | 'user' | 'ai' | 'system';
  type MessageType = 'text' | 'image' | 'audio' | 'ndvi' | 'weather' | 'news' | 'finance' | 'defensivo' | 'system';
  type SourceType = 'local' | 'external';

  interface ChatMessage {
    id: number;
    sender: Sender;
    type?: MessageType;
    message?: string;
    url?: string;
    thumb?: string;
    timestamp: string;
    avatar?: string;
    source?: SourceType; // 'local' | 'external' para IA
  }

  interface ProducerThread {
    id: number | string;
    name: string;
    farmName: string;
    location: string; // cidade/UF
    lastMessage: string;
    timestamp: string;
    unreadCount: number;
    hasMedia?: boolean;
    hasVoice?: boolean;
    hasEmoji?: boolean;
    pinned?: boolean;
    avatar?: string | null;
    isOnline?: boolean;
  }

  const [farms] = useState<string[]>(['Fazenda Primavera', 'Fazenda Aurora']);
  const [talhoes] = useState<string[]>(['Talhão 1', 'Talhão 2', 'Talhão 3']);
  const [selectedFarm, setSelectedFarm] = useState<string | undefined>('Fazenda Primavera');
  const [selectedTalhao, setSelectedTalhao] = useState<string | undefined>('Talhão 1');

  // Threads de produtores (cards)
  const [producerThreads, setProducerThreads] = useState<ProducerThread[]>([
    {
      id: 1,
      name: 'João Silva',
      farmName: 'Fazenda Primavera',
      location: 'Sorriso/MT',
      lastMessage: 'As análises do solo chegaram. Quando podemos revisar?',
      timestamp: '14:30',
      unreadCount: 2,
      hasMedia: true,
      hasVoice: false,
      hasEmoji: true,
      pinned: true,
      avatar: '/api/placeholder/40/40',
      isOnline: true
    },
    {
      id: 2,
      name: 'Maria Santos',
      farmName: 'Fazenda Aurora',
      location: 'Rio Verde/GO',
      lastMessage: 'Obrigada pelas recomendações de irrigação!',
      timestamp: '12:15',
      unreadCount: 0,
      hasMedia: false,
      hasVoice: true,
      hasEmoji: false,
      pinned: false,
      avatar: '/api/placeholder/40/40',
      isOnline: false
    },
    {
      id: 3,
      name: 'Carlos Oliveira',
      farmName: 'Fazenda Horizonte',
      location: 'Londrina/PR',
      lastMessage: 'Precisamos discutir o controle de pragas urgente',
      timestamp: 'Ontem',
      unreadCount: 5,
      hasMedia: true,
      hasVoice: false,
      hasEmoji: false,
      pinned: false,
      avatar: '/api/placeholder/40/40',
      isOnline: true
    },
    {
      id: 4,
      name: 'Ana Costa',
      farmName: 'Fazenda Vale Verde',
      location: 'Campo Verde/MT',
      lastMessage: 'Os resultados da safra estão excelentes! 📈',
      timestamp: 'Ontem',
      unreadCount: 1,
      hasMedia: false,
      hasVoice: false,
      hasEmoji: true,
      pinned: false,
      avatar: '/api/placeholder/40/40',
      isOnline: false
    }
  ]);

  const filteredAndSortedThreads = React.useMemo(() => {
    // First filter by search query
    let filtered = producerThreads;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = producerThreads.filter(thread => 
        thread.name.toLowerCase().includes(query) ||
        thread.farmName.toLowerCase().includes(query) ||
        thread.location.toLowerCase().includes(query) ||
        thread.lastMessage.toLowerCase().includes(query)
      );
    }
    
    // Then sort by priority
    const score = (t: ProducerThread) => (t.pinned && t.unreadCount > 0 ? 3 : t.unreadCount > 0 ? 2 : t.pinned ? 1 : 0);
    return [...filtered].sort((a, b) => {
      const sA = score(a);
      const sB = score(b);
      if (sA !== sB) return sB - sA;
      return 0; // fallback simples
    });
  }, [producerThreads, searchQuery]);

  // Mensagens da conversa de produtor (mock)
  const initialProducerMessages: ChatMessage[] = [
    { id: 1, sender: 'producer', type: 'text', message: 'Bom dia! Estou vendo algumas manchas amarelas na plantação.', timestamp: '09:15', avatar: '/api/placeholder/40/40' },
    { id: 2, sender: 'consultant', type: 'text', message: 'Bom dia João! Pode me enviar algumas fotos das manchas?', timestamp: '09:18', avatar: '/api/placeholder/40/40' },
    { id: 3, sender: 'producer', type: 'text', message: 'Claro! Segue as fotos:', timestamp: '09:22', avatar: '/api/placeholder/40/40' },
    { id: 4, sender: 'consultant', type: 'text', message: 'Pelas fotos, parece ser deficiência de potássio. Vou preparar um plano de adubação.', timestamp: '09:30', avatar: '/api/placeholder/40/40' }
  ];
  const [prodMessages, setProdMessages] = useState<ChatMessage[]>(initialProducerMessages);

  // Ref para auto-scroll no final da lista de mensagens
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [isAiTyping /* indicador */, aiMessages, prodMessages /* rolar ao mudar mensagens */]);

  const handleChatSelect = (chat: any) => {
    setSelectedChat(chat);
    setViewMode('conversation');
  };
  const handleBackToList = () => {
    setViewMode('list');
    setSelectedChat(null);
  };

  const handleAiChatStart = () => {
    setSelectedChat({
      id: 'ai-assistant',
      name: 'I.A ludmila',
      type: 'ai',
      avatar: null
    });
    setViewMode('conversation');
  };

  const getSourceLabel = (source: string) => {
    const labels = {
      'local': 'Documentos Técnicos',
      'general': 'Conhecimento Geral',
      'agro-responde': 'Agro Responde',
      'clima-embrapa': 'Embrapa Clima',
      'produtos': 'Base de Produtos',
      'biologicos': 'Controle Biológico',
      'smart-solo': 'Smart Solo',
      'external': 'Fonte Externa',
      'error': 'Sistema'
    };
    return labels[source as keyof typeof labels] || 'Fonte Externa';
  };

  const handleSendAiMessage = async () => {
    if (!message.trim()) return;

    const now = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const userMessage = {
      id: Date.now(),
      sender: 'user' as const,
      message: message.trim(),
      timestamp: now,
      type: 'text' as const,
    };

    // Adiciona a mensagem do usuário e limpa input
    setAiMessages(prev => [...prev, userMessage]);
    setMessage('');
    setIsAiTyping(true);

    try {
      const { data, error } = await sb.functions.invoke('ai-chat', {
        body: { 
          message: userMessage.message,
          correlation_id: crypto.randomUUID()
        },
      });

      if (error) {
        console.error('ai-chat error:', error);
        setAiMessages(prev => [
          ...prev,
          {
            id: Date.now() + 1,
            sender: 'ai',
            type: 'text',
            message: 'Desculpe, houve um problema temporário. Nossa I.A está sendo melhorada constantemente. Tente novamente em instantes.',
            source: 'error',
            timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
        
        toast({
          title: "Erro temporário",
          description: "Tente novamente em alguns instantes",
          variant: "destructive",
          duration: 4000,
        });
        return;
      }

      const answer: string | undefined = data?.answer;
      const source: SourceType | undefined = data?.source || 'general';

      setAiMessages(prev => [
        ...prev,
        {
          id: Date.now() + 2,
          sender: 'ai',
          type: 'text',
          message: answer || 'Não foi possível responder no momento.',
          source: source,
          timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);

      // Toast sutil quando resposta vier de fonte externa
      if (source && !['local', 'general'].includes(source)) {
        toast({
          title: "Fonte externa consultada",
          description: `Resposta baseada em ${getSourceLabel(source)}`,
          duration: 3000,
        });
      }
    } catch (e) {
      console.error('invoke(ai-chat) exception:', e);
      setAiMessages(prev => [
        ...prev,
        {
          id: Date.now() + 3,
          sender: 'ai',
          type: 'text',
          message: 'Desculpe, houve um problema temporário. Tente novamente em instantes.',
          source: 'error',
          timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      
      toast({
        title: "Erro de conexão",
        description: "Verifique sua internet e tente novamente",
        variant: "destructive",
        duration: 4000,
      });
    } finally {
      setIsAiTyping(false);
    }
  };

  const quickTopics = ['Pragas','Adubação','Doenças','Irrigação','Solo'];

  const handleQuickAsk = (topic: string) => {
    setMessage(topic);
    setTimeout(() => handleSendAiMessage(), 0);
  };

  const handleAiPhotoClick = async () => {
    try {
      const dataUrl = await CameraService.takePhoto();
      const now = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      setAiMessages(prev => [
        ...prev,
        { id: Date.now(), sender: 'user', type: 'image', url: dataUrl, timestamp: now },
      ]);
      setIsAiTyping(true);
      setTimeout(() => {
        setAiMessages(prev => [
          ...prev,
          { id: Date.now() + 1, sender: 'ai', type: 'ai', message: 'Recebi a imagem. A análise com Google Vision será ativada em breve.', timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) },
        ]);
        setIsAiTyping(false);
      }, 1000);
    } catch (e: any) {
      toast({ title: 'Câmera', description: e?.message ?? 'Não foi possível capturar a foto.', variant: 'destructive' });
    }
  };

  // Pin toggle
  const handleTogglePin = (id: ProducerThread['id']) => {
    setProducerThreads(prev => prev.map(t => (t.id === id ? { ...t, pinned: !t.pinned } : t)));
  };

  // Voice recorder
  const { isRecording, audioUrl, start, stop, reset } = useVoiceRecorder();
  useEffect(() => {
    if (audioUrl) {
      setProdMessages(prev => [
        ...prev,
        {
          id: Date.now(),
          sender: 'user',
          type: 'audio',
          url: audioUrl,
          timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }
  }, [audioUrl]);

  const onRecordClick = async () => {
    try {
      if (!isRecording) {
        await start();
        toast({ title: 'Gravando…', description: 'Toque novamente para parar.' });
      } else {
        await stop();
        toast({ title: 'Gravação concluída', description: 'Áudio adicionado à conversa.' });
      }
    } catch (e: any) {
      toast({ title: 'Erro ao gravar', description: e?.message ?? 'Permita o uso do microfone', variant: 'destructive' });
    }
  };

  // Quick actions
  const addSystemMessage = (text: string, type: MessageType = 'system', url?: string) => {
    setProdMessages(prev => [
      ...prev,
      {
        id: Date.now(),
        sender: 'system',
        type,
        message: text,
        url,
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  const handleWeather = () => {
    addSystemMessage(`Clima para ${selectedFarm}${selectedTalhao ? ' • ' + selectedTalhao : ''}: ☀️ 30°C, vento 8km/h, 10% chuva`, 'weather');
  };
  const handleNews = () => {
    addSystemMessage('AgroNews: 1) Safra de soja em alta 2) Exportações crescem 3) Insumos com leve queda', 'news');
  };
  const handleDollar = () => {
    addSystemMessage('Dólar hoje: R$ 5,12 (▲ 0,20%)', 'finance');
  };
  const handleDefensivos = () => {
    addSystemMessage('Aplicações da semana: 1) Fungicida x 2) Inseticida y 3) Nutrição foliar z', 'defensivo');
  };
  const handleNdvi = () => {
    addSystemMessage('NDVI gerado para a área selecionada', 'ndvi', '/placeholder.svg');
  };
  const handleAttachImage = (file: File) => {
    const url = URL.createObjectURL(file);
    setProdMessages(prev => [
      ...prev,
      { id: Date.now(), sender: 'user', type: 'image', url, timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) },
    ]);
    toast({ title: 'Imagem anexada', description: 'Pré-visualização adicionada ao chat.' });
  };

  const renderChatList = () => <div className="flex-1 bg-background">
      {/* Filter Section */}
      <div className="p-4 bg-card border-b border-border">
        <div className="flex rounded-lg bg-muted p-1">
          <button
            onClick={() => setChatFilter('producer')}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${
              chatFilter === 'producer'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <User className="h-4 w-4" />
            {chatFilter === 'producer' && <span>Produtor</span>}
          </button>
          
          <button
            onClick={() => setChatFilter('agenda')}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${
              chatFilter === 'agenda'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Calendar className="h-4 w-4" />
            {chatFilter === 'agenda' && <span>Agenda</span>}
          </button>
          
          <button
            onClick={() => setChatFilter('ai')}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${
              chatFilter === 'ai'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <IALudmilaIcon className="h-4 w-4" />
            {chatFilter === 'ai' && <span>IA</span>}
          </button>
          
          <button
            onClick={() => setChatFilter('live-field')}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${
              chatFilter === 'live-field'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Radio className="h-4 w-4" />
            {chatFilter === 'live-field' && <span>Campo</span>}
          </button>
        </div>
      </div>

      {/* Search Bar for Producer Filter */}
      {chatFilter === 'producer' && (
        <div className="px-4 pb-3">
          <SearchBar
            placeholder="Buscar conversas..."
            value={searchQuery}
            onChange={setSearchQuery}
          />
        </div>
      )}

      {/* Chat Cards */}
      <div className="flex-1 overflow-y-auto">
        {chatFilter === 'producer' && (
            filteredAndSortedThreads.length === 0 ? (
              <div className="p-6 text-center">
                <div className="text-muted-foreground">
                  {searchQuery ? 'Nenhum resultado encontrado' : 'Nenhuma conversa'}
                </div>
                {searchQuery && (
                  <div className="text-sm text-muted-foreground mt-1">
                    Tente buscar por nome, fazenda ou localização
                  </div>
                )}
              </div>
            ) : (
              <div className="px-3 pb-4">
                {filteredAndSortedThreads.map((chat) => (
                  <ProducerChatCard
                    key={chat.id}
                    chat={chat}
                    onClick={handleChatSelect}
                    onTogglePin={handleTogglePin}
                  />
                ))}
              </div>
            )
          )}
        
        
        {chatFilter === 'ai' && <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <IALudmilaIcon className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">
                I.A ludmila
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Tire suas dúvidas técnicas sobre cultivos, pragas, doenças e muito mais
              </p>
              <Button onClick={handleAiChatStart} className="bg-primary hover:bg-primary/90">
                <IALudmilaIcon className="h-4 w-4 mr-2" />
                Iniciar Conversa
              </Button>
            </div>
          </div>}

        {chatFilter !== 'producer' && chatFilter !== 'ai' && <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">
                {chatFilter === 'agenda' && 'Nenhuma conversa agendada'}
                {chatFilter === 'live-field' && 'Nenhum campo ativo'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {chatFilter === 'agenda' && 'Suas conversas agendadas aparecerão aqui'}
                {chatFilter === 'live-field' && 'Monitoramento em tempo real aparecerá aqui'}
              </p>
            </div>
          </div>}
      </div>
    </div>;
  const renderConversation = () => {
    const isAiChat = selectedChat?.type === 'ai';
    const messages = isAiChat ? aiMessages : prodMessages;
    return <div className="flex-1 min-h-0 flex flex-col bg-background">
        {/* Conversation Header */}
        <div className="sticky top-0 z-30 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 border-b shadow-sm p-4">
          <div className="flex items-center space-x-3">
            <Button onClick={handleBackToList} variant="ghost" size="icon" className="h-9 w-9">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            
            <Avatar className="h-10 w-10">
              {isAiChat ? <AvatarFallback className="bg-primary/10 text-primary">
                  <IALudmilaIcon className="h-5 w-5" />
                </AvatarFallback> : <>
                  <AvatarImage src={selectedChat?.avatar} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {selectedChat?.name.split(' ').map((n: string) => n[0]).join('')}
                  </AvatarFallback>
                </>}
            </Avatar>
            
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <h3 className="font-semibold text-foreground">
                  {selectedChat?.name}
                </h3>
                {isAiChat && <Badge className="text-xs rounded-full bg-success text-success-foreground border-transparent">IA</Badge>}
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-success rounded-full"></div>
                <span className="text-xs text-muted-foreground">
                  {isAiChat ? 'Assistente Online' : 'Online'}
                </span>
              </div>
            </div>
            
            {!isAiChat && <Button variant="ghost" size="icon" className="h-9 w-9">
                <MoreHorizontal className="h-5 w-5" />
              </Button>}
          </div>
        </div>

        {/* Quick Actions (apenas produtor) */}
        {!isAiChat && (
          <QuickActionsBar
            onWeather={handleWeather}
            onNews={handleNews}
            onDollar={handleDollar}
            onDefensivos={handleDefensivos}
            onNdvi={handleNdvi}
            onAttachImage={handleAttachImage}
            onRecordClick={onRecordClick}
            farms={farms}
            talhoes={talhoes}
            selectedFarm={selectedFarm}
            selectedTalhao={selectedTalhao}
            onSelectFarm={setSelectedFarm}
            onSelectTalhao={setSelectedTalhao}
          />
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && isAiChat && <div className="text-center py-8">
              <IALudmilaIcon className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="font-semibold text-foreground mb-2">
                Olá! Sou seu assistente técnico
              </h3>
              <p className="text-sm text-muted-foreground">
                Pergunte sobre cultivos, pragas, doenças ou qualquer dúvida técnica
              </p>
            </div>}
          
          {messages.map(msg => <div key={msg.id} className={`flex ${isAiChat ? msg.sender === 'user' ? 'justify-end' : 'justify-start' : msg.sender === 'consultant' ? 'justify-end' : 'justify-start'}`}>
              <div className="flex items-end space-x-2 max-w-[80%]">
                {(isAiChat && msg.sender === 'ai' || !isAiChat && msg.sender === 'producer') && <Avatar className="h-8 w-8 flex-shrink-0">
                    {isAiChat ? <AvatarFallback className="bg-primary/10 text-primary text-xs">
                        <IALudmilaIcon className="h-4 w-4" />
                      </AvatarFallback> : <>
                        <AvatarImage src={msg.avatar} />
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                          {selectedChat?.name.split(' ').map((n: string) => n[0]).join('')}
                        </AvatarFallback>
                      </>}
                  </Avatar>}
                
                <div className={`rounded-2xl px-4 py-2 shadow-sm transition-all duration-300 hover:shadow-md ${isAiChat && msg.sender === 'user' || !isAiChat && msg.sender === 'consultant' ? 'bg-primary text-primary-foreground rounded-br-sm' : isAiChat && msg.sender === 'ai' ? 'bg-primary/5 border border-primary/20 rounded-bl-sm' : 'bg-card border border-border rounded-bl-sm'}`}>
                  <div className="text-sm">
                    {msg.type === 'image' ? (
                      <img src={msg.url} alt="Imagem enviada" className="rounded-md max-h-48" />
                    ) : msg.type === 'audio' ? (
                      <audio controls src={msg.url} className="w-56" />
                    ) : msg.type === 'ndvi' ? (
                      <div>
                        <img src={msg.url ?? '/placeholder.svg'} alt="NDVI da área" className="rounded-md max-h-48" />
                        <p className="text-[11px] text-muted-foreground mt-1">NDVI • {selectedFarm}{selectedTalhao ? ` • ${selectedTalhao}` : ''}</p>
                      </div>
                    ) : (
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.message}</p>
                    )}
                  </div>
                  <p className={`text-xs mt-2 opacity-70 ${isAiChat && msg.sender === 'user' || !isAiChat && msg.sender === 'consultant' ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                    {msg.timestamp}
                  </p>
                   {/* Source badges with improved styling */}
                  {isAiChat && msg.sender === 'ai' && msg.source && (
                    <div className="mt-3 pt-2 border-t border-border/30">
                      <Badge 
                        variant={
                          msg.source === 'local' ? 'default' : 
                          msg.source === 'general' ? 'secondary' : 
                          msg.source === 'error' ? 'destructive' : 
                          'outline'
                        }
                        className="text-xs font-medium"
                      >
                        {getSourceLabel(msg.source)}
                      </Badge>
                    </div>
                  )}
                </div>

                {(isAiChat && msg.sender === 'user' || !isAiChat && msg.sender === 'consultant') && <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarFallback className="bg-secondary/10 text-secondary text-xs">
                      EU
                    </AvatarFallback>
                  </Avatar>}
              </div>
            </div>)}

          {/* Enhanced AI Typing Indicator */}
          {isAiTyping && (
            <div className="flex justify-start">
              <div className="flex items-end space-x-2 max-w-[80%]">
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                    <IALudmilaIcon className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="bg-primary/5 border border-primary/20 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm animate-in slide-in-from-left-5 duration-300">
                  <div className="flex items-center space-x-3">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <span className="text-sm text-muted-foreground font-medium">I.A Ludmila está pensando...</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* âncora para auto-scroll */}
          <div ref={messagesEndRef} />
        </div>

        {isAiChat && (
          <div className="px-4 pt-2 -mb-2 overflow-x-auto no-scrollbar">
            <div className="flex gap-2">
              {quickTopics.map((t) => (
                <Button key={t} size="sm" variant="secondary" className="rounded-full" onClick={() => handleQuickAsk(t)}>
                  {t}
                </Button>
              ))}
            </div>
          </div>
        )}

        {isAiChat && (
          <Button onClick={handleAiPhotoClick} size="icon" className="fixed bottom-24 right-4 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-ios-lg">
            <Camera className="h-6 w-6" />
          </Button>
        )}

        {/* Message Input */}
        <div className="p-4 bg-card border-t border-border">
          <div className="flex items-end space-x-2">
            <div className="flex space-x-1">
              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full">
                <Camera className="h-5 w-5" />
              </Button>
              {!isAiChat && <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full">
                  <Smile className="h-5 w-5" />
                </Button>}
            </div>
            
            <div className="flex-1 relative">
              {isAiChat ? <Textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Digite sua pergunta técnica..." className="min-h-[48px] max-h-32 resize-none rounded-2xl border-border focus:ring-2 focus:ring-primary pr-12" onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendAiMessage();
              }
            }} /> : <Input value={message} onChange={e => setMessage(e.target.value)} placeholder="Digite uma mensagem..." className="pr-12 h-12 rounded-full border-border focus:ring-2 focus:ring-primary" />}
              <Button variant="ghost" size="icon" className="absolute right-1 top-1 h-10 w-10 rounded-full">
                <Mic className="h-5 w-5" />
              </Button>
            </div>
            
            <Button size="icon" className="h-12 w-12 rounded-full bg-primary hover:bg-primary/90 shadow-ios-button" disabled={!message.trim() || isAiTyping} onClick={isAiChat ? handleSendAiMessage : undefined}>
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>;
  };

  const location = useLocation();
  const isMapTab = new URLSearchParams(location.search).get('tab') === 'map';

  if (isMapTab) {
    return <TechnicalMapPanel />;
  }

  return <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        
        
        {/* Sync Indicator */}
        <SyncIndicator />
      </div>

      {/* Content */}
      {viewMode === 'list' ? renderChatList() : renderConversation()}
    </div>;
};

export default Dashboard;
