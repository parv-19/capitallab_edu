Python ingestion worker for robust long-document extraction.

Recommended for:
- Long CFA Level 1 / Level 2 PDFs
- CMA study packs
- Mixed-quality PDFs where Node-side extraction is unreliable

Install:

```bash
cd backend/python
python -m pip install -r requirements.txt
```

Environment variables used by the Node backend:

- `PYTHON_INGESTION_ENABLED=true`
- `PYTHON_EXECUTABLE=python`
- `PYTHON_INGESTION_TIMEOUT_MS=300000`

Architecture:

- Python handles extraction only.
- Node still owns embeddings, vector storage, retrieval, and chat guardrails.
- If Python extraction fails, the backend can still fall back to the existing Node parser.
