
/**
 * Supabase Edge Function: ai-chat (I.A Ludmila)
 * Ordem de fallback: RAG local → OpenAI geral → erro claro
 * Features: correlation ID, timeouts, error mapping, source tracking
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type ChatPayload = {
  message: string;
  correlation_id?: string;
};

type APISource = {
  enabled: boolean;
  base_url: string;
  api_key: string;
  name: string;
  healthcheck?: string;
};

// Core services
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY") || "";

// Registry de fontes externas (desabilitadas por segurança até termos endpoints reais)
const API_REGISTRY: Record<string, APISource> = {
  agro_responde: {
    enabled: false, // Temporariamente desabilitado
    base_url: "", 
    api_key: Deno.env.get("agro responde") || "",
    name: "agro-responde"
  },
  clima_embrapa: {
    enabled: false,
    base_url: "",
    api_key: Deno.env.get("clima embrapa  api") || "",
    name: "clima-embrapa"
  },
  produtos: {
    enabled: false,
    base_url: "",
    api_key: Deno.env.get("API PRODUTOS") || "",
    name: "produtos"
  },
  biologicos: {
    enabled: false,
    base_url: "",
    api_key: Deno.env.get("api de biologicoos") || "",
    name: "biologicos"
  },
  smart_solo: {
    enabled: false,
    base_url: "",
    api_key: Deno.env.get("smart solo") || "",
    name: "smart-solo"
  }
};

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// Configurações
const RAG_SIMILARITY_THRESHOLD = 0.7;
const REQUEST_TIMEOUT = 5000;
const MAX_RETRIES = 1;

// Utilities
function generateCorrelationId(): string {
  return crypto.randomUUID();
}

function log(level: string, message: string, correlation_id?: string, extra?: any) {
  const timestamp = new Date().toISOString();
  console.log(JSON.stringify({
    timestamp,
    level,
    correlation_id,
    message,
    ...extra
  }));
}

function extractKeywords(input: string, max = 5) {
  return input
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 4)
    .slice(0, max);
}

// Timeout wrapper com retry
async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = REQUEST_TIMEOUT, retries = MAX_RETRIES): Promise<Response> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      if (attempt === retries) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt))); // exponential backoff
    }
  }
  throw new Error('Max retries exceeded');
}

async function searchLocalContext(question: string, correlation_id: string) {
  const startTime = Date.now();
  
  try {
    const keywords = extractKeywords(question);
    if (keywords.length === 0) {
      log("info", "No keywords extracted for local search", correlation_id);
      return [];
    }

    // Busca por similaridade textual (ilike) - futuramente migrar para embeddings
    const orFilter = keywords.map((k) => `content.ilike.%${k}%`).join(",");
    const { data, error } = await supabase
      .from("document_chunks")
      .select("content, document_id, token_count")
      .or(orFilter)
      .limit(8);

    const latency = Date.now() - startTime;
    
    if (error) {
      log("error", "Local search failed", correlation_id, { error: error.message, latency });
      return [];
    }

    const chunks = data ?? [];
    log("info", "Local search completed", correlation_id, { 
      chunks_found: chunks.length, 
      keywords: keywords.length,
      latency 
    });

    return chunks;
  } catch (error) {
    const latency = Date.now() - startTime;
    log("error", "Local search exception", correlation_id, { error: error.message, latency });
    return [];
  }
}

async function answerWithOpenAI(question: string, snippets: { content: string }[], correlation_id: string, mode: "rag" | "general" = "rag") {
  const startTime = Date.now();
  
  if (!OPENAI_API_KEY) {
    log("warn", "OPENAI_API_KEY missing - cannot generate AI response", correlation_id);
    return null;
  }

  try {
    let systemPrompt = "Você é a I.A Ludmila, assistente técnica agrícola do FlowAgro. Responda de forma objetiva e prática.";
    let userContent = question;

    if (mode === "rag" && snippets.length > 0) {
      const context = snippets.map((s, i) => `Fonte ${i + 1}:\n${s.content}`).join("\n\n").slice(0, 8000);
      systemPrompt += " Use SEMPRE o contexto fornecido quando relevante, mas complemente com conhecimento geral se necessário.";
      userContent = `Pergunta: ${question}\n\nContexto dos documentos:\n${context}`;
    } else {
      systemPrompt += " Responda com base no seu conhecimento geral sobre agricultura. Seja específico e técnico.";
      userContent = `Pergunta: ${question}`;
    }

    const body = {
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent }
      ],
      temperature: 0.2,
    };

    const response = await fetchWithTimeout("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const latency = Date.now() - startTime;

    if (!response.ok) {
      const errorText = await response.text();
      log("error", "OpenAI API error", correlation_id, { 
        status: response.status, 
        error: errorText, 
        latency,
        mode 
      });
      return null;
    }

    const json = await response.json();
    const answer = json?.choices?.[0]?.message?.content?.trim();
    
    log("info", "OpenAI response generated", correlation_id, { 
      mode, 
      context_chunks: snippets.length,
      latency,
      success: !!answer 
    });

    return answer || null;
  } catch (error) {
    const latency = Date.now() - startTime;
    log("error", "OpenAI request failed", correlation_id, { error: error.message, latency, mode });
    return null;
  }
}

// Validação de APIs (todas desabilitadas até termos endpoints reais)
function validateApiRegistry() {
  let enabledCount = 0;
  
  for (const [key, api] of Object.entries(API_REGISTRY)) {
    // Desabilita automaticamente se URL inválida ou ausente
    if (!api.base_url || !api.base_url.startsWith("http")) {
      api.enabled = false;
      if (api.api_key) {
        log("warn", `API ${key} disabled: invalid/missing base_url`, undefined, { api_key_present: !!api.api_key });
      }
    }
    
    if (api.enabled) {
      enabledCount++;
      log("info", `API ${key} enabled`, undefined, { base_url: api.base_url });
    }
  }
  
  log("info", "API registry validation complete", undefined, { enabled_apis: enabledCount });
  return enabledCount;
}

// Placeholder para futuras integrações (quando tivermos URLs reais)
async function queryExternalAPIs(question: string, correlation_id: string) {
  const enabledApis = Object.values(API_REGISTRY).filter(api => api.enabled);
  
  if (enabledApis.length === 0) {
    log("info", "No external APIs enabled - skipping", correlation_id);
    return null;
  }
  
  // TODO: Implementar quando tivermos endpoints reais
  log("warn", "External API integration not yet implemented", correlation_id);
  return null;
}

// Inicialização
validateApiRegistry();

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const correlation_id = generateCorrelationId();
  const requestStart = Date.now();

  try {
    const payload = (await req.json()) as ChatPayload;
    const question = (payload?.message || "").trim();

    log("info", "Chat request received", correlation_id, { question_length: question.length });

    if (!question) {
      log("warn", "Empty question received", correlation_id);
      return new Response(JSON.stringify({ 
        error: "Pergunta é obrigatória",
        correlation_id 
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let finalAnswer = null;
    let finalSource = "general";

    // 1) Busca RAG local com contexto
    const snippets = await searchLocalContext(question, correlation_id);
    
    if (snippets.length > 0) {
      log("info", "Local context found - attempting RAG", correlation_id, { chunks: snippets.length });
      const ragAnswer = await answerWithOpenAI(question, snippets, correlation_id, "rag");
      
      if (ragAnswer) {
        finalAnswer = ragAnswer;
        finalSource = "local";
        log("info", "RAG response generated successfully", correlation_id);
      } else {
        log("warn", "RAG generation failed despite having context", correlation_id);
      }
    } else {
      log("info", "No local context found", correlation_id);
    }

    // 2) Fallback: OpenAI geral (conhecimento base)
    if (!finalAnswer) {
      log("info", "Using OpenAI general fallback", correlation_id);
      const generalAnswer = await answerWithOpenAI(question, [], correlation_id, "general");
      
      if (generalAnswer) {
        finalAnswer = generalAnswer;
        finalSource = "general";
        log("info", "General AI response generated", correlation_id);
      } else {
        log("error", "Both RAG and general AI failed", correlation_id);
      }
    }

    // 3) Caso ainda não tenha resposta, tenta APIs externas (placeholder)
    if (!finalAnswer) {
      const externalResult = await queryExternalAPIs(question, correlation_id);
      if (externalResult) {
        finalAnswer = externalResult.answer;
        finalSource = externalResult.source;
      }
    }

    const totalLatency = Date.now() - requestStart;

    // 4) Resposta final ou erro
    if (finalAnswer) {
      log("info", "Request completed successfully", correlation_id, { 
        source: finalSource, 
        total_latency: totalLatency 
      });
      
      return new Response(JSON.stringify({ 
        answer: finalAnswer, 
        source: finalSource,
        correlation_id 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } else {
      log("error", "All fallback methods failed", correlation_id, { total_latency: totalLatency });
      
      return new Response(JSON.stringify({ 
        error: "Não consegui gerar uma resposta no momento. Tente novamente em instantes.",
        correlation_id 
      }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

  } catch (e) {
    const totalLatency = Date.now() - requestStart;
    log("error", "Unhandled exception in ai-chat", correlation_id, { 
      error: e.message, 
      total_latency: totalLatency 
    });
    
    return new Response(JSON.stringify({ 
      error: "Erro interno. Nossa equipe foi notificada.",
      correlation_id 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
