/**
 * Supabase Edge Function: ingest-pdf
 * Ingere PDFs para a base de conhecimento do RAG
 * - Extrai texto do PDF
 * - Faz chunking inteligente 
 * - Gera embeddings (OpenAI)
 * - Salva em documents + document_chunks
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY") || "";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// Configurações
const CHUNK_SIZE = 800; // tokens aproximados
const CHUNK_OVERLAP = 100;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

function log(level: string, message: string, extra?: any) {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    function: "ingest-pdf", 
    message,
    ...extra
  }));
}

// Extração de texto com biblioteca PDF real
async function extractTextFromPDF(pdfBytes: Uint8Array): Promise<string> {
  try {
    // Tenta usar pdf-parse (biblioteca dedicada para PDFs)
    log("info", "Attempting PDF parsing with pdf-parse");
    
    const response = await fetch("https://esm.sh/pdf-parse@1.1.1", {
      method: "GET",
      headers: { "Accept": "application/javascript" }
    });
    
    if (response.ok) {
      const pdfParseCode = await response.text();
      const pdfParse = eval(`(${pdfParseCode})`);
      
      const pdfData = await pdfParse(pdfBytes);
      
      if (pdfData.text && pdfData.text.trim().length > 0) {
        log("info", "PDF parsing successful", { 
          text_length: pdfData.text.length,
          pages: pdfData.numpages || 0 
        });
        return cleanExtractedText(pdfData.text);
      }
    }
    
    log("warn", "PDF parsing failed, using fallback method");
    return extractTextFallback(pdfBytes);
    
  } catch (error) {
    log("error", "PDF parsing error, using fallback", { error: error.message });
    return extractTextFallback(pdfBytes);
  }
}

// Método de fallback para extração de texto
function extractTextFallback(pdfBytes: Uint8Array): string {
  try {
    log("info", "Using fallback text extraction");
    
    const decoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: false });
    let rawText = decoder.decode(pdfBytes);
    
    // Tenta extrair padrões de texto legível
    const textPatterns = [
      // Palavras em português (agricultura)
      /\b(?:solo|planta|cultura|praga|doença|adubação|calcário|pH|nutriente|irrigação|plantio|colheita|produção|rendimento)[a-záéíóúàèìòùãõâêîôûç]*\b/gi,
      // Palavras técnicas agrícolas
      /\b(?:nitrogênio|fósforo|potássio|NPK|micronutriente|macronutriente|fertilizante|defensivo|herbicida|fungicida|inseticida)[a-záéíóúàèìòùãõâêîôûç]*\b/gi,
      // Medidas e unidades
      /\d+[\.,]?\d*\s*(?:kg|g|mg|ha|m²|cm|mm|L|ml|°C|%|ppm|pH)/gi,
      // Frases técnicas
      /[A-ZÁÉÍÓÚÀÈÌÒÙÃÕÂÊÎÔÛÇ][a-záéíóúàèìòùãõâêîôûç\s,.-]{10,100}[.!?]/g,
    ];
    
    let extractedText = '';
    textPatterns.forEach(pattern => {
      const matches = rawText.match(pattern) || [];
      extractedText += matches.join(' ') + ' ';
    });
    
    if (extractedText.trim().length < 100) {
      log("warn", "Fallback extraction yielded little text", { length: extractedText.length });
      return 'Conteúdo do PDF não pôde ser extraído adequadamente. Verifique se o arquivo não está protegido, corrompido, ou se é uma imagem escaneada.';
    }
    
    const cleanedText = cleanExtractedText(extractedText);
    log("info", "Fallback extraction completed", { text_length: cleanedText.length });
    return cleanedText;
    
  } catch (error) {
    log("error", "Fallback extraction failed", { error: error.message });
    return 'Erro ao processar PDF. Arquivo pode estar corrompido ou em formato incompatível.';
  }
}

// Limpa e normaliza texto extraído
function cleanExtractedText(text: string): string {
  return text
    // Remove caracteres de controle
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, ' ')
    // Normaliza quebras de linha
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    // Remove espaços extras mas preserva estrutura
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    // Remove espaços no início/fim de linhas
    .split('\n')
    .map(line => line.trim())
    .join('\n')
    .trim();
}

// Chunking inteligente por sentenças
function chunkText(text: string): string[] {
  if (!text || text.length < 100) return [text];
  
  // Split por parágrafos primeiro
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  const chunks: string[] = [];
  let currentChunk = "";
  
  for (const paragraph of paragraphs) {
    // Se o parágrafo + chunk atual for muito grande, finaliza chunk
    if (currentChunk.length + paragraph.length > CHUNK_SIZE && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      
      // Overlap: mantém últimas sentenças do chunk anterior
      const sentences = currentChunk.split(/[.!?]+/).filter(s => s.trim().length > 0);
      const overlapSentences = sentences.slice(-2).join('. ');
      currentChunk = overlapSentences + (overlapSentences ? '. ' : '') + paragraph;
    } else {
      currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
    }
  }
  
  // Adiciona último chunk se houver
  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim());
  }
  
  log("info", "Text chunked", { total_chunks: chunks.length, avg_chunk_size: Math.round(chunks.reduce((sum, c) => sum + c.length, 0) / chunks.length) });
  return chunks.filter(chunk => chunk.length > 50); // Remove chunks muito pequenos
}

// Geração de embeddings via OpenAI
async function generateEmbedding(text: string): Promise<number[] | null> {
  if (!OPENAI_API_KEY) {
    log("warn", "OPENAI_API_KEY missing - skipping embedding generation");
    return null;
  }
  
  try {
    const response = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "text-embedding-3-small", // Modelo mais barato e eficiente
        input: text.slice(0, 8000), // Limita tamanho para API
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      log("error", "OpenAI embeddings API error", { status: response.status, error });
      return null;
    }

    const result = await response.json();
    return result.data[0]?.embedding || null;
  } catch (error) {
    log("error", "Embedding generation failed", { error: error.message });
    return null;
  }
}

// Salvar documento na base
async function saveDocument(title: string, fullText: string, checksum: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from("documents")
      .insert({
        title,
        full_text: fullText,
        checksum,
        size: fullText.length,
        mime_type: "application/pdf",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (error) {
      log("error", "Failed to save document", { error: error.message });
      return null;
    }

    log("info", "Document saved", { document_id: data.id });
    return data.id;
  } catch (error) {
    log("error", "Document save exception", { error: error.message });
    return null;
  }
}

// Salvar chunks com embeddings
async function saveDocumentChunks(documentId: string, chunks: string[]): Promise<number> {
  let savedCount = 0;
  
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const tokenCount = Math.ceil(chunk.length / 4); // Aproximação: 4 chars ≈ 1 token
    
    // Gera embedding para o chunk
    const embedding = await generateEmbedding(chunk);
    
    try {
      const { error } = await supabase
        .from("document_chunks")
        .insert({
          document_id: documentId,
          chunk_index: i,
          content: chunk,
          token_count: tokenCount,
          embedding: embedding ? JSON.stringify(embedding) : null, // Temporário até configurar pgvector
        });

      if (error) {
        log("error", "Failed to save chunk", { chunk_index: i, error: error.message });
      } else {
        savedCount++;
      }
    } catch (error) {
      log("error", "Chunk save exception", { chunk_index: i, error: error.message });
    }
  }
  
  log("info", "Document chunks saved", { saved_count: savedCount, total_chunks: chunks.length });
  return savedCount;
}

// Checksum simples para evitar duplicatas
function calculateChecksum(content: string): string {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16);
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
    // Parse multipart form data
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const title = (formData.get("title") as string) || file?.name || "Documento sem título";

    if (!file) {
      return new Response(JSON.stringify({ error: "Arquivo PDF é obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validações
    if (file.size > MAX_FILE_SIZE) {
      return new Response(JSON.stringify({ error: `Arquivo muito grande. Máximo: ${MAX_FILE_SIZE / 1024 / 1024}MB` }), {
        status: 413,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!file.type.includes("pdf")) {
      return new Response(JSON.stringify({ error: "Apenas arquivos PDF são suportados" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    log("info", "PDF ingestion started", { filename: file.name, size: file.size });

    // Processa arquivo
    const pdfBytes = new Uint8Array(await file.arrayBuffer());
    const fullText = await extractTextFromPDF(pdfBytes);
    const checksum = calculateChecksum(fullText);

    // Verifica se já existe (por checksum)
    const { data: existingDoc } = await supabase
      .from("documents")
      .select("id")
      .eq("checksum", checksum)
      .single();

    if (existingDoc) {
      log("info", "Document already exists", { existing_id: existingDoc.id });
      return new Response(JSON.stringify({ 
        message: "Documento já existe na base de conhecimento",
        document_id: existingDoc.id,
        status: "exists"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Salva documento
    const documentId = await saveDocument(title, fullText, checksum);
    if (!documentId) {
      throw new Error("Failed to save document");
    }

    // Faz chunking e salva
    const chunks = chunkText(fullText);
    const savedChunks = await saveDocumentChunks(documentId, chunks);

    log("info", "PDF ingestion completed", { 
      document_id: documentId, 
      chunks_saved: savedChunks,
      total_chunks: chunks.length 
    });

    return new Response(JSON.stringify({
      message: "PDF ingerido com sucesso",
      document_id: documentId,
      chunks_created: savedChunks,
      total_text_length: fullText.length,
      status: "success"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    log("error", "PDF ingestion failed", { error: error.message });
    
    return new Response(JSON.stringify({ 
      error: "Falha ao processar PDF. Tente novamente.",
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});