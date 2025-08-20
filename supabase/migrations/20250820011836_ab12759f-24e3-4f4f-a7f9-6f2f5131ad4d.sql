-- Criar políticas temporárias para demonstração
-- ATENÇÃO: Estas são políticas abertas apenas para demonstração

-- Permitir leitura pública temporária para demonstração
CREATE POLICY "Demo - Allow public read producers" ON producers FOR SELECT USING (true);
CREATE POLICY "Demo - Allow public read conversations" ON conversations FOR SELECT USING (true); 
CREATE POLICY "Demo - Allow public read messages" ON messages FOR SELECT USING (true);
CREATE POLICY "Demo - Allow public read user_preferences" ON user_preferences FOR SELECT USING (true);