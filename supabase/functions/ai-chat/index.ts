
/**
 * Supabase Edge Function: ai-chat
 * - Busca local (document_chunks.content via ilike) para contexto
 * - Se não achar, fallback Perplexity (badge "Fonte externa")
 * - Responde com JSON: { answer: string, source: 'local' | 'external' }
 *
 * Secrets usados:
 * - SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 * - OPENAI_API_KEY (para gerar resposta com contexto local)
 * - PERPLEXITY_API_KEY (fallback web)
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
const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY") || "";

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

async function answerWithPerplexity(question: string) {
  if (!PERPLEXITY_API_KEY) {
    console.warn("PERPLEXITY_API_KEY ausente — fallback externo indisponível.");
    return null;
  }

  const body = {
    model: "llama-3.1-sonar-small-128k-online",
    messages: [
      { role: "system", content: "Seja preciso e conciso. Cite a fonte quando possível." },
      { role: "user", content: question },
    ],
    temperature: 0.2,
    top_p: 0.9,
    max_tokens: 1000,
    return_images: false,
    return_related_questions: false,
    frequency_penalty: 1,
    presence_penalty: 0,
  };

  const resp = await fetch("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PERPLEXITY_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const text = await resp.text();
    console.error("Perplexity error:", resp.status, text);
    return null;
  }

  const json = await resp.json();
  const answer = json?.choices?.[0]?.message?.content?.trim();
  return answer || null;
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

    // 3) Fallback para Perplexity (Fonte externa)
    const ext = await answerWithPerplexity(question);
    if (ext) {
      return new Response(JSON.stringify({ answer: ext, source: "external" }), {
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
