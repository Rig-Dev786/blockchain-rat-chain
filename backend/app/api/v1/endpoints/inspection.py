from fastapi import APIRouter
router = APIRouter()

@router.get("/")
def inspection_root():
    return {"module": "inspection"}
