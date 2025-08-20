-- Atualizar os dados fictícios para um user_id que você pode usar para teste
-- Primeiro, vamos limpar os dados existentes e recriar com um approach diferente

-- Deletar dados fictícios anteriores
DELETE FROM messages WHERE conversation_id IN (
  SELECT id FROM conversations WHERE user_id = '11111111-1111-1111-1111-111111111111'
);
DELETE FROM conversations WHERE user_id = '11111111-1111-1111-1111-111111111111';
DELETE FROM producers WHERE user_id = '11111111-1111-1111-1111-111111111111';
DELETE FROM user_preferences WHERE user_id = '11111111-1111-1111-1111-111111111111';

-- Criar um user_id para demonstração que você pode usar
-- Você pode substituir este UUID pelo seu user_id real após fazer login
DO $$
DECLARE
    demo_user_id uuid := 'demo-user-1111-1111-1111-111111111111';
BEGIN
    -- Inserir produtores fictícios brasileiros
    INSERT INTO producers (id, name, farm_name, location, avatar_url, phone, email, is_online, last_seen, user_id) VALUES
      (gen_random_uuid(), 'João Silva', 'Fazenda Esperança', 'Sorriso - MT', 'https://ui-avatars.com/api/?name=João+Silva&background=22c55e&color=fff', '(65) 99123-4567', 'joao@esperanca.com.br', true, null, demo_user_id),
      (gen_random_uuid(), 'Maria Santos', 'Sítio Bela Vista', 'Ribeirão Preto - SP', 'https://ui-avatars.com/api/?name=Maria+Santos&background=3b82f6&color=fff', '(16) 98765-4321', 'maria@belavista.com.br', false, now() - interval '2 hours', demo_user_id),
      (gen_random_uuid(), 'Carlos Oliveira', 'Agropecuária Futuro', 'Rio Verde - GO', 'https://ui-avatars.com/api/?name=Carlos+Oliveira&background=f59e0b&color=fff', '(64) 99555-7777', 'carlos@futuro.agr.br', true, null, demo_user_id),
      (gen_random_uuid(), 'Ana Costa', 'Fazenda Verde Ltda', 'Dourados - MS', 'https://ui-avatars.com/api/?name=Ana+Costa&background=ef4444&color=fff', '(67) 98888-1111', 'ana@verde.com.br', false, now() - interval '1 day', demo_user_id),
      (gen_random_uuid(), 'Pedro Almeida', 'Sítio São José', 'Uberlândia - MG', 'https://ui-avatars.com/api/?name=Pedro+Almeida&background=8b5cf6&color=fff', '(34) 97777-2222', 'pedro@saojoze.com.br', true, null, demo_user_id),
      (gen_random_uuid(), 'Lucia Ferreira', 'Fazenda Progresso', 'Barreiras - BA', 'https://ui-avatars.com/api/?name=Lucia+Ferreira&background=ec4899&color=fff', '(77) 96666-3333', 'lucia@progresso.agr.br', false, now() - interval '30 minutes', demo_user_id),
      (gen_random_uuid(), 'Roberto Lima', 'Agro Lima', 'Palmas - TO', 'https://ui-avatars.com/api/?name=Roberto+Lima&background=06b6d4&color=fff', '(63) 95555-4444', 'roberto@agrolima.com.br', true, null, demo_user_id),
      (gen_random_uuid(), 'Fernanda Rocha', 'Fazenda Horizonte', 'Campo Grande - MS', 'https://ui-avatars.com/api/?name=Fernanda+Rocha&background=84cc16&color=fff', '(67) 94444-5555', 'fernanda@horizonte.com.br', false, now() - interval '6 hours', demo_user_id),
      (gen_random_uuid(), 'Ricardo Souza', 'Estância Real', 'Londrina - PR', 'https://ui-avatars.com/api/?name=Ricardo+Souza&background=f97316&color=fff', '(43) 93333-6666', 'ricardo@real.agr.br', true, null, demo_user_id),
      (gen_random_uuid(), 'Claudia Martins', 'Fazenda Esperança Nova', 'Cascavel - PR', 'https://ui-avatars.com/api/?name=Claudia+Martins&background=6366f1&color=fff', '(45) 92222-7777', 'claudia@esperancanova.com.br', false, now() - interval '3 hours', demo_user_id);

    -- Criar conversas
    INSERT INTO conversations (id, user_id, producer_id, title, is_pinned, unread_count, last_message_at, created_at)
    SELECT 
      gen_random_uuid(),
      demo_user_id,
      p.id,
      'Conversa com ' || p.name,
      CASE 
        WHEN p.name IN ('João Silva', 'Maria Santos', 'Carlos Oliveira') THEN true
        ELSE false
      END,
      CASE 
        WHEN p.name = 'Maria Santos' THEN 12
        WHEN p.name = 'João Silva' THEN 2
        WHEN p.name = 'Lucia Ferreira' THEN 5
        ELSE 0
      END,
      now() - interval '30 minutes',
      now() - interval '1 month'
    FROM producers p 
    WHERE p.user_id = demo_user_id;

    -- Inserir mensagens
    INSERT INTO messages (id, conversation_id, sender_type, sender_id, content, message_type, status, is_read, metadata, created_at)
    SELECT 
      gen_random_uuid(),
      c.id,
      'producer',
      null,
      CASE 
        WHEN p.name = 'João Silva' THEN 'Colheita da soja chegou a 3.200 kg/ha!'
        WHEN p.name = 'Maria Santos' THEN 'Preciso de ajuda com irrigação'
        WHEN p.name = 'Carlos Oliveira' THEN 'Enviou uma foto'
        ELSE 'Olá! Como está?'
      END,
      'text',
      'sent',
      false,
      '{}',
      now() - interval '30 minutes'
    FROM conversations c 
    JOIN producers p ON c.producer_id = p.id 
    WHERE c.user_id = demo_user_id;

    -- Inserir preferências
    INSERT INTO user_preferences (user_id, chat_density) 
    VALUES (demo_user_id, 'comfortable')
    ON CONFLICT (user_id) DO UPDATE SET chat_density = 'comfortable';

END $$;