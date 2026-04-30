# Backend — FastAPI

## Setup
```bash
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload
```

## Endpoints
- `/api/v1/inspection/` — AI inspection trigger & verdict
- `/api/v1/escrow/` — Blockchain escrow actions
- `/api/v1/auth/` — Wallet + JWT auth
- `/api/v1/storage/` — Upload / retrieve media
