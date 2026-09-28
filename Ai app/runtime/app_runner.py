def run_app(config):
    pages = config["ui"]["pages"]

    output = []
    for page in pages:
        output.append(f"Rendered Page: {page['name']}")

    return {
        "status": "success",
        "pages_rendered": output
    }