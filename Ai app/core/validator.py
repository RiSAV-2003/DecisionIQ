def validate_config(config):
    errors = []

    # Check JSON structure
    if "db" not in config:
        errors.append("Missing DB schema")

    if "api" not in config:
        errors.append("Missing API schema")

    if "ui" not in config:
        errors.append("Missing UI schema")

    # Cross-layer validation
    db_fields = []
    for table in config["db"]["tables"]:
        db_fields.extend(table["fields"].keys())

    for ep in config["api"]["endpoints"]:
        for field in ep["request"]:
            if field not in db_fields:
                errors.append(f"Field {field} not in DB")

    return errors