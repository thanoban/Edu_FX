"""
One-time script: read content table → chunk → embed → insert into content_chunks.
Re-run whenever content rows are updated.

Usage:
    cd backend
    python -m rag.ingest
"""

import sys
import textwrap

from database import supabase
from rag.embedder import embed


CHUNK_WORDS = 250
OVERLAP_WORDS = 30


def _chunk_text(text: str) -> list[str]:
    words = text.split()
    chunks: list[str] = []
    start = 0
    while start < len(words):
        end = min(start + CHUNK_WORDS, len(words))
        chunks.append(" ".join(words[start:end]))
        if end == len(words):
            break
        start += CHUNK_WORDS - OVERLAP_WORDS
    return chunks


def run() -> None:
    print("Fetching content rows...")
    rows = supabase.table("content").select("id, subtopic_id, level, body").execute()
    if not rows.data:
        print("No content rows found. Add notes to the content table first.")
        sys.exit(1)

    print(f"Found {len(rows.data)} content rows. Chunking and embedding...")

    records: list[dict] = []
    for row in rows.data:
        chunks = _chunk_text(row["body"])
        for chunk in chunks:
            vector = embed(chunk)
            records.append(
                {
                    "subtopic_id": row["subtopic_id"],
                    "level": row["level"],
                    "source": "notes",
                    "chunk_text": chunk,
                    "embedding": vector,
                }
            )

    print(f"Inserting {len(records)} chunks into content_chunks...")

    # Clear old chunks before re-inserting so we don't accumulate duplicates
    supabase.table("content_chunks").delete().neq("id", 0).execute()

    # Batch insert in groups of 100 to stay within Supabase row limits
    batch = 100
    for i in range(0, len(records), batch):
        supabase.table("content_chunks").insert(records[i : i + batch]).execute()
        print(f"  {min(i + batch, len(records))} / {len(records)}")

    print("Done. content_chunks table is ready for RAG retrieval.")


if __name__ == "__main__":
    run()
