# API Integration Guide - FlowAgro

## 📋 Overview

Este documento detalha a arquitetura e configuração das 5 APIs externas integradas ao sistema FlowAgro através da edge function `ai-chat`.

## 🏗️ Arquitetura

### Ordem de Fallback
1. **RAG Local** - Busca na base de conhecimento interna
2. **OpenAI Geral** - Conhecimento base do modelo
3. **APIs Externas** - Fontes especializadas (quando configuradas)
4. **Error** - Mensagem de fallback amigável

### Recursos Implementados
- ✅ Circuit Breaker (5 falhas → 60s recovery)
- ✅ Rate Limiting (Token Bucket por API)
- ✅ Retry com Exponential Backoff
- ✅ Timeouts configuráveis
- ✅ Logging estruturado com correlation ID
- ✅ Mensagens de fallback profissionais

## 🔧 APIs Configuradas

### 1. agro_responde
- **Propósito**: Respostas agronômicas técnicas
- **Rate Limit**: 30 RPM, burst 10
- **Timeout**: 6.000ms
- **Auth**: `Authorization: Bearer <token>`
- **Endpoints**: `/health`, `/ask`

### 2. clima_embrapa  
- **Propósito**: Dados meteorológicos da Embrapa
- **Rate Limit**: 60 RPM, burst 20
- **Timeout**: 8.000ms (APIs meteo podem ser lentas)
- **Auth**: `x-api-key: <key>`
- **Endpoints**: `/health`, `/weather`

### 3. produtos
- **Propósito**: Catálogo de produtos agrícolas
- **Rate Limit**: 60 RPM, burst 20  
- **Timeout**: 6.000ms
- **Auth**: `Authorization: Bearer <token>`
- **Endpoints**: `/health`, `/search`

### 4. biologicos
- **Propósito**: Controle biológico e manejo integrado
- **Rate Limit**: 30 RPM, burst 10
- **Timeout**: 6.000ms
- **Auth**: `x-api-key: <key>`
- **Endpoints**: `/health`, `/solutions`

### 5. smart_solo
- **Propósito**: Análise e manejo de solo
- **Rate Limit**: 30 RPM, burst 10
- **Timeout**: 6.000ms
- **Auth**: `Authorization: Bearer <token>`
- **Endpoints**: `/health`, `/analyze`

## 🔑 Configuração de Secrets

### Variáveis de Ambiente Necessárias

```bash
# Base URLs (sem barra final)
AGRO_RESPONDE_BASE_URL="https://api.agro-responde.com"
CLIMA_EMBRAPA_BASE_URL="https://api.clima.embrapa.br"  
PRODUTOS_BASE_URL="https://api.catalogo-produtos.com"
BIOLOGICOS_BASE_URL="https://api.controle-biologico.com"
SMART_SOLO_BASE_URL="https://api.smart-solo.com"

# API Keys
AGRO_RESPONDE_API_KEY="***"
CLIMA_EMBRAPA_API_KEY="***"
PRODUTOS_API_KEY="***"
BIOLOGICOS_API_KEY="***"
SMART_SOLO_API_KEY="***"
```

### Como Configurar no Supabase

```bash
# Configurar secrets no Supabase
supabase secrets set AGRO_RESPONDE_BASE_URL="https://api.real-url.com"
supabase secrets set AGRO_RESPONDE_API_KEY="sua-api-key-real"

# Repetir para todas as 5 APIs...
```

## 🧪 Testes de Conectividade

### Health Check Básico
```bash
curl -i "https://api.exemplo.com/health"
```

### Com Autenticação Bearer
```bash
curl -i -H "Authorization: Bearer <KEY>" "https://api.exemplo.com/health"
```

### Com x-api-key
```bash
curl -i -H "x-api-key: <KEY>" "https://api.exemplo.com/health"
```

### Teste de Latência
- **Meta**: p50 < 500ms, p95 < 1500ms
- **Ação**: Se > 1500ms, aumentar `timeout_ms` para 8000ms

## 📊 Contratos de Response Padronizados

### agro_responde
```json
{
  "source": "agro_responde",
  "answer": "texto curto e objetivo",
  "confidence": 0.85,
  "citations": ["url_ou_id_referencial"]
}
```

### clima_embrapa
```json
{
  "source": "clima_embrapa", 
  "location": {"lat": -10.2, "lon": -48.3},
  "daily": [{"date": "2025-08-14", "tmin": 22.1, "tmax": 34.8, "rain_mm": 3.2}],
  "meta": {"units": {"temp":"°C","rain":"mm"}}
}
```

### produtos
```json
{
  "source": "produtos",
  "items": [{
    "id": "SKU123", 
    "name": "Nome do Produto",
    "category": "fertilizante",
    "brand": "Marca",
    "pack": "20 kg",
    "prices": [{"currency":"BRL","value":123.45}]
  }],
  "pagination": {"page":1,"pageSize":20,"total":123}
}
```

### biologicos  
```json
{
  "source": "biologicos",
  "solutions": [{
    "agent": "Bacillus subtilis",
    "mode": "preventivo|curativo", 
    "dose": "100 g/ha",
    "interval": "7 dias"
  }]
}
```

### smart_solo
```json
{
  "source": "smart_solo",
  "diagnosis": [{
    "parameter": "P",
    "value": 8,
    "unit": "mg/dm3", 
    "status": "baixo|adequado|alto",
    "recommendation": "aplicar X kg/ha de P2O5 (método Y)"
  }],
  "notes": "observações"
}
```

## 🚨 Mensagens de Fallback

Quando uma API estiver indisponível, as seguintes mensagens são retornadas:

- **agro_responde**: "No momento não consegui consultar a base técnica. Vou seguir com recomendações gerais, e retorno à base assim que estiver disponível."
- **clima_embrapa**: "A fonte meteorológica está instável. Posso usar a última atualização salva para a sua região enquanto reconecto."
- **produtos**: "Catálogo temporariamente indisponível. Posso listar seus últimos itens consultados ou filtrar por categoria offline."
- **biologicos**: "Repositório de biológicos fora do ar. Posso sugerir práticas gerais de manejo integrado como alternativa imediata."
- **smart_solo**: "Análise de solo momentaneamente indisponível. Posso usar parâmetros médios regionais enquanto reestabelecemos a conexão."

## 📈 Observabilidade

### Logs Estruturados
Todos os logs incluem:
- `timestamp`: ISO 8601
- `level`: info/warn/error
- `correlationId`: Tracking único por request
- `tag`: 'external_api' para filtrar
- `api`: Nome da API
- `duration_ms`: Latência
- `status`: HTTP status code

### Métricas Monitoradas
- Latência por API (p50, p95, p99)
- Taxa de erro por API
- Status do Circuit Breaker
- Rate limiting hits
- Tentativas de retry

## 🛠️ Próximos Passos

### Para Ativar as APIs:

1. **Obter dos Fornecedores**:
   - Base URL real (sem barra final)
   - Método de autenticação (Bearer vs x-api-key)
   - Endpoint de health check
   - Documentação dos endpoints de produção

2. **Configurar Secrets**:
   - Atualizar todas as variáveis de ambiente
   - Deploy da edge function

3. **Smoke Tests**:
   - Testar conectividade básica
   - Validar autenticação
   - Medir latências
   - Ajustar timeouts se necessário

4. **Monitoramento**:
   - Acompanhar logs nos primeiros 60 minutos
   - Verificar métricas de erro
   - Ajustar rate limits conforme uso real

## 🔒 Segurança

- ✅ API keys nunca são logadas
- ✅ Payloads sensíveis não aparecem nos logs
- ✅ Timeouts prevent resource exhaustion
- ✅ Rate limiting protege APIs de sobrecarga
- ✅ Circuit breakers evitam cascading failures
- ✅ Correlation IDs para auditoria

---

**Status Atual**: Arquitetura implementada, aguardando URLs reais dos fornecedores para ativação.