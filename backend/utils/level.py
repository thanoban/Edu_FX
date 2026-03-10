def score_to_level(score_percent: int) -> str:
    if score_percent <= 40:
        return "beginner"
    elif score_percent <= 70:
        return "intermediate"
    else:
        return "advanced"

def update_level(current_level: str, score_percent: int) -> str:
    levels = ["beginner", "intermediate", "advanced"]
    current_index = levels.index(current_level)

    if score_percent < 40:
        new_index = max(0, current_index - 1)
    elif score_percent <= 70:
        new_index = current_index
    else:
        new_index = min(2, current_index + 1)

    return levels[new_index]