import streamlit as st
import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from core.pipeline import run_pipeline

st.set_page_config(page_title="AI App Compiler", layout="wide")

st.title(" AI App Compiler")
st.write("Convert idea → working app config")

prompt = st.text_area("Enter your app idea:")

if st.button("Generate"):
    if prompt.strip() == "":
        st.warning("Please enter a prompt")
    else:
        with st.spinner("Generating..."):
            result = run_pipeline(prompt)

        st.subheader(" Generated Config")
        st.json(result["config"])

        st.subheader(" Execution Result")
        st.write(result["execution"])