def generate_schema(system):
    db_tables = []

    # Users table
    db_tables.append({
        "name": "users",
        "fields": {
            "id": "uuid",
            "email": "string",
            "password": "string",
            "role": "string"
        }
    })

    if "Contact" in system["entities"]:
        db_tables.append({
            "name": "contacts",
            "fields": {
                "id": "uuid",
                "name": "string",
                "email": "string"
            }
        })

    api = [
        {
            "path": "/login",
            "method": "POST",
            "request": ["email", "password"],
            "response": ["token"]
        }
    ]

    ui_pages = [
        {"name": "Login", "components": ["form", "button"]},
        {"name": "Dashboard", "components": ["stats"]}
    ]

    return {
        "db": {"tables": db_tables},
        "api": {"endpoints": api},
        "ui": {"pages": ui_pages},
        "auth": {
            "roles": {
                role: ["*"] if role == "admin" else ["read"]
                for role in system["roles"]
            }
        }
    }