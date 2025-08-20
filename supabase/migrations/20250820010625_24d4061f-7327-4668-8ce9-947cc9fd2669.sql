-- Inserir produtores fictícios brasileiros
INSERT INTO producers (id, name, farm_name, location, avatar_url, phone, email, is_online, last_seen, user_id) VALUES
  (gen_random_uuid(), 'João Silva', 'Fazenda Esperança', 'Sorriso - MT', 'https://ui-avatars.com/api/?name=João+Silva&background=22c55e&color=fff', '(65) 99123-4567', 'joao@esperanca.com.br', true, null, auth.uid()),
  (gen_random_uuid(), 'Maria Santos', 'Sítio Bela Vista', 'Ribeirão Preto - SP', 'https://ui-avatars.com/api/?name=Maria+Santos&background=3b82f6&color=fff', '(16) 98765-4321', 'maria@belavista.com.br', false, now() - interval '2 hours', auth.uid()),
  (gen_random_uuid(), 'Carlos Oliveira', 'Agropecuária Futuro', 'Rio Verde - GO', 'https://ui-avatars.com/api/?name=Carlos+Oliveira&background=f59e0b&color=fff', '(64) 99555-7777', 'carlos@futuro.agr.br', true, null, auth.uid()),
  (gen_random_uuid(), 'Ana Costa', 'Fazenda Verde Ltda', 'Dourados - MS', 'https://ui-avatars.com/api/?name=Ana+Costa&background=ef4444&color=fff', '(67) 98888-1111', 'ana@verde.com.br', false, now() - interval '1 day', auth.uid()),
  (gen_random_uuid(), 'Pedro Almeida', 'Sítio São José', 'Uberlândia - MG', 'https://ui-avatars.com/api/?name=Pedro+Almeida&background=8b5cf6&color=fff', '(34) 97777-2222', 'pedro@saojoze.com.br', true, null, auth.uid()),
  (gen_random_uuid(), 'Lucia Ferreira', 'Fazenda Progresso', 'Barreiras - BA', 'https://ui-avatars.com/api/?name=Lucia+Ferreira&background=ec4899&color=fff', '(77) 96666-3333', 'lucia@progresso.agr.br', false, now() - interval '30 minutes', auth.uid()),
  (gen_random_uuid(), 'Roberto Lima', 'Agro Lima', 'Palmas - TO', 'https://ui-avatars.com/api/?name=Roberto+Lima&background=06b6d4&color=fff', '(63) 95555-4444', 'roberto@agrolima.com.br', true, null, auth.uid()),
  (gen_random_uuid(), 'Fernanda Rocha', 'Fazenda Horizonte', 'Campo Grande - MS', 'https://ui-avatars.com/api/?name=Fernanda+Rocha&background=84cc16&color=fff', '(67) 94444-5555', 'fernanda@horizonte.com.br', false, now() - interval '6 hours', auth.uid()),
  (gen_random_uuid(), 'Ricardo Souza', 'Estância Real', 'Londrina - PR', 'https://ui-avatars.com/api/?name=Ricardo+Souza&background=f97316&color=fff', '(43) 93333-6666', 'ricardo@real.agr.br', true, null, auth.uid()),
  (gen_random_uuid(), 'Claudia Martins', 'Fazenda Esperança Nova', 'Cascavel - PR', 'https://ui-avatars.com/api/?name=Claudia+Martins&background=6366f1&color=fff', '(45) 92222-7777', 'claudia@esperancanova.com.br', false, now() - interval '3 hours', auth.uid()),
  (gen_random_uuid(), 'José Carlos', 'Sítio Boa Sorte', 'Itaberaí - GO', 'https://ui-avatars.com/api/?name=José+Carlos&background=14b8a6&color=fff', '(62) 91111-8888', 'jose@boasorte.com.br', true, null, auth.uid()),
  (gen_random_uuid(), 'Mariana Silva', 'Fazenda Vista Alegre', 'Mineiros - GO', 'https://ui-avatars.com/api/?name=Mariana+Silva&background=f43f5e&color=fff', '(64) 99999-1234', 'mariana@vistaalegre.agr.br', false, now() - interval '45 minutes', auth.uid()),
  (gen_random_uuid(), 'Antonio Pereira', 'Agropecuária Pereira', 'Rondonópolis - MT', 'https://ui-avatars.com/api/?name=Antonio+Pereira&background=a855f7&color=fff', '(65) 98888-9999', 'antonio@pereira.agr.br', true, null, auth.uid()),
  (gen_random_uuid(), 'Beatriz Alves', 'Fazenda Três Irmãos', 'Primavera do Leste - MT', 'https://ui-avatars.com/api/?name=Beatriz+Alves&background=22d3ee&color=fff', '(66) 97777-0000', 'beatriz@tresirmaos.com.br', false, now() - interval '2 days', auth.uid()),
  (gen_random_uuid(), 'Marcos Vieira', 'Sítio Recanto Verde', 'Jataí - GO', 'https://ui-avatars.com/api/?name=Marcos+Vieira&background=eab308&color=fff', '(64) 96666-1111', 'marcos@recantoverde.com.br', true, null, auth.uid());

-- Criar conversas com timestamps escalonados
WITH producer_data AS (
  SELECT id, name, farm_name FROM producers WHERE user_id = auth.uid()
)
INSERT INTO conversations (id, user_id, producer_id, title, is_pinned, unread_count, last_message_at, created_at)
SELECT 
  gen_random_uuid(),
  auth.uid(),
  pd.id,
  'Conversa com ' || pd.name,
  CASE 
    WHEN pd.name IN ('João Silva', 'Maria Santos', 'Carlos Oliveira') THEN true
    ELSE false
  END,
  CASE 
    WHEN pd.name = 'Maria Santos' THEN 12
    WHEN pd.name = 'João Silva' THEN 2
    WHEN pd.name = 'Lucia Ferreira' THEN 5
    WHEN pd.name = 'Fernanda Rocha' THEN 1
    WHEN pd.name = 'Claudia Martins' THEN 3
    ELSE 0
  END,
  CASE 
    WHEN pd.name = 'João Silva' THEN now() - interval '10 minutes'
    WHEN pd.name = 'Maria Santos' THEN now() - interval '30 minutes'
    WHEN pd.name = 'Carlos Oliveira' THEN now() - interval '1 hour'
    WHEN pd.name = 'Ana Costa' THEN now() - interval '2 hours'
    WHEN pd.name = 'Pedro Almeida' THEN now() - interval '4 hours'
    WHEN pd.name = 'Lucia Ferreira' THEN now() - interval '6 hours'
    WHEN pd.name = 'Roberto Lima' THEN now() - interval '8 hours'
    WHEN pd.name = 'Fernanda Rocha' THEN now() - interval '12 hours'
    WHEN pd.name = 'Ricardo Souza' THEN now() - interval '1 day'
    WHEN pd.name = 'Claudia Martins' THEN now() - interval '2 days'
    WHEN pd.name = 'José Carlos' THEN now() - interval '3 days'
    WHEN pd.name = 'Mariana Silva' THEN now() - interval '4 days'
    WHEN pd.name = 'Antonio Pereira' THEN now() - interval '1 week'
    WHEN pd.name = 'Beatriz Alves' THEN now() - interval '2 weeks'
    ELSE now() - interval '1 month'
  END,
  now() - interval '1 month'
FROM producer_data pd;

-- Inserir mensagens variadas com diferentes tipos e status
WITH conversation_data AS (
  SELECT c.id as conv_id, p.name as producer_name 
  FROM conversations c 
  JOIN producers p ON c.producer_id = p.id 
  WHERE c.user_id = auth.uid()
)
INSERT INTO messages (id, conversation_id, sender_type, sender_id, content, message_type, status, is_read, metadata, created_at)
SELECT 
  gen_random_uuid(),
  cd.conv_id,
  'producer',
  null,
  CASE 
    WHEN cd.producer_name = 'João Silva' THEN 'Colheita da soja chegou a 3.200 kg/ha! Estou muito satisfeito com os resultados.'
    WHEN cd.producer_name = 'Maria Santos' THEN 'Preciso de ajuda urgente com problema na irrigação'
    WHEN cd.producer_name = 'Carlos Oliveira' THEN 'Enviou uma foto'
    WHEN cd.producer_name = 'Ana Costa' THEN 'Compartilhou documento'
    WHEN cd.producer_name = 'Pedro Almeida' THEN 'Boa tarde! Como está o cronograma de plantio para próxima temporada?'
    WHEN cd.producer_name = 'Lucia Ferreira' THEN 'Mensagem de voz'
    WHEN cd.producer_name = 'Roberto Lima' THEN 'Compartilhou localização'
    WHEN cd.producer_name = 'Fernanda Rocha' THEN 'Obrigada pela consultoria técnica. Foi muito esclarecedora!'
    WHEN cd.producer_name = 'Ricardo Souza' THEN 'Enviou uma foto'
    WHEN cd.producer_name = 'Claudia Martins' THEN 'Quando poderemos marcar uma visita técnica?'
    WHEN cd.producer_name = 'José Carlos' THEN 'Análise do solo chegou. Precisamos conversar sobre os resultados.'
    WHEN cd.producer_name = 'Mariana Silva' THEN 'Mensagem de voz'
    WHEN cd.producer_name = 'Antonio Pereira' THEN 'Compartilhou documento'
    WHEN cd.producer_name = 'Beatriz Alves' THEN 'Bom dia! Preciso de orientação sobre pragas na soja.'
    ELSE 'Olá! Tudo bem?'
  END,
  CASE 
    WHEN cd.producer_name IN ('Carlos Oliveira', 'Ricardo Souza') THEN 'image'
    WHEN cd.producer_name IN ('Lucia Ferreira', 'Mariana Silva') THEN 'audio'
    WHEN cd.producer_name IN ('Ana Costa', 'Antonio Pereira') THEN 'file'
    WHEN cd.producer_name = 'Roberto Lima' THEN 'location'
    ELSE 'text'
  END,
  CASE 
    WHEN cd.producer_name IN ('João Silva', 'Ana Costa', 'Pedro Almeida', 'Roberto Lima', 'Ricardo Souza', 'José Carlos', 'Antonio Pereira', 'Beatriz Alves') THEN 'read'
    WHEN cd.producer_name IN ('Carlos Oliveira', 'Fernanda Rocha', 'Mariana Silva') THEN 'delivered'
    ELSE 'sent'
  END,
  CASE 
    WHEN cd.producer_name IN ('Maria Santos', 'Lucia Ferreira', 'Fernanda Rocha', 'Claudia Martins') THEN false
    ELSE true
  END,
  CASE 
    WHEN cd.producer_name = 'Lucia Ferreira' THEN '{"duration": 45, "waveform": [0.2, 0.5, 0.8, 0.3, 0.7]}'::jsonb
    WHEN cd.producer_name = 'Mariana Silva' THEN '{"duration": 23, "waveform": [0.4, 0.6, 0.9, 0.2, 0.5]}'::jsonb
    WHEN cd.producer_name = 'Carlos Oliveira' THEN '{"filename": "plantacao_milho.jpg", "size": 2048576}'::jsonb
    WHEN cd.producer_name = 'Ricardo Souza' THEN '{"filename": "gado_pasto.jpg", "size": 1536000}'::jsonb
    WHEN cd.producer_name = 'Ana Costa' THEN '{"filename": "Relatório_Análise_Solo_2024.pdf", "size": 5242880}'::jsonb
    WHEN cd.producer_name = 'Antonio Pereira' THEN '{"filename": "Plano_Safra_2025.docx", "size": 1048576}'::jsonb
    WHEN cd.producer_name = 'Roberto Lima' THEN '{"latitude": -15.7801, "longitude": -47.9292, "address": "Fazenda Modelo, Brasília - DF"}'::jsonb
    ELSE '{}'::jsonb
  END,
  CASE 
    WHEN cd.producer_name = 'João Silva' THEN now() - interval '10 minutes'
    WHEN cd.producer_name = 'Maria Santos' THEN now() - interval '30 minutes'
    WHEN cd.producer_name = 'Carlos Oliveira' THEN now() - interval '1 hour'
    WHEN cd.producer_name = 'Ana Costa' THEN now() - interval '2 hours'
    WHEN cd.producer_name = 'Pedro Almeida' THEN now() - interval '4 hours'
    WHEN cd.producer_name = 'Lucia Ferreira' THEN now() - interval '6 hours'
    WHEN cd.producer_name = 'Roberto Lima' THEN now() - interval '8 hours'
    WHEN cd.producer_name = 'Fernanda Rocha' THEN now() - interval '12 hours'
    WHEN cd.producer_name = 'Ricardo Souza' THEN now() - interval '1 day'
    WHEN cd.producer_name = 'Claudia Martins' THEN now() - interval '2 days'
    WHEN cd.producer_name = 'José Carlos' THEN now() - interval '3 days'
    WHEN cd.producer_name = 'Mariana Silva' THEN now() - interval '4 days'
    WHEN cd.producer_name = 'Antonio Pereira' THEN now() - interval '1 week'
    WHEN cd.producer_name = 'Beatriz Alves' THEN now() - interval '2 weeks'
    ELSE now() - interval '1 month'
  END
FROM conversation_data cd;

-- Inserir preferência de densidade padrão
INSERT INTO user_preferences (user_id, chat_density) 
VALUES (auth.uid(), 'comfortable')
ON CONFLICT (user_id) DO UPDATE SET chat_density = 'comfortable';