from fastapi import APIRouter
router = APIRouter()

@router.get("/")
def escrow_root():
    return {"module": "escrow"}
