from datetime import date, timedelta

def days_since(last_studied_date) -> int:
    if last_studied_date is None:
        return 999
    if isinstance(last_studied_date, str):
        last_studied_date = date.fromisoformat(last_studied_date)
    return (date.today() - last_studied_date).days

def is_on_cooldown(last_studied_date) -> bool:
    if last_studied_date is None:
        return False
    if isinstance(last_studied_date, str):
        last_studied_date = date.fromisoformat(last_studied_date)
    yesterday = date.today() - timedelta(days=1)
    return last_studied_date >= yesterday