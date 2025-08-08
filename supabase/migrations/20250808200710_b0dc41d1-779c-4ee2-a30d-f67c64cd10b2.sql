
-- 1) Extensão pgvector (para embeddings)
create extension if not exists vector;

-- 2) Tabela de documentos (metadados e texto integral opcional)
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  drive_file_id text unique,
  title text not null,
  modified_time timestamptz,
  checksum text,
  url text,
  mime_type text,
  size bigint,
  full_text text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3) Tabela de chunks com embedding
-- Usaremos OpenAI text-embedding-3-small (dimensão 1536)
create table if not exists public.document_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  chunk_index int not null,
  content text not null,
  embedding vector(1536),
  token_count int,
  created_at timestamptz not null default now()
);

-- 4) Índices úteis
create index if not exists document_chunks_document_id_idx on public.document_chunks (document_id);
-- Índice de similaridade (ivfflat) – requer ANALYZE após popular a tabela para melhor performance
create index if not exists document_chunks_embedding_idx
  on public.document_chunks
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

-- 5) RLS
alter table public.documents enable row level security;
alter table public.document_chunks enable row level security;

-- Observação:
-- Consultas serão realizadas por Edge Functions usando a service role key, que ignora RLS por definição.
-- Assim, por ora, não criamos políticas de SELECT públicas. Caso no futuro deseje exposição direta ao frontend, criaremos políticas específicas.
