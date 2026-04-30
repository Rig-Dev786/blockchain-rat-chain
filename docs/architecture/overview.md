# RentProof — System Architecture

## Flow
1. Tenant connects MetaMask → signs rental agreement
2. Deposit locked in `RentProofEscrow` smart contract (Polygon)
3. Move-in video uploaded → hashed (SHA-256) → stored (S3/IPFS)
4. At move-out: video uploaded → AI pipeline runs comparison
5. YOLOv8 detects damage → verdict signed → sent to backend
6. Backend calls escrow contract → deposit released automatically

## Services
- **Frontend** :3000 — Next.js UI
- **Backend** :8000 — FastAPI orchestrator
- **AI Service** :8001 — Damage detection microservice
- **PostgreSQL** :5432 — Agreements & metadata
- **Polygon** — Smart contract execution
