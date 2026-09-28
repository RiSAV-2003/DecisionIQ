def design_system(intent):
    entities = ["User"]

    if "contacts" in intent["features"]:
        entities.append("Contact")

    if "payments" in intent["features"]:
        entities.append("Payment")

    flows = ["login"] if "authentication" in intent["features"] else []

    return {
        "entities": entities,
        "roles": intent["roles"],
        "flows": flows,
        "features": intent["features"]
    }