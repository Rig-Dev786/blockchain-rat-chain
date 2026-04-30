from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.endpoints import auth, escrow, inspection, storage

app = FastAPI(title="RentProof API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(escrow.router, prefix="/api/v1/escrow", tags=["escrow"])
app.include_router(inspection.router, prefix="/api/v1/inspection", tags=["inspection"])
app.include_router(storage.router, prefix="/api/v1/storage", tags=["storage"])

@app.get("/health")
def health():
    return {"status": "ok"}
