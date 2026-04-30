# Blockchain — Solidity + Sepolia

## Setup
```bash
npm install
npx hardhat compile
npx hardhat test

# Sepolia (testnet)
cp .env.example .env
npx hardhat compile
npx hardhat test
npm run deploy:sepolia

## Agreement Flow (Sepolia)
```bash
# 1) Record "before" media on-chain using MediaRegistry
npm run media:record

# 2) Create agreement with deposit + before media IDs
npm run agreement:create

# 3) Record "after" media on-chain
npm run media:record

# 4) Attach after media IDs to agreement
npm run agreement:after

# 5) Record AI verdict (damage score + deduction)
npm run agreement:ai

# 6) Release deposit based on AI verdict
npm run agreement:release
```
```
