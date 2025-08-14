-- Adicionar policies DELETE que estão faltando
CREATE POLICY "Users can delete their producers" 
ON public.producers 
FOR DELETE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their conversations" 
ON public.conversations 
FOR DELETE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete messages from their conversations" 
ON public.messages 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.conversations 
    WHERE conversations.id = messages.conversation_id 
    AND conversations.user_id = auth.uid()
  )
);

-- Atualizar policies UPDATE que estão faltando para messages
CREATE POLICY "Users can update messages in their conversations" 
ON public.messages 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.conversations 
    WHERE conversations.id = messages.conversation_id 
    AND conversations.user_id = auth.uid()
  )
);