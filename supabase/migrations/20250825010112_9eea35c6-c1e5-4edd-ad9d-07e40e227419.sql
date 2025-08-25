-- FASE 1.1: REMOVER POLÍTICAS PÚBLICAS PERIGOSAS
-- Remover políticas que expõem dados publicamente

-- Remover política pública de conversas
DROP POLICY IF EXISTS "Demo - Allow public read conversations" ON conversations;

-- Remover política pública de mensagens  
DROP POLICY IF EXISTS "Demo - Allow public read messages" ON messages;

-- Remover política pública de produtores
DROP POLICY IF EXISTS "Demo - Allow public read producers" ON producers;

-- Remover política pública de preferências de usuário
DROP POLICY IF EXISTS "Demo - Allow public read user_preferences" ON user_preferences;

-- FASE 1.3: IMPLEMENTAR PROTEÇÃO RLS COMPLETA
-- Adicionar RLS para tabelas desprotegidas

-- Habilitar RLS nas tabelas documents e document_chunks
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;

-- Criar políticas seguras para documents (assumindo que documentos pertencem a usuários)
CREATE POLICY "Users can view their own documents" 
ON documents 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert their own documents" 
ON documents 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own documents" 
ON documents 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete their own documents" 
ON documents 
FOR DELETE 
USING (auth.uid() IS NOT NULL);

-- Criar políticas seguras para document_chunks (vinculadas aos documentos)
CREATE POLICY "Users can view document chunks for their documents" 
ON document_chunks 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM documents 
    WHERE documents.id = document_chunks.document_id 
    AND auth.uid() IS NOT NULL
  )
);

CREATE POLICY "Users can insert document chunks for their documents" 
ON document_chunks 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM documents 
    WHERE documents.id = document_chunks.document_id 
    AND auth.uid() IS NOT NULL
  )
);

CREATE POLICY "Users can update document chunks for their documents" 
ON document_chunks 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM documents 
    WHERE documents.id = document_chunks.document_id 
    AND auth.uid() IS NOT NULL
  )
);

CREATE POLICY "Users can delete document chunks for their documents" 
ON document_chunks 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM documents 
    WHERE documents.id = document_chunks.document_id 
    AND auth.uid() IS NOT NULL
  )
);

-- MONITORAMENTO: Criar tabela para logs de segurança
CREATE TABLE IF NOT EXISTS security_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  event_type TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS na tabela de logs de segurança
ALTER TABLE security_logs ENABLE ROW LEVEL SECURITY;

-- Política para permitir inserção de logs (sistema)
CREATE POLICY "System can insert security logs" 
ON security_logs 
FOR INSERT 
WITH CHECK (true);

-- Política para usuários verem apenas seus próprios logs
CREATE POLICY "Users can view their own security logs" 
ON security_logs 
FOR SELECT 
USING (auth.uid() = user_id);