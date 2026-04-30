"""
main.py — RentProof AI Service (FastAPI)

Endpoints:
  POST /inspect           → Run full inspection pipeline, return signed verdict
  GET  /verdict/{job_id}  → Retrieve a stored signed verdict
  GET  /health            → Service health check
  GET  /pubkey            → Return AI service's public key (for smart contract setup)

Run:
    uvicorn src.main:app --port 8001 --reload
"""

import logging
import os
from contextlib import asynccontextmanager
from typing import Optional

from dotenv import load_dotenv
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
)
logger = logging.getLogger(__name__)

# In-memory verdict store — replace with Redis/DB in production
_verdict_store: dict[str, dict] = {}


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Warm up the detector on startup (loads model weights once)
    logger.info("Warming up damage detector…")
    from src.comparison.engine import get_detector
    get_detector()
    logger.info("AI service ready.")
    yield
    logger.info("AI service shutting down.")


app = FastAPI(
    title="RentProof AI Service",
    description="YOLOv8 damage detection + Ed25519 signed verdicts for blockchain escrow.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "http://localhost:3000").split(","),
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# POST /inspect
# ---------------------------------------------------------------------------

@app.post("/inspect", summary="Run damage inspection on move-in and move-out videos")
async def inspect(
    move_in: UploadFile = File(..., description="Move-in video file"),
    move_out: UploadFile = File(..., description="Move-out video file"),
    property_id: Optional[str] = Form(None, description="Property identifier"),
    move_in_hash: Optional[str] = Form(None, description="Expected SHA-256 of move-in video"),
    move_out_hash: Optional[str] = Form(None, description="Expected SHA-256 of move-out video"),
):
    """
    Full inspection pipeline:
    1. Integrity check (if hashes provided)
    2. Frame extraction with quality gate
    3. YOLOv8 damage detection
    4. Severity-weighted scoring
    5. Delta comparison → verdict
    6. Ed25519 signing

    Returns signed verdict ready for blockchain submission.
    """
    from src.comparison.engine import compare_videos
    from src.signing.signer import sign_verdict

    # Read uploads
    try:
        move_in_bytes = await move_in.read()
        move_out_bytes = await move_out.read()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read uploaded files: {e}")

    if not move_in_bytes or not move_out_bytes:
        raise HTTPException(status_code=400, detail="Both move_in and move_out videos are required.")

    # Run pipeline
    try:
        verdict = compare_videos(
            move_in_bytes=move_in_bytes,
            move_out_bytes=move_out_bytes,
            move_in_hash=move_in_hash,
            move_out_hash=move_out_hash,
            property_id=property_id,
        )
    except ValueError as e:
        # Integrity check failure or bad input
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        logger.exception("Unexpected error during inspection pipeline")
        raise HTTPException(status_code=500, detail=f"Inspection failed: {e}")

    # Sign verdict
    try:
        signing_result = sign_verdict(verdict)
    except FileNotFoundError as e:
        raise HTTPException(
            status_code=500,
            detail=f"Signing keys not found. Run scripts/keygen.py first. ({e})"
        )

    # Store for later retrieval
    job_id = verdict["job_id"]
    _verdict_store[job_id] = {
        "verdict": verdict,
        "signing": signing_result,
    }

    logger.info(
        f"Inspection complete — job_id={job_id} verdict={verdict['verdict']} "
        f"delta={verdict['damage_delta']}"
    )

    return {
        "job_id": job_id,
        "verdict": verdict,
        "signing": signing_result,
    }


# ---------------------------------------------------------------------------
# GET /verdict/{job_id}
# ---------------------------------------------------------------------------

@app.get("/verdict/{job_id}", summary="Retrieve a stored signed verdict by job ID")
async def get_verdict(job_id: str):
    """
    Returns the full signed verdict for a past inspection.
    The backend calls this before triggering escrow release to re-verify the signature.
    """
    stored = _verdict_store.get(job_id)
    if not stored:
        raise HTTPException(
            status_code=404,
            detail=f"No verdict found for job_id '{job_id}'. "
                   "Verdicts are held in-memory — restart clears them. "
                   "Use a persistent store in production."
        )
    return stored


# ---------------------------------------------------------------------------
# GET /health
# ---------------------------------------------------------------------------

@app.get("/health", summary="Service health check")
async def health():
    return {
        "status": "ok",
        "service": "rentproof-ai",
        "version": "1.0.0",
    }


# ---------------------------------------------------------------------------
# GET /pubkey
# ---------------------------------------------------------------------------

@app.get("/pubkey", summary="Return AI service Ed25519 public key")
async def pubkey():
    """
    Returns the public key hex for smart contract registration.
    Call this once during contract deployment setup.
    """
    from src.signing.signer import get_public_key_hex
    try:
        hex_key = get_public_key_hex()
    except FileNotFoundError as e:
        raise HTTPException(status_code=500, detail=str(e))

    return {
        "public_key_hex": hex_key,
        "algorithm": "Ed25519",
        "note": "Register this key in your RentProof smart contract to verify AI verdicts on-chain.",
    }
