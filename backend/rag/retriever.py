from database import supabase
from rag.embedder import embed


def retrieve(query: str, subtopic_id: int, top_k: int = 5) -> list[str]:
    vector = embed(query)

    result = supabase.rpc(
        "match_content_chunks",
        {
            "query_embedding": vector,
            "match_subtopic_id": subtopic_id,
            "match_count": top_k,
        },
    ).execute()

    if not result.data:
        return []

    return [row["chunk_text"] for row in result.data]
