-- Dados fictícios para demonstração dos cards quadrados
DO $$
DECLARE
    demo_user_id uuid := '11111111-1111-1111-1111-111111111111';
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
      (gen_random_uuid(), 'Claudia Martins', 'Fazenda Esperança Nova', 'Cascavel - PR', 'https://ui-avatars.com/api/?name=Claudia+Martins&background=6366f1&color=fff', '(45) 92222-7777', 'claudia@esperancanova.com.br', false, now() - interval '3 hours', demo_user_id),
      (gen_random_uuid(), 'José Carlos', 'Sítio Boa Sorte', 'Itaberaí - GO', 'https://ui-avatars.com/api/?name=José+Carlos&background=14b8a6&color=fff', '(62) 91111-8888', 'jose@boasorte.com.br', true, null, demo_user_id),
      (gen_random_uuid(), 'Mariana Silva', 'Fazenda Vista Alegre', 'Mineiros - GO', 'https://ui-avatars.com/api/?name=Mariana+Silva&background=f43f5e&color=fff', '(64) 99999-1234', 'mariana@vistaalegre.agr.br', false, now() - interval '45 minutes', demo_user_id),
      (gen_random_uuid(), 'Antonio Pereira', 'Agropecuária Pereira', 'Rondonópolis - MT', 'https://ui-avatars.com/api/?name=Antonio+Pereira&background=a855f7&color=fff', '(65) 98888-9999', 'antonio@pereira.agr.br', true, null, demo_user_id),
      (gen_random_uuid(), 'Beatriz Alves', 'Fazenda Três Irmãos', 'Primavera do Leste - MT', 'https://ui-avatars.com/api/?name=Beatriz+Alves&background=22d3ee&color=fff', '(66) 97777-0000', 'beatriz@tresirmaos.com.br', false, now() - interval '2 days', demo_user_id),
      (gen_random_uuid(), 'Marcos Vieira', 'Sítio Recanto Verde', 'Jataí - GO', 'https://ui-avatars.com/api/?name=Marcos+Vieira&background=eab308&color=fff', '(64) 96666-1111', 'marcos@recantoverde.com.br', true, null, demo_user_id);

    -- Criar conversas com dados dos produtores recém-inseridos
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
        WHEN p.name = 'Fernanda Rocha' THEN 1
        WHEN p.name = 'Claudia Martins' THEN 3
        ELSE 0
      END,
      CASE 
        WHEN p.name = 'João Silva' THEN now() - interval '10 minutes'
        WHEN p.name = 'Maria Santos' THEN now() - interval '30 minutes'
        WHEN p.name = 'Carlos Oliveira' THEN now() - interval '1 hour'
        WHEN p.name = 'Ana Costa' THEN now() - interval '2 hours'
        WHEN p.name = 'Pedro Almeida' THEN now() - interval '4 hours'
        WHEN p.name = 'Lucia Ferreira' THEN now() - interval '6 hours'
        WHEN p.name = 'Roberto Lima' THEN now() - interval '8 hours'
        WHEN p.name = 'Fernanda Rocha' THEN now() - interval '12 hours'
        WHEN p.name = 'Ricardo Souza' THEN now() - interval '1 day'
        WHEN p.name = 'Claudia Martins' THEN now() - interval '2 days'
        WHEN p.name = 'José Carlos' THEN now() - interval '3 days'
        WHEN p.name = 'Mariana Silva' THEN now() - interval '4 days'
        WHEN p.name = 'Antonio Pereira' THEN now() - interval '1 week'
        WHEN p.name = 'Beatriz Alves' THEN now() - interval '2 weeks'
        ELSE now() - interval '1 month'
      END,
      now() - interval '1 month'
    FROM producers p 
    WHERE p.user_id = demo_user_id;

    -- Inserir mensagens variadas com diferentes tipos e status
    INSERT INTO messages (id, conversation_id, sender_type, sender_id, content, message_type, status, is_read, metadata, created_at)
    SELECT 
      gen_random_uuid(),
      c.id,
      'producer',
      null,
      CASE 
        WHEN p.name = 'João Silva' THEN 'Colheita da soja chegou a 3.200 kg/ha! Estou muito satisfeito com os resultados.'
        WHEN p.name = 'Maria Santos' THEN 'Preciso de ajuda urgente com problema na irrigação'
        WHEN p.name = 'Carlos Oliveira' THEN 'Enviou uma foto'
        WHEN p.name = 'Ana Costa' THEN 'Compartilhou documento'
        WHEN p.name = 'Pedro Almeida' THEN 'Boa tarde! Como está o cronograma de plantio para próxima temporada?'
        WHEN p.name = 'Lucia Ferreira' THEN 'Mensagem de voz'
        WHEN p.name = 'Roberto Lima' THEN '📍 Compartilhou localização'
        WHEN p.name = 'Fernanda Rocha' THEN 'Obrigada pela consultoria técnica. Foi muito esclarecedora!'
        WHEN p.name = 'Ricardo Souza' THEN 'Enviou uma foto'
        WHEN p.name = 'Claudia Martins' THEN 'Quando poderemos marcar uma visita técnica?'
        WHEN p.name = 'José Carlos' THEN 'Análise do solo chegou. Precisamos conversar sobre os resultados.'
        WHEN p.name = 'Mariana Silva' THEN 'Mensagem de voz'
        WHEN p.name = 'Antonio Pereira' THEN 'Compartilhou documento'
        WHEN p.name = 'Beatriz Alves' THEN 'Bom dia! Preciso de orientação sobre pragas na soja.'
        ELSE 'Olá! Tudo bem?'
      END,
      CASE 
        WHEN p.name IN ('Carlos Oliveira', 'Ricardo Souza') THEN 'image'
        WHEN p.name IN ('Lucia Ferreira', 'Mariana Silva') THEN 'audio'
        WHEN p.name IN ('Ana Costa', 'Antonio Pereira') THEN 'file'
        ELSE 'text'
      END,
      CASE 
        WHEN p.name IN ('João Silva', 'Ana Costa', 'Pedro Almeida', 'Roberto Lima', 'Ricardo Souza', 'José Carlos', 'Antonio Pereira', 'Beatriz Alves') THEN 'read'
        WHEN p.name IN ('Carlos Oliveira', 'Fernanda Rocha', 'Mariana Silva') THEN 'delivered'
        ELSE 'sent'
      END,
      CASE 
        WHEN p.name IN ('Maria Santos', 'Lucia Ferreira', 'Fernanda Rocha', 'Claudia Martins') THEN false
        ELSE true
      END,
      CASE 
        WHEN p.name = 'Lucia Ferreira' THEN '{"duration": 45, "waveform": [0.2, 0.5, 0.8, 0.3, 0.7]}'::jsonb
        WHEN p.name = 'Mariana Silva' THEN '{"duration": 23, "waveform": [0.4, 0.6, 0.9, 0.2, 0.5]}'::jsonb
        WHEN p.name = 'Carlos Oliveira' THEN '{"filename": "plantacao_milho.jpg", "size": 2048576}'::jsonb
        WHEN p.name = 'Ricardo Souza' THEN '{"filename": "gado_pasto.jpg", "size": 1536000}'::jsonb
        WHEN p.name = 'Ana Costa' THEN '{"filename": "Relatório_Análise_Solo_2024.pdf", "size": 5242880}'::jsonb
        WHEN p.name = 'Antonio Pereira' THEN '{"filename": "Plano_Safra_2025.docx", "size": 1048576}'::jsonb
        WHEN p.name = 'Roberto Lima' THEN '{"latitude": -15.7801, "longitude": -47.9292, "address": "Fazenda Modelo, Brasília - DF"}'::jsonb
        ELSE '{}'::jsonb
      END,
      CASE 
        WHEN p.name = 'João Silva' THEN now() - interval '10 minutes'
        WHEN p.name = 'Maria Santos' THEN now() - interval '30 minutes'
        WHEN p.name = 'Carlos Oliveira' THEN now() - interval '1 hour'
        WHEN p.name = 'Ana Costa' THEN now() - interval '2 hours'
        WHEN p.name = 'Pedro Almeida' THEN now() - interval '4 hours'
        WHEN p.name = 'Lucia Ferreira' THEN now() - interval '6 hours'
        WHEN p.name = 'Roberto Lima' THEN now() - interval '8 hours'
        WHEN p.name = 'Fernanda Rocha' THEN now() - interval '12 hours'
        WHEN p.name = 'Ricardo Souza' THEN now() - interval '1 day'
        WHEN p.name = 'Claudia Martins' THEN now() - interval '2 days'
        WHEN p.name = 'José Carlos' THEN now() - interval '3 days'
        WHEN p.name = 'Mariana Silva' THEN now() - interval '4 days'
        WHEN p.name = 'Antonio Pereira' THEN now() - interval '1 week'
        WHEN p.name = 'Beatriz Alves' THEN now() - interval '2 weeks'
        ELSE now() - interval '1 month'
      END
    FROM conversations c 
    JOIN producers p ON c.producer_id = p.id 
    WHERE c.user_id = demo_user_id;

    -- Inserir preferência de densidade padrão
    INSERT INTO user_preferences (user_id, chat_density) 
    VALUES (demo_user_id, 'comfortable')
    ON CONFLICT (user_id) DO UPDATE SET chat_density = 'comfortable';

END $$;