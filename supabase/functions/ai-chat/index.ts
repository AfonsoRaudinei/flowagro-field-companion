
/**
 * Supabase Edge Function: ai-chat
 * - Busca local (document_chunks.content via ilike) para contexto
 * - Se não achar, consulta APIs agrícolas específicas
 * - Responde com JSON: { answer: string, source: 'local' | 'agro-responde' | 'clima-embrapa' | 'produtos' | 'biologicos' | 'smart-solo' }
 *
 * Secrets usados:
 * - SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 * - OPENAI_API_KEY (para gerar resposta com contexto local)
 * - AGRO_RESPONDE_API_KEY, CLIMA_EMBRAPA_API_KEY, etc.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type ChatPayload = {
  message: string;
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY") || "";

// APIs agrícolas - suporte a nomes variados dos secrets
const AGRO_RESPONDE_API = Deno.env.get("agro responde") || Deno.env.get("AGRO_RESPONDE_API_KEY") || "";
const CLIMA_EMBRAPA_API = Deno.env.get("clima embrapa  api") || Deno.env.get("CLIMA_EMBRAPA_API_KEY") || "";
const API_PRODUTOS = Deno.env.get("API PRODUTOS") || Deno.env.get("API_PRODUTOS") || "";
const API_BIOLOGICOS = Deno.env.get("api de biologicoos") || Deno.env.get("API_BIOLOGICOS") || "";
const SMART_SOLO_API = Deno.env.get("smart solo") || Deno.env.get("SMART_SOLO_API_KEY") || "";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// Util simples para extrair palavras-chave
function extractKeywords(input: string, max = 5) {
  return input
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 4)
    .slice(0, max);
}

async function searchLocalContext(question: string) {
  const keywords = extractKeywords(question);
  if (keywords.length === 0) return [];

  // Monta OR para ilike
  const orFilter = keywords.map((k) => `content.ilike.%${k}%`).join(",");
  const { data, error } = await supabase
    .from("document_chunks")
    .select("content, document_id")
    .or(orFilter)
    .limit(8);

  if (error) {
    console.error("Local search error:", error);
    return [];
  }
  return data ?? [];
}

async function answerWithOpenAI(question: string, snippets: { content: string }[]) {
  if (!OPENAI_API_KEY) {
    console.warn("OPENAI_API_KEY ausente — não será possível responder com contexto local.");
    return null;
  }

  const context = snippets.map((s, i) => `Fonte ${i + 1}:\n${s.content}`).join("\n\n").slice(0, 8000);

  const body = {
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "Você é a I.A ludmila, uma assistente técnica agrícola do FlowAgro. Responda de forma objetiva e prática usando, quando possível, o contexto fornecido. Se algo não estiver no contexto, responda com base no seu conhecimento geral, mas nunca invente dados específicos de produtos ou dos documentos.",
      },
      {
        role: "user",
        content:
          `Pergunta do usuário:\n${question}\n\nContexto de documentos (use quando relevante):\n${context}`,
      },
    ],
    temperature: 0.2,
  };

  const resp = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const text = await resp.text();
    console.error("OpenAI error:", resp.status, text);
    return null;
  }
  const json = await resp.json();
  const answer = json?.choices?.[0]?.message?.content?.trim();
  return answer || null;
}

async function queryAgroAPIs(question: string) {
  const keywords = extractKeywords(question);
  const questionLower = question.toLowerCase();
  
  // Determina qual API consultar baseado nas palavras-chave
  if (questionLower.includes("clima") || questionLower.includes("chuva") || questionLower.includes("temperatura")) {
    return await queryClimaEmbrapa(question);
  }
  
  if (questionLower.includes("produto") || questionLower.includes("defensivo") || questionLower.includes("agrotóxico")) {
    return await queryProdutos(question);
  }
  
  if (questionLower.includes("biológico") || questionLower.includes("controle biológico")) {
    return await queryBiologicos(question);
  }
  
  if (questionLower.includes("solo") || questionLower.includes("fertilidade") || questionLower.includes("nutriente")) {
    return await querySmartSolo(question);
  }
  
  // Fallback para Agro Responde (base geral de conhecimento)
  return await queryAgroResponde(question);
}

async function queryAgroResponde(question: string) {
  if (!AGRO_RESPONDE_API) return null;
  
  try {
    // Implementação simplificada - adaptar conforme API real
    const response = await fetch(`${AGRO_RESPONDE_API}/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: question }),
    });
    
    if (!response.ok) return null;
    const data = await response.json();
    return { answer: data.answer || data.response, source: "agro-responde" };
  } catch (error) {
    console.error("Agro Responde API error:", error);
    return null;
  }
}

async function queryClimaEmbrapa(question: string) {
  if (!CLIMA_EMBRAPA_API) return null;
  
  try {
    const response = await fetch(`${CLIMA_EMBRAPA_API}/forecast`, {
      headers: { "Authorization": `Bearer ${CLIMA_EMBRAPA_API}` },
    });
    
    if (!response.ok) return null;
    const data = await response.json();
    return { answer: `Previsão climática: ${data.summary || "Dados indisponíveis"}`, source: "clima-embrapa" };
  } catch (error) {
    console.error("Clima Embrapa API error:", error);
    return null;
  }
}

async function queryProdutos(question: string) {
  if (!API_PRODUTOS) return null;
  
  try {
    const response = await fetch(`${API_PRODUTOS}/products/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: question }),
    });
    
    if (!response.ok) return null;
    const data = await response.json();
    return { answer: data.result || "Nenhum produto encontrado", source: "produtos" };
  } catch (error) {
    console.error("API Produtos error:", error);
    return null;
  }
}

async function queryBiologicos(question: string) {
  if (!API_BIOLOGICOS) return null;
  
  try {
    const response = await fetch(`${API_BIOLOGICOS}/biologicals`, {
      headers: { "Authorization": `Bearer ${API_BIOLOGICOS}` },
    });
    
    if (!response.ok) return null;
    const data = await response.json();
    return { answer: data.description || "Informações sobre biológicos indisponíveis", source: "biologicos" };
  } catch (error) {
    console.error("API Biológicos error:", error);
    return null;
  }
}

async function querySmartSolo(question: string) {
  if (!SMART_SOLO_API) return null;
  
  try {
    const response = await fetch(`${SMART_SOLO_API}/soil/analysis`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${SMART_SOLO_API}`
      },
      body: JSON.stringify({ query: question }),
    });
    
    if (!response.ok) return null;
    const data = await response.json();
    return { answer: data.analysis || "Análise de solo indisponível", source: "smart-solo" };
  } catch (error) {
    console.error("Smart Solo API error:", error);
    return null;
  }
}

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

  try {
    const payload = (await req.json()) as ChatPayload;
    const question = (payload?.message || "").trim();

    if (!question) {
      return new Response(JSON.stringify({ error: "message é obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1) Busca local (document_chunks)
    const snippets = await searchLocalContext(question);

    // 2) Se houver contexto, tenta OpenAI com RAG leve
    if (snippets.length > 0) {
      const ai = await answerWithOpenAI(question, snippets);
      if (ai) {
        return new Response(JSON.stringify({ answer: ai, source: "local" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // 3) Fallback para APIs agrícolas específicas
    const apiResult = await queryAgroAPIs(question);
    if (apiResult) {
      return new Response(JSON.stringify(apiResult), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 4) Falha geral
    return new Response(
      JSON.stringify({ error: "Não foi possível gerar uma resposta no momento." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("ai-chat exception:", e);
    return new Response(JSON.stringify({ error: "Erro interno do servidor." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
