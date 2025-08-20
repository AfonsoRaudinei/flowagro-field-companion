-- Usar um UUID válido e criar dados de demonstração
DO $$
DECLARE
    demo_user_id uuid := '11111111-1111-1111-1111-111111111111'::uuid;
BEGIN
    -- Inserir produtores fictícios brasileiros
    INSERT INTO producers (id, name, farm_name, location, avatar_url, phone, email, is_online, last_seen, user_id) VALUES
      (gen_random_uuid(), 'João Silva', 'Fazenda Esperança', 'Sorriso - MT', 'https://ui-avatars.com/api/?name=João+Silva&background=22c55e&color=fff', '(65) 99123-4567', 'joao@esperanca.com.br', true, null, demo_user_id),
      (gen_random_uuid(), 'Maria Santos', 'Sítio Bela Vista', 'Ribeirão Preto - SP', 'https://ui-avatars.com/api/?name=Maria+Santos&background=3b82f6&color=fff', '(16) 98765-4321', 'maria@belavista.com.br', false, now() - interval '2 hours', demo_user_id),
      (gen_random_uuid(), 'Carlos Oliveira', 'Agropecuária Futuro', 'Rio Verde - GO', 'https://ui-avatars.com/api/?name=Carlos+Oliveira&background=f59e0b&color=fff', '(64) 99555-7777', 'carlos@futuro.agr.br', true, null, demo_user_id),
      (gen_random_uuid(), 'Ana Costa', 'Fazenda Verde Ltda', 'Dourados - MS', 'https://ui-avatars.com/api/?name=Ana+Costa&background=ef4444&color=fff', '(67) 98888-1111', 'ana@verde.com.br', false, now() - interval '1 day', demo_user_id),
      (gen_random_uuid(), 'Pedro Almeida', 'Sítio São José', 'Uberlândia - MG', 'https://ui-avatars.com/api/?name=Pedro+Almeida&background=8b5cf6&color=fff', '(34) 97777-2222', 'pedro@saojoze.com.br', true, null, demo_user_id);

    -- Criar conversas
    INSERT INTO conversations (id, user_id, producer_id, title, is_pinned, unread_count, last_message_at, created_at)
    SELECT 
      gen_random_uuid(),
      demo_user_id,
      p.id,
      'Conversa com ' || p.name,
      CASE 
        WHEN p.name IN ('João Silva', 'Maria Santos') THEN true
        ELSE false
      END,
      CASE 
        WHEN p.name = 'Maria Santos' THEN 12
        WHEN p.name = 'João Silva' THEN 2
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