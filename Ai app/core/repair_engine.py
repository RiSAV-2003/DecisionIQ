def repair_config(config, errors):
    for error in errors:

        if "Missing DB schema" in error:
            config["db"] = {"tables": []}

        if "Field" in error:
            # auto-add missing field to users table
            field_name = error.split(" ")[1]

            for table in config["db"]["tables"]:
                if table["name"] == "users":
                    table["fields"][field_name] = "string"

    return config