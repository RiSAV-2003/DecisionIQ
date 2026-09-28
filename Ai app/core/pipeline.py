from core.intent_extractor import extract_intent
from core.system_designer import design_system
from core.schema_generator import generate_schema
from core.validator import validate_config
from core.repair_engine import repair_config
from runtime.app_runner import run_app

def run_pipeline(prompt: str):
    # Stage 1
    intent = extract_intent(prompt)

    # Stage 2
    system = design_system(intent)

    # Stage 3
    config = generate_schema(system)

    # Stage 4 - Validation + Repair Loop
    for _ in range(3):
        errors = validate_config(config)
        if not errors:
            break
        config = repair_config(config, errors)

    # Execution Simulation
    execution_result = run_app(config)

    return {
        "config": config,
        "execution": execution_result
    }