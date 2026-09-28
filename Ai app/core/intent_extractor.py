def extract_intent(prompt: str):
    prompt = prompt.lower()

    features = []
    roles = ["user"]

    if "login" in prompt:
        features.append("authentication")

    if "dashboard" in prompt:
        features.append("dashboard")

    if "contact" in prompt:
        features.append("contacts")

    if "payment" in prompt:
        features.append("payments")

    if "admin" in prompt:
        roles.append("admin")

    return {
        "app_type": "custom_app",
        "features": features,
        "roles": roles,
        "raw_prompt": prompt
    }