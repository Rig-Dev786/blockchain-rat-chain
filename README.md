# 🏠 RentProof

> Trustless, automated rental agreements powered by Web3, AI, and smart contracts.

RentProof eliminates blind trust in the rental process. Deposits are locked in blockchain escrow, AI inspects properties to detect damage, and smart contracts release funds automatically — no disputes, no middlemen.

---

## 🧱 Architecture Overview

```
rentproof/
├── frontend/       → Next.js + Tailwind + wagmi (MetaMask)
├── backend/        → FastAPI (AI integration, security, blockchain API)
├── blockchain/     → Solidity smart contracts (Thirdweb + Polygon)
├── ai/             → YOLOv8 + OpenCV damage detection pipeline
└── docs/           → Architecture diagrams, API docs, contract specs
```

## 🚀 Quick Start

```bash
# Clone the repo
git clone https://github.com/your-org/rentproof.git
cd rentproof

# Setup each module
cd frontend && npm install
cd ../backend && pip install -r requirements.txt
cd ../blockchain && npm install
cd ../ai && pip install -r requirements.txt
```

## 🔗 Tech Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js, Tailwind CSS, wagmi, MetaMask |
| Backend | FastAPI, PostgreSQL, JWT |
| Blockchain | Solidity, Thirdweb, Polygon, Ethers.js |
| AI/CV | YOLOv8, PyTorch, OpenCV, Albumentations |
| Storage | AWS S3 / IPFS |
| Security | SHA-256, AES, Wallet Auth |

## 👥 Team

Built with ❤️ at ALTARIA
