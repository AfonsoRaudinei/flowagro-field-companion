-- Criar estrutura para produtores e conversas reais
CREATE TABLE public.producers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  farm_name TEXT NOT NULL,
  location TEXT,
  avatar_url TEXT,
  phone TEXT,
  email TEXT,
  is_online BOOLEAN DEFAULT false,
  last_seen TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de conversas
CREATE TABLE public.conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  producer_id UUID NOT NULL REFERENCES public.producers(id) ON DELETE CASCADE,
  title TEXT,
  is_pinned BOOLEAN DEFAULT false,
  unread_count INTEGER DEFAULT 0,
  last_message_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de mensagens
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('user', 'producer', 'ai')),
  sender_id UUID,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'audio', 'image', 'file')),
  metadata JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.producers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Policies para produtores
CREATE POLICY "Users can view their producers" 
ON public.producers 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create producers" 
ON public.producers 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their producers" 
ON public.producers 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Policies para conversas
CREATE POLICY "Users can view their conversations" 
ON public.conversations 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create conversations" 
ON public.conversations 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their conversations" 
ON public.conversations 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Policies para mensagens
CREATE POLICY "Users can view messages from their conversations" 
ON public.messages 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.conversations 
    WHERE conversations.id = messages.conversation_id 
    AND conversations.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create messages in their conversations" 
ON public.messages 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.conversations 
    WHERE conversations.id = messages.conversation_id 
    AND conversations.user_id = auth.uid()
  )
);

-- Triggers para updated_at
CREATE TRIGGER update_producers_updated_at
BEFORE UPDATE ON public.producers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at
BEFORE UPDATE ON public.conversations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir dados de teste
INSERT INTO public.producers (user_id, name, farm_name, location, is_online, phone, email) VALUES
(gen_random_uuid(), 'Carlos Silva', 'Fazenda Boa Vista', 'Ribeirão Preto, SP', true, '(16) 99999-1234', 'carlos@fazendaboavista.com.br'),
(gen_random_uuid(), 'Maria Santos', 'Sítio Esperança', 'Uberlândia, MG', false, '(34) 98888-5678', 'maria@sitioesp.com.br'),
(gen_random_uuid(), 'João Oliveira', 'Agro Futuro', 'Goiânia, GO', true, '(62) 97777-9012', 'joao@agrofuturo.com.br'),
(gen_random_uuid(), 'Ana Costa', 'Fazenda Verde', 'Campo Grande, MS', false, '(67) 96666-3456', 'ana@fazendaverde.com.br'),
(gen_random_uuid(), 'Pedro Mendes', 'Granja São José', 'Londrina, PR', true, '(43) 95555-7890', 'pedro@granjasj.com.br');