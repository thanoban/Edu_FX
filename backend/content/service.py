from database import supabase

def get_all_subtopics():
    result = supabase.table("subtopics").select("*").order("order_index").execute()
    return result.data