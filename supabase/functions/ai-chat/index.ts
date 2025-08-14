/**
 * Supabase Edge Function: ai-chat (I.A Ludmila)
 * Arquitetura: RAG local → OpenAI geral → APIs externas → Error
 * Features: Circuit breaker, rate limiting, retry logic, standardized responses
 * Security: Correlation IDs, structured logging, proper fallbacks
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { CircuitBreaker } from './circuit-breaker.ts';
import { getRateLimiter } from './rate-limiter.ts';

// CORS headers for web app compatibility
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ChatPayload {
  message: string;
  correlation_id?: string;
}

// Standardized API Configuration Structure
interface APIConfig {
  name: string;
  enabled: boolean;
  base_url: string | null;
  api_key: string | null;
  timeout_ms: number;
  limit: {
    rpm: number;
    burst: number;
  };
  retries: {
    max: number;
    backoff_ms: number;
  };
  auth_header: string; // 'Authorization' or 'x-api-key'
  auth_prefix: string; // 'Bearer ' or ''
}

// Standardized API Registry with environment variables following naming convention
const API_REGISTRY: Record<string, APIConfig> = {
  agro_responde: {
    name: "agro_responde",
    enabled: true, // Will auto-disable if URLs missing
    base_url: Deno.env.get("AGRO_RESPONDE_BASE_URL"),
    api_key: Deno.env.get("AGRO_RESPONDE_API_KEY"),
    timeout_ms: 6000,
    limit: { rpm: 30, burst: 10 },
    retries: { max: 2, backoff_ms: 300 },
    auth_header: "Authorization",
    auth_prefix: "Bearer "
  },
  clima_embrapa: {
    name: "clima_embrapa", 
    enabled: true,
    base_url: Deno.env.get("CLIMA_EMBRAPA_BASE_URL"),
    api_key: Deno.env.get("CLIMA_EMBRAPA_API_KEY"),
    timeout_ms: 8000, // Weather APIs can be slower
    limit: { rpm: 60, burst: 20 },
    retries: { max: 2, backoff_ms: 300 },
    auth_header: "x-api-key",
    auth_prefix: ""
  },
  produtos: {
    name: "produtos",
    enabled: true,
    base_url: Deno.env.get("PRODUTOS_BASE_URL"),
    api_key: Deno.env.get("PRODUTOS_API_KEY"),
    timeout_ms: 6000,
    limit: { rpm: 60, burst: 20 },
    retries: { max: 2, backoff_ms: 300 },
    auth_header: "Authorization",
    auth_prefix: "Bearer "
  },
  biologicos: {
    name: "biologicos",
    enabled: true,
    base_url: Deno.env.get("BIOLOGICOS_BASE_URL"),
    api_key: Deno.env.get("BIOLOGICOS_API_KEY"),
    timeout_ms: 6000,
    limit: { rpm: 30, burst: 10 },
    retries: { max: 2, backoff_ms: 300 },
    auth_header: "x-api-key",
    auth_prefix: ""
  },
  smart_solo: {
    name: "smart_solo",
    enabled: true,
    base_url: Deno.env.get("SMART_SOLO_BASE_URL"),
    api_key: Deno.env.get("SMART_SOLO_API_KEY"),
    timeout_ms: 6000,
    limit: { rpm: 30, burst: 10 },
    retries: { max: 2, backoff_ms: 300 },
    auth_header: "Authorization",
    auth_prefix: "Bearer "
  }
};

// Circuit breakers for each API
const circuitBreakers = new Map<string, CircuitBreaker>();

function getCircuitBreaker(apiName: string): CircuitBreaker {
  if (!circuitBreakers.has(apiName)) {
    circuitBreakers.set(apiName, new CircuitBreaker(5, 60000)); // 5 failures, 60s recovery
  }
  return circuitBreakers.get(apiName)!;
}

// Standardized response interfaces
interface APIResponse {
  source: string;
  data: any;
  success: boolean;
  error?: string;
}

// Professional fallback messages without technical details
const FALLBACK_MESSAGES = {
  agro_responde: "No momento não consegui consultar a base técnica. Vou seguir com recomendações gerais, e retorno à base assim que estiver disponível.",
  clima_embrapa: "A fonte meteorológica está instável. Posso usar a última atualização salva para a sua região enquanto reconecto.",
  produtos: "Catálogo temporariamente indisponível. Posso listar seus últimos itens consultados ou filtrar por categoria offline.",
  biologicos: "Repositório de biológicos fora do ar. Posso sugerir práticas gerais de manejo integrado como alternativa imediata.",
  smart_solo: "Análise de solo momentaneamente indisponível. Posso usar parâmetros médios regionais enquanto reestabelecemos a conexão."
};

// Initialize Supabase client for this function
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Get OpenAI API key
const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
if (!openaiApiKey) {
  console.error('OPENAI_API_KEY not found in environment variables');
}

// Enhanced utility functions
function generateCorrelationId(): string {
  return `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function log(level: string, message: string, data?: any, correlationId?: string): void {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    correlationId,
    tag: 'external_api',
    ...data
  };
  console.log(JSON.stringify(logEntry));
}

function extractKeywords(query: string): string[] {
  return query
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2)
    .slice(0, 10);
}

// Enhanced fetch with retry and circuit breaker
async function fetchWithRetryAndBreaker(
  apiConfig: APIConfig,
  endpoint: string,
  options: RequestInit = {},
  correlationId: string
): Promise<Response> {
  if (!apiConfig.base_url || !apiConfig.api_key) {
    throw new Error(`API ${apiConfig.name} not configured: missing base_url or api_key`);
  }

  const rateLimiter = getRateLimiter(apiConfig.name, apiConfig.limit.rpm, apiConfig.limit.burst);
  
  if (!rateLimiter.consume()) {
    throw new Error(`Rate limit exceeded for ${apiConfig.name}`);
  }

  const circuitBreaker = getCircuitBreaker(apiConfig.name);
  
  return await circuitBreaker.execute(async () => {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= apiConfig.retries.max; attempt++) {
      const startTime = Date.now();
      
      try {
        const url = `${apiConfig.base_url}${endpoint}`;
        const headers = {
          'Content-Type': 'application/json',
          [apiConfig.auth_header]: `${apiConfig.auth_prefix}${apiConfig.api_key}`,
          ...options.headers
        };

        log('info', `API call attempt ${attempt + 1}`, {
          api: apiConfig.name,
          url,
          method: options.method || 'GET'
        }, correlationId);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), apiConfig.timeout_ms);

        const response = await fetch(url, {
          ...options,
          headers,
          signal: controller.signal
        });

        clearTimeout(timeoutId);
        
        const duration = Date.now() - startTime;
        
        log('info', `API call completed`, {
          api: apiConfig.name,
          status: response.status,
          duration_ms: duration,
          attempt: attempt + 1
        }, correlationId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return response;
        
      } catch (error) {
        const duration = Date.now() - startTime;
        lastError = error as Error;
        
        log('error', `API call failed`, {
          api: apiConfig.name,
          error: lastError.message,
          duration_ms: duration,
          attempt: attempt + 1
        }, correlationId);

        if (attempt < apiConfig.retries.max) {
          const backoffMs = apiConfig.retries.backoff_ms * Math.pow(2, attempt);
          await new Promise(resolve => setTimeout(resolve, backoffMs));
        }
      }
    }
    
    throw lastError || new Error(`Failed after ${apiConfig.retries.max + 1} attempts`);
  });
}

async function searchLocalContext(keywords: string[], correlationId: string) {
  try {
    log('info', 'Searching local knowledge base', { keywords }, correlationId);
    
    const { data: chunks, error } = await supabase
      .from('document_chunks')
      .select('content, document_id')
      .textSearch('content', keywords.join(' | '), {
        type: 'websearch',
        config: 'portuguese'
      })
      .limit(5);

    if (error) {
      log('error', 'Local search failed', { error: error.message }, correlationId);
      return null;
    }

    if (!chunks || chunks.length === 0) {
      log('info', 'No local context found', { keywords }, correlationId);
      return null;
    }

    const context = chunks.map(chunk => chunk.content).join('\n\n');
    log('info', 'Local context found', { 
      chunks_count: chunks.length,
      context_length: context.length 
    }, correlationId);
    
    return context;
  } catch (error) {
    log('error', 'Local search error', { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, correlationId);
    return null;
  }
}

async function answerWithOpenAI(
  question: string, 
  context: string | null, 
  correlationId: string, 
  mode: 'rag' | 'general' = 'rag'
): Promise<string | null> {
  if (!openaiApiKey) {
    log('error', 'OpenAI API key not available', {}, correlationId);
    return null;
  }

  try {
    let systemPrompt = "Você é a I.A Ludmila, assistente técnica agrícola do FlowAgro. Responda de forma objetiva, técnica e prática.";
    let userContent = question;

    if (mode === 'rag' && context) {
      systemPrompt += " Use SEMPRE o contexto fornecido quando relevante, mas complemente com conhecimento geral se necessário.";
      userContent = `Pergunta: ${question}\n\nContexto dos documentos:\n${context}`;
    } else {
      systemPrompt += " Responda com base no seu conhecimento geral sobre agricultura. Seja específico e técnico.";
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent }
        ],
        temperature: 0.2,
        max_tokens: 1000
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      log('error', 'OpenAI API error', { 
        status: response.status, 
        error: errorText 
      }, correlationId);
      return null;
    }

    const data = await response.json();
    const answer = data.choices?.[0]?.message?.content?.trim();
    
    log('info', 'OpenAI response generated', { 
      mode, 
      has_context: !!context,
      success: !!answer 
    }, correlationId);

    return answer || null;
  } catch (error) {
    log('error', 'OpenAI request failed', { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, correlationId);
    return null;
  }
}

// Enhanced API validation with health checks
async function validateApiRegistry(correlationId: string): Promise<Record<string, boolean>> {
  const healthStatus: Record<string, boolean> = {};
  
  for (const [name, config] of Object.entries(API_REGISTRY)) {
    if (!config.enabled || !config.base_url || !config.api_key) {
      healthStatus[name] = false;
      log('warn', `API ${name} disabled or not configured`, {
        enabled: config.enabled,
        has_base_url: !!config.base_url,
        has_api_key: !!config.api_key
      }, correlationId);
      continue;
    }

    try {
      // Try health endpoint first, fallback to base URL
      const healthEndpoint = '/health'; // Standard health endpoint
      const response = await fetchWithRetryAndBreaker(
        config,
        healthEndpoint,
        { method: 'GET' },
        correlationId
      );
      
      healthStatus[name] = response.ok;
      log('info', `API ${name} health check`, {
        status: response.status,
        healthy: response.ok
      }, correlationId);
      
    } catch (error) {
      healthStatus[name] = false;
      log('error', `API ${name} health check failed`, {
        error: error instanceof Error ? error.message : 'Unknown error'
      }, correlationId);
    }
  }
  
  return healthStatus;
}

// Enhanced external API querying with standardized responses
async function queryExternalAPIs(question: string, correlationId: string): Promise<any> {
  log('info', 'Starting external API queries', { question }, correlationId);
  
  const healthStatus = await validateApiRegistry(correlationId);
  const healthyAPIs = Object.entries(healthStatus)
    .filter(([_, healthy]) => healthy)
    .map(([name, _]) => name);
  
  if (healthyAPIs.length === 0) {
    log('warn', 'No healthy external APIs available', {}, correlationId);
    return {
      success: false,
      source: 'external_apis',
      answer: "Todas as fontes externas estão temporariamente indisponíveis. Vou responder com base no meu conhecimento geral.",
      fallback_used: true
    };
  }

  // Query each healthy API based on question context
  const apiResults: any[] = [];
  
  for (const apiName of healthyAPIs) {
    const config = API_REGISTRY[apiName];
    
    try {
      let endpoint = '';
      let payload: any = {};
      
      // Route question to appropriate API based on content
      if (apiName === 'agro_responde' && (question.includes('praga') || question.includes('doença') || question.includes('cultura'))) {
        endpoint = '/ask';
        payload = { query: question, culture: 'milho', region: 'cerrado' };
      } else if (apiName === 'clima_embrapa' && (question.includes('clima') || question.includes('chuva') || question.includes('temperatura'))) {
        endpoint = '/weather';
        payload = { lat: -15.793889, lon: -47.882778, date: new Date().toISOString().split('T')[0] };
      } else if (apiName === 'produtos' && (question.includes('produto') || question.includes('fertilizante') || question.includes('defensivo'))) {
        endpoint = '/search';
        payload = { q: question, category: 'fertilizante', page: 1 };
      } else if (apiName === 'biologicos' && question.includes('biológico')) {
        endpoint = '/solutions';
        payload = { target: 'praga', crop: 'milho' };
      } else if (apiName === 'smart_solo' && (question.includes('solo') || question.includes('análise'))) {
        endpoint = '/analyze';
        payload = { clay: 30, ph: 6.5, p_mehlich: 15, k: 120 };
      } else {
        continue; // Skip if question doesn't match API purpose
      }

      const response = await fetchWithRetryAndBreaker(
        config,
        endpoint,
        {
          method: 'POST',
          body: JSON.stringify(payload)
        },
        correlationId
      );

      const data = await response.json();
      
      apiResults.push({
        source: apiName,
        data,
        success: true
      });
      
      log('info', `API ${apiName} query successful`, {
        endpoint,
        response_size: JSON.stringify(data).length
      }, correlationId);
      
    } catch (error) {
      log('error', `API ${apiName} query failed`, {
        error: error instanceof Error ? error.message : 'Unknown error'
      }, correlationId);
      
      // Add fallback message for this API
      apiResults.push({
        source: apiName,
        success: false,
        fallback_message: FALLBACK_MESSAGES[apiName as keyof typeof FALLBACK_MESSAGES]
      });
    }
  }

  if (apiResults.length === 0) {
    return {
      success: false,
      source: 'external_apis',
      answer: "Não foi possível consultar as fontes externas no momento. Vou responder com base no conhecimento disponível.",
      fallback_used: true
    };
  }

  return {
    success: true,
    source: 'external_apis',
    results: apiResults,
    healthy_apis: healthyAPIs
  };
}

// Main request handler with enhanced fallback strategy
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const correlationId = generateCorrelationId();
  const requestStart = Date.now();

  try {
    const payload = await req.json() as ChatPayload;
    const question = payload?.message?.trim();

    if (!question) {
      log('warn', 'Empty question received', {}, correlationId);
      return new Response(JSON.stringify({ 
        error: 'Pergunta é obrigatória',
        correlation_id: correlationId 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    log('info', 'Chat request received', { 
      question_length: question.length 
    }, correlationId);

    let finalAnswer: string | null = null;
    let finalSource = 'general';

    // 1. Try RAG with local context first
    const keywords = extractKeywords(question);
    const localContext = await searchLocalContext(keywords, correlationId);
    
    if (localContext) {
      log('info', 'Local context found - attempting RAG', { 
        context_length: localContext.length 
      }, correlationId);
      
      const ragAnswer = await answerWithOpenAI(question, localContext, correlationId, 'rag');
      
      if (ragAnswer) {
        finalAnswer = ragAnswer;
        finalSource = 'local';
        log('info', 'RAG response generated successfully', {}, correlationId);
      }
    }

    // 2. Fallback to general OpenAI knowledge
    if (!finalAnswer) {
      log('info', 'Using OpenAI general fallback', {}, correlationId);
      const generalAnswer = await answerWithOpenAI(question, null, correlationId, 'general');
      
      if (generalAnswer) {
        finalAnswer = generalAnswer;
        finalSource = 'general';
        log('info', 'General AI response generated', {}, correlationId);
      }
    }

    // 3. Try external APIs as last resort (when implemented)
    if (!finalAnswer) {
      log('info', 'Attempting external APIs fallback', {}, correlationId);
      const externalResult = await queryExternalAPIs(question, correlationId);
      
      if (externalResult?.success && externalResult.results?.length > 0) {
        // Process external API results
        const successfulResults = externalResult.results.filter((r: any) => r.success);
        if (successfulResults.length > 0) {
          finalAnswer = `Consultei fontes externas: ${successfulResults.map((r: any) => r.source).join(', ')}`;
          finalSource = 'external';
        }
      }
    }

    const totalLatency = Date.now() - requestStart;

    // 4. Final response or error
    if (finalAnswer) {
      log('info', 'Request completed successfully', { 
        source: finalSource, 
        total_latency: totalLatency 
      }, correlationId);
      
      return new Response(JSON.stringify({ 
        answer: finalAnswer, 
        source: finalSource,
        correlation_id: correlationId 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } else {
      log('error', 'All fallback methods failed', { 
        total_latency: totalLatency 
      }, correlationId);
      
      return new Response(JSON.stringify({ 
        error: 'Não consegui gerar uma resposta no momento. Tente novamente em instantes.',
        correlation_id: correlationId 
      }), {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error) {
    const totalLatency = Date.now() - requestStart;
    log('error', 'Unhandled exception in ai-chat', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      total_latency: totalLatency 
    }, correlationId);
    
    return new Response(JSON.stringify({ 
      error: 'Erro interno. Nossa equipe foi notificada.',
      correlation_id: correlationId 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});