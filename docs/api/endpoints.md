# API Reference

## Auth
- `POST /api/v1/auth/wallet` — Verify wallet signature → return JWT

## Escrow
- `POST /api/v1/escrow/create` — Create agreement record
- `POST /api/v1/escrow/release` — Trigger deposit release

## Inspection
- `POST /api/v1/inspection/submit` — Upload videos, trigger AI
- `GET  /api/v1/inspection/{id}` — Get verdict result

## Storage
- `POST /api/v1/storage/upload` — Upload & hash media file
- `GET  /api/v1/storage/{hash}` — Retrieve file by hash
