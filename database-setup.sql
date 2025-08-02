-- FlowAgro Mobile Database Structure
-- Execute this SQL in your Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types for better data consistency
CREATE TYPE user_role AS ENUM ('consultor', 'produtor');
CREATE TYPE occurrence_type AS ENUM ('praga', 'doenca', 'deficiencia');
CREATE TYPE severity_level AS ENUM ('leve', 'moderada', 'grave');
CREATE TYPE photo_reference AS ENUM ('ocorrencia', 'trilha', 'checkin');

-- 1. Tabela usuarios
CREATE TABLE usuarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    telefone VARCHAR(20),
    papel user_role NOT NULL,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabela propriedades
CREATE TABLE propriedades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(255) NOT NULL,
    cidade VARCHAR(100) NOT NULL,
    estado VARCHAR(2) NOT NULL,
    consultor_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabela checkins
CREATE TABLE checkins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    propriedade_id UUID NOT NULL REFERENCES propriedades(id) ON DELETE CASCADE,
    data_entrada TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    data_saida TIMESTAMP WITH TIME ZONE,
    coordenadas JSONB NOT NULL, -- {"lat": -15.123, "lng": -47.456}
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Tabela trilhas
CREATE TABLE trilhas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    checkin_id UUID NOT NULL REFERENCES checkins(id) ON DELETE CASCADE,
    pontos JSONB NOT NULL DEFAULT '[]', -- [{"lat": -15.123, "lng": -47.456, "timestamp": "2024-01-01T10:00:00Z"}]
    finalizada BOOLEAN NOT NULL DEFAULT FALSE,
    criada_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    atualizada_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Tabela ocorrencias
CREATE TABLE ocorrencias (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tipo occurrence_type NOT NULL,
    categoria VARCHAR(100) NOT NULL,
    gravidade severity_level NOT NULL,
    quantidade INTEGER NOT NULL CHECK (quantidade >= 0),
    coordenadas JSONB NOT NULL, -- {"lat": -15.123, "lng": -47.456}
    imagem_url TEXT,
    checkin_id UUID NOT NULL REFERENCES checkins(id) ON DELETE CASCADE,
    propriedade_id UUID NOT NULL REFERENCES propriedades(id) ON DELETE CASCADE,
    criada_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    atualizada_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Tabela fotos
CREATE TABLE fotos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    coordenadas JSONB NOT NULL, -- {"lat": -15.123, "lng": -47.456}
    referencia photo_reference NOT NULL,
    referencia_id UUID NOT NULL,
    criada_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better mobile performance
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_papel ON usuarios(papel);

CREATE INDEX idx_propriedades_consultor ON propriedades(consultor_id);
CREATE INDEX idx_propriedades_estado ON propriedades(estado);

CREATE INDEX idx_checkins_usuario ON checkins(usuario_id);
CREATE INDEX idx_checkins_propriedade ON checkins(propriedade_id);
CREATE INDEX idx_checkins_data_entrada ON checkins(data_entrada);
CREATE INDEX idx_checkins_coordenadas ON checkins USING GIN(coordenadas);

CREATE INDEX idx_trilhas_checkin ON trilhas(checkin_id);
CREATE INDEX idx_trilhas_finalizada ON trilhas(finalizada);
CREATE INDEX idx_trilhas_criada_em ON trilhas(criada_em);

CREATE INDEX idx_ocorrencias_checkin ON ocorrencias(checkin_id);
CREATE INDEX idx_ocorrencias_propriedade ON ocorrencias(propriedade_id);
CREATE INDEX idx_ocorrencias_tipo ON ocorrencias(tipo);
CREATE INDEX idx_ocorrencias_coordenadas ON ocorrencias USING GIN(coordenadas);
CREATE INDEX idx_ocorrencias_criada_em ON ocorrencias(criada_em);

CREATE INDEX idx_fotos_usuario ON fotos(usuario_id);
CREATE INDEX idx_fotos_referencia ON fotos(referencia, referencia_id);
CREATE INDEX idx_fotos_coordenadas ON fotos USING GIN(coordenadas);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.atualizado_em = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers to relevant tables
CREATE TRIGGER update_usuarios_updated_at BEFORE UPDATE ON usuarios FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_propriedades_updated_at BEFORE UPDATE ON propriedades FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_checkins_updated_at BEFORE UPDATE ON checkins FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_trilhas_updated_at BEFORE UPDATE ON trilhas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ocorrencias_updated_at BEFORE UPDATE ON ocorrencias FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE propriedades ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE trilhas ENABLE ROW LEVEL SECURITY;
ALTER TABLE ocorrencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE fotos ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies for security
-- Users can only see their own data
CREATE POLICY "Users can view own profile" ON usuarios FOR SELECT USING (auth.uid()::text = id::text);
CREATE POLICY "Users can update own profile" ON usuarios FOR UPDATE USING (auth.uid()::text = id::text);

-- Consultores can see their properties
CREATE POLICY "Consultores can view their properties" ON propriedades FOR SELECT USING (
    EXISTS (SELECT 1 FROM usuarios WHERE id = consultor_id AND auth.uid()::text = id::text)
);

-- Users can see checkins for their properties or where they are the user
CREATE POLICY "Users can view relevant checkins" ON checkins FOR SELECT USING (
    auth.uid()::text = usuario_id::text OR 
    EXISTS (SELECT 1 FROM propriedades WHERE id = propriedade_id AND consultor_id::text = auth.uid()::text)
);

-- Similar policies for other tables
CREATE POLICY "Users can view relevant trilhas" ON trilhas FOR SELECT USING (
    EXISTS (SELECT 1 FROM checkins WHERE id = checkin_id AND usuario_id::text = auth.uid()::text)
);

CREATE POLICY "Users can view relevant ocorrencias" ON ocorrencias FOR SELECT USING (
    EXISTS (SELECT 1 FROM checkins WHERE id = checkin_id AND usuario_id::text = auth.uid()::text)
);

CREATE POLICY "Users can view relevant fotos" ON fotos FOR SELECT USING (auth.uid()::text = usuario_id::text);

-- Insert policies (users can insert their own data)
CREATE POLICY "Users can insert own checkins" ON checkins FOR INSERT WITH CHECK (auth.uid()::text = usuario_id::text);
CREATE POLICY "Users can insert own trilhas" ON trilhas FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM checkins WHERE id = checkin_id AND usuario_id::text = auth.uid()::text)
);
CREATE POLICY "Users can insert own ocorrencias" ON ocorrencias FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM checkins WHERE id = checkin_id AND usuario_id::text = auth.uid()::text)
);
CREATE POLICY "Users can insert own fotos" ON fotos FOR INSERT WITH CHECK (auth.uid()::text = usuario_id::text);

-- Update policies
CREATE POLICY "Users can update own checkins" ON checkins FOR UPDATE USING (auth.uid()::text = usuario_id::text);
CREATE POLICY "Users can update own trilhas" ON trilhas FOR UPDATE USING (
    EXISTS (SELECT 1 FROM checkins WHERE id = checkin_id AND usuario_id::text = auth.uid()::text)
);
CREATE POLICY "Users can update own ocorrencias" ON ocorrencias FOR UPDATE USING (
    EXISTS (SELECT 1 FROM checkins WHERE id = checkin_id AND usuario_id::text = auth.uid()::text)
);

-- Sample data for testing (optional)
INSERT INTO usuarios (nome, email, papel) VALUES 
('João Consultor', 'joao@flowagro.com', 'consultor'),
('Maria Produtora', 'maria@fazenda.com', 'produtor');

INSERT INTO propriedades (nome, cidade, estado, consultor_id) 
SELECT 'Fazenda Boa Vista', 'Goiânia', 'GO', id FROM usuarios WHERE email = 'joao@flowagro.com';