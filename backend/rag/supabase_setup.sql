-- Run this once in Supabase SQL Editor (Dashboard → SQL Editor → New Query)

-- 1. Enable pgvector extension
create extension if not exists vector;

-- 2. Create content_chunks table
create table if not exists content_chunks (
  id          serial primary key,
  subtopic_id int references subtopics(id),
  level       text,          -- beginner | intermediate | advanced
  source      text,          -- 'notes' | 'past_paper'
  chunk_text  text,
  embedding   vector(384)    -- all-MiniLM-L6-v2 output dimension
);

-- 3. IVFFlat index for fast cosine similarity search
create index if not exists content_chunks_embedding_idx
  on content_chunks
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 50);

-- 4. RPC function used by rag/retriever.py
create or replace function match_content_chunks(
  query_embedding vector(384),
  match_subtopic_id int,
  match_count int default 5
)
returns table (
  id          int,
  chunk_text  text,
  similarity  float
)
language sql stable
as $$
  select
    id,
    chunk_text,
    1 - (embedding <=> query_embedding) as similarity
  from content_chunks
  where subtopic_id = match_subtopic_id
  order by embedding <=> query_embedding
  limit match_count;
$$;
