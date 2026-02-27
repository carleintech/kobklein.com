# KobKlein — Security & Compliance Reference

## Encryption

### At Rest
| Data | Method |
|------|--------|
| Virtual card numbers | AES-256 app-layer (`cardNumberEnc` field) |
| Transaction PINs | bcrypt hash (`transactionPinHash` field) |
| KYC documents (ID, selfie, address proof) | Private Supabase Storage bucket (`kyc-documents`) — no public URLs |
| Database at rest | Supabase managed encryption (AES-256, SOC 2 Type II) |

### In Transit
- TLS 1.3 enforced on all endpoints (Vercel CDN + Railway ingress)
- HSTS headers set by Vercel on all production domains

---

## PCI-DSS Controls

| Control | Implementation |
|---------|---------------|
| No raw card data in logs | Sentry `beforeSend` strips `authorization`, `cookie`, `file`, `idNumber`, `fullName`, `dob` before any event is sent |
| No card numbers in plaintext | Only `cardNumberEnc` (AES-256) stored; raw PAN never persisted |
| Access control | All API routes require JWKS-verified ES256 JWT (`SupabaseGuard`); admin routes require `admin` role (`RolesGuard`) |
| Rate limiting | 120 req/min per IP via Redis; graceful degradation if Redis unavailable |
| Audit trail | `AuditLog` table records all financial events — immutable, indexed by `actorUserId`, `eventType`, `createdAt` |

---

## Data Retention (Regulatory)

| Data type | Retention | Regulation |
|-----------|-----------|------------|
| Transaction records | 7 years | BRH (Banque de la République d'Haïti) |
| KYC documents | 5 years | Haiti AML Law + FATF recommendations |
| Audit logs | 5 years | Financial record-keeping standards |
| Session tokens | Expiry per Supabase JWT TTL | — |

---

## AML / Compliance Architecture

Rule-based AML engine (`apps/api/src/aml/aml.service.ts`):

| Rule | Threshold | Severity |
|------|-----------|----------|
| Velocity — transfers | 5/hour or 10/24h | medium → high |
| Structuring detection | 90–99% of BRH reporting threshold (HTG 250k / USD 3k) | high |
| Large cash operations | HTG 500k / USD 5k on cash_in/out | high |
| Sanctioned countries | IR, KP, SY, CU, VE | critical |

Flagged transactions → `AmlFlag` record → case creation → optional account freeze.
Admin resolves via `PATCH /v1/admin/aml/:flagId/resolve`.

---

## Incident Response Flow

```
AML flag triggered
  │
  ▼ severity = critical → auto-freeze account + hold funds
  │
  ▼ Case created (caseType: fraud_investigation)
  │
  ▼ Admin notified → reviews case in admin dashboard (/risk, /cases)
  │
  ▼ Admin action: approve reversal / release hold / escalate to BRH
```

---

## Responsible Disclosure

To report a security vulnerability, email **security@kobklein.com**.
Please do not disclose publicly before we have had 90 days to remediate.

---

*Last updated: February 22, 2026*
