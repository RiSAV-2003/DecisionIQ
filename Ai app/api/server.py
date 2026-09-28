from fastapi import FastAPI
from core.pipeline import run_pipeline

app = FastAPI()

@app.get("/")
def home():
    return {"message": "AI App Compiler Running"}

@app.post("/generate")
def generate(prompt: str):
    return run_pipeline(prompt)