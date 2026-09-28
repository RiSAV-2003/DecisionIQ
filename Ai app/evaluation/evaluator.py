import json
from core.pipeline import run_pipeline

def evaluate():
    with open("evaluation/dataset.json") as f:
        data = json.load(f)

    success = 0

    for item in data:
        result = run_pipeline(item["prompt"])
        if result["execution"]["status"] == "success":
            success += 1

    print("Success Rate:", success / len(data))

if __name__ == "__main__":
    evaluate()