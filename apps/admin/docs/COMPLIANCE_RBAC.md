# KobKlein Platform — Governance & RBAC Compliance Documentation

**Classification:** Internal Confidential — For Regulatory Submission
**Version:** 2.0 — February 2026
**Prepared by:** KobKlein Technology Team
**Jurisdiction:** Republic of Haiti — Banque de la République d'Haïti (BRH)

---

## 1. Overview

KobKlein operates a **10-role, permission-layered administrative control system** governing access to all platform functions. This document describes the Role-Based Access Control (RBAC) architecture, dual-control enforcement mechanisms, audit trail provisions, risk-segregation design, and HR/staff governance controls.

All platform operations are governed by:

1. **Least Privilege** — each operator has access only to the functions strictly necessary for their designated role
2. **Separation of Duties** — no single role can initiate, approve, and execute the same action
3. **Dual-Control** — 16 high-risk actions require a second approver from a different role
4. **Immutable Audit** — all actions are permanently logged; no role can delete audit entries
5. **No Self-Approval** — a user cannot approve their own initiated action
6. **No Shared Accounts** — every human must have a unique personal account

---

## 2. Role Access Matrix (RBAC Table)

### 2.1 Admin Sub-Roles — 10 Institutional Roles

| Role | Description | Access Tier | Key Restriction |
|------|-------------|-------------|-----------------|
| `super_admin` | Governance authority. Full control + emergency kill switches + dual-control approver | **Unrestricted** | Cannot approve own actions |
| `admin` | Operations supervisor. Day-to-day platform management | **Operational** | No FX / fees / limits / system config / emergency controls |
| `regional_manager` | Region-scoped network operations. KYC, merchant/agent management | **Regional** | All queries filtered by `region_id`. No global config |
| `support_agent` | L1/L2 customer support. View + freeze + escalate only | **Support** | No approvals, no financial modifications |
| `compliance_officer` | AML/KYC authority. Independent from operations | **Compliance** | No financial config, no FX, no treasury |
| `treasury_officer` | Float, FX, settlements, fees, limits — finance-only scope | **Finance** | No user management, no compliance override, no system config |
| `hr_manager` | Staff governance lifecycle. People ops only | **HR** | No operational access, no financial data, no compliance |
| `investor` | Partner/investor aggregated read-only. No PII | **Read-Only** | Data must be pre-aggregated and anonymized |
| `auditor` | External independent read-only. Full audit trail access + export | **Read-Only** | Cannot approve, modify, or execute any state change |
| `broadcaster` | Notification hub only. Controlled messaging | **Restricted** | No financial data access. Global broadcasts require dual-control |

### 2.2 Full Permission Matrix

✅ = Permitted · ❌ = Denied · ⚠️ = Dual-control required

| Permission | super | admin | regional | support | compliance | treasury | hr | investor | auditor | broadcast |
|------------|:-----:|:-----:|:--------:|:-------:|:----------:|:--------:|:--:|:--------:|:-------:|:---------:|
| **USER MANAGEMENT** | | | | | | | | | | |
| user:read | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| user:write | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| user:freeze | ⚠️ | ⚠️ | ⚠️ | ❌ | ⚠️ | ❌ | ❌ | ❌ | ❌ | ❌ |
| user:freeze_permanent | ⚠️ | ❌ | ❌ | ❌ | ⚠️ | ❌ | ❌ | ❌ | ❌ | ❌ |
| user:delete | ⚠️ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| user:role_assign | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **KYC / IDENTITY** | | | | | | | | | | |
| kyc:read | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| kyc:approve_basic | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| kyc:approve_high_risk | ✅ | ❌ | ❌ | ❌ | ⚠️ | ❌ | ❌ | ❌ | ❌ | ❌ |
| kyc:reject | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| kyc:override | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **TRANSACTIONS** | | | | | | | | | | |
| tx:read | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅¹ | ✅ | ❌ |
| tx:approve | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| tx:reverse | ⚠️ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| tx:flag | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| tx:export | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| **FLOAT / TREASURY** | | | | | | | | | | |
| float:read | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ | ✅¹ | ✅ | ❌ |
| float:adjust | ⚠️ | ❌ | ❌ | ❌ | ❌ | ⚠️ | ❌ | ❌ | ❌ | ❌ |
| float:transfer | ⚠️ | ❌ | ❌ | ❌ | ❌ | ⚠️ | ❌ | ❌ | ❌ | ❌ |
| **FX CONTROL** | | | | | | | | | | |
| fx:read | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ | ✅¹ | ✅ | ❌ |
| fx:adjust | ⚠️ | ❌ | ❌ | ❌ | ❌ | ⚠️ | ❌ | ❌ | ❌ | ❌ |
| **FEES & LIMITS** | | | | | | | | | | |
| fees:read | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| fees:adjust | ⚠️ | ❌ | ❌ | ❌ | ❌ | ⚠️ | ❌ | ❌ | ❌ | ❌ |
| limits:read | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| limits:adjust | ⚠️ | ❌ | ❌ | ❌ | ❌ | ⚠️ | ❌ | ❌ | ❌ | ❌ |
| **SETTLEMENTS** | | | | | | | | | | |
| settlement:read | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| settlement:release | ⚠️ | ❌ | ❌ | ❌ | ❌ | ⚠️ | ❌ | ❌ | ❌ | ❌ |
| **COMPLIANCE / AML** | | | | | | | | | | |
| compliance:read | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| compliance:configure | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| compliance:file_sar | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **NOTIFICATIONS** | | | | | | | | | | |
| notif:read | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ |
| notif:send_direct | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ✅ |
| notif:send_segment | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| notif:send_global | ✅ | ⚠️ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ⚠️ |
| **AUDIT** | | | | | | | | | | |
| audit:read | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |
| audit:export | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ |
| **ANALYTICS** | | | | | | | | | | |
| analytics:read | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ | ✅¹ | ✅ | ❌ |
| analytics:export | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ | ✅¹ | ✅ | ❌ |
| **HR / STAFF GOVERNANCE** | | | | | | | | | | |
| hr:view_directory | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |
| hr:create_staff | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| hr:assign_role | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| hr:deactivate | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| hr:offboard | ⚠️ | ❌ | ❌ | ❌ | ❌ | ❌ | ⚠️ | ❌ | ❌ | ❌ |
| **TRAINING** | | | | | | | | | | |
| training:read | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| training:assign | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| training:view_reports | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| **EMERGENCY CONTROLS** | | | | | | | | | | |
| emergency:global_freeze | ⚠️ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| emergency:region_freeze | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| emergency:fx_halt | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| emergency:payout_freeze | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **SYSTEM** | | | | | | | | | | |
| system:config | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| system:admin_create | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| system:admin_delete | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

> ¹ Investor access: aggregated, anonymized data only. No individual user PII.
> ⚠️ Dual-control required — see Section 4.

---

## 3. Risk Segregation Architecture

### 3.1 Five-Tier Risk Model

```
┌─────────────────────────────────────────────────────────────────────────┐
│  TIER 1 — GOVERNANCE LAYER (super_admin only)                           │
│  ● Emergency kill switches (global freeze, FX halt, payout freeze)      │
│  ● System configuration                                                  │
│  ● Admin account deletion                                                │
│  ● Transaction reversal                                                  │
│  ● Dual-control approval authority                                       │
├─────────────────────────────────────────────────────────────────────────┤
│  TIER 2 — SPECIALIZED AUTHORITY                                          │
│  ● compliance_officer: AML/KYC authority, SAR filing, PEP oversight     │
│  ● treasury_officer: Float, FX, settlements, fees, limits               │
│  ● hr_manager: Staff lifecycle, training enforcement, access reviews     │
├─────────────────────────────────────────────────────────────────────────┤
│  TIER 3 — OPERATIONS LAYER (admin + regional_manager)                   │
│  ● KYC approval / rejection (basic risk only)                            │
│  ● Merchant / agent approval & suspension                                │
│  ● User account freeze (with dual-control)                               │
│  ● regional_manager: ALL queries filtered by region_id                  │
├─────────────────────────────────────────────────────────────────────────┤
│  TIER 4 — SUPPORT LAYER (support_agent + broadcaster)                   │
│  ● User profile read-only                                                │
│  ● Transaction flagging                                                  │
│  ● Risk escalation                                                       │
│  ● Broadcaster: notification creation with approval workflow             │
├─────────────────────────────────────────────────────────────────────────┤
│  TIER 5 — OBSERVATION LAYER (auditor · investor)                        │
│  ● Read-only within their domain — cannot approve, modify, or execute   │
│  ● Auditor: full audit trail + export for regulatory reporting           │
│  ● Investor: pre-aggregated, anonymized metrics only (no PII)           │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Role Conflict Prevention

The following role combinations are PROHIBITED for a single operator:

| Conflict | Reason |
|----------|--------|
| operations (admin) + finance config (treasury_officer) | Finance policy independence |
| operations (admin) + compliance authority | Compliance independence |
| KYC reviewer + KYC high-risk approver | Self-approval prevention |
| Float initiator + Float approver | Dual-control segregation |
| Auditor + any write permission | Independence preservation |
| HR manager + any operational access | Staff governance isolation |

### 3.3 Immutable Audit Log

All write operations, approvals, and state changes are recorded in an append-only audit log:
- **Stored in:** `AuditLog` Prisma model (PostgreSQL)
- **Retention:** 7 years (regulatory minimum — BRH Circular 97-1)
- **Fields:** `actorId`, `actorRole`, `action`, `entityType`, `entityId`, `before`, `after`, `ipAddress`, `timestamp`
- **Access:** Read-only for auditors + super_admin; read + export for compliance_officer
- **Tamper protection:** Log entries cannot be modified or deleted via any API endpoint
- **Emergency actions:** Separately tracked in immutable emergency action log

---

## 4. Dual-Control Enforcement

All 16 high-risk actions below require a **second approver from a different role** before the backend executes the state change. The initiator and approver must be different authenticated users.

| Action | Initiator Role(s) | Required Approver | Threshold |
|--------|------------------|-------------------|-----------|
| Temporary user freeze | admin, regional_manager, compliance_officer | super_admin or compliance_officer | Any |
| Permanent user freeze | compliance_officer | super_admin | Any |
| Permanent user deletion | super_admin | auditor (counter-sign) | Any |
| Approve high-risk KYC | compliance_officer | super_admin | Any |
| Reverse completed transaction | super_admin | compliance_officer | Any |
| Manual wallet adjustment | treasury_officer | super_admin | Any |
| Manual float adjustment | treasury_officer | super_admin | Any |
| Float pool transfer | treasury_officer | super_admin | ≥ 100,000 HTG |
| FX rate modification | treasury_officer | super_admin | Any |
| Merchant fee schedule change | treasury_officer | super_admin | Any |
| Transaction limit modification | treasury_officer | super_admin | Any |
| Release held settlement | treasury_officer | super_admin | Any |
| Platform-wide broadcast | broadcaster or admin | super_admin or admin | Any |
| Global platform freeze | super_admin | super_admin (different account) | Any |
| System configuration change | super_admin | super_admin (+ MFA re-auth) | Any |
| Staff permanent offboarding | hr_manager | super_admin | Any |

**Technical implementation:**
- Backend `DualControlService` (`apps/api/src/policies/dual-control.service.ts`) manages PendingApproval records
- Initiator submits action → receives `requestId`
- Approver authenticates separately and calls `POST /v1/admin/dual-control/approve/:requestId`
- Backend enforces: `approver.id ≠ initiator.id` AND `approverRole ∈ action.approvers`
- Both JWT subjects are logged in the audit trail with timestamp
- Pending approvals expire after 24 hours
- Rejection also permanently logged

---

## 5. Regional Governance

### 5.1 Region Scope Enforcement

The `regional_manager` role is scoped to a single geographic region stored in `user_metadata.region_id`.

**Backend enforcement** (`apps/api/src/policies/region-scope.helper.ts`):
```
// Every query by a regional_manager is automatically filtered:
const regionFilter = getRegionFilter(req);
const users = await prisma.user.findMany({ where: { ...regionFilter, role: "client" } });
```

- If `role === "regional_manager"` and no `region_id` is set → 403 Forbidden
- If accessing a record from a different region → 403 Forbidden
- Regional managers cannot access global analytics, FX, fees, limits, or system config

### 5.2 Region-Specific Emergency Controls

Super_admin can freeze transactions for a single region without a global freeze (`POST /v1/admin/emergency/region-freeze`). This is logged separately as a surgical intervention.

---

## 6. Access Control Architecture

### 6.1 Authentication

- **Provider:** Supabase Auth (ES256 JWT, JWKS-verified at `/auth/v1/.well-known/jwks.json`)
- **Token storage:** HTTP-only cookies (no localStorage exposure)
- **Session refresh:** Next.js middleware refreshes session on every request
- **Role storage:** `user_metadata.admin_role` in Supabase JWT
- **MFA:** Mandatory for all roles with write permissions (TOTP via Supabase)

### 6.2 Three-Layer Authorization Model

```
Request
  │
  ▼ 1. Next.js Middleware (apps/admin/src/middleware.ts)
  │   └─ Validates Supabase session cookie
  │   └─ Checks ADMIN_ROLES set membership (10 roles)
  │   └─ Enforces page-level ACL via canAccess()
  │   └─ Enforces training compliance before sensitive pages
  │
  ▼ 2. RolesGuard (apps/api/src/policies/roles.guard.ts)
  │   └─ Verifies JWT via Supabase JWKS (ES256)
  │   └─ Extracts role from user_metadata.admin_role
  │   └─ ADMIN_FAMILY: all 10 sub-roles satisfy @Roles("admin")
  │   └─ Emergency endpoints: @Roles("super_admin") only
  │
  ▼ 3. PermissionsGuard (apps/api/src/policies/permissions.guard.ts)
      └─ @RequiresPermission("kyc:approve_high_risk") etc.
      └─ Checks ROLE_PERMISSIONS matrix per role
      └─ Returns 403 with missing permissions listed
      └─ Region filter enforced via getRegionFilter()
```

---

## 7. HR & Staff Governance

### 7.1 Staff Lifecycle Controls

| Lifecycle Stage | Responsible Role | Action |
|-----------------|-----------------|--------|
| Invitation / onboarding | hr_manager | Create Supabase account with role metadata |
| Role assignment | hr_manager (hr:assign_role) | Set `user_metadata.admin_role` |
| Mandatory training | hr_manager (training:assign) | Assign and verify completion |
| Suspension | hr_manager (hr:deactivate) | Ban via Supabase Management API |
| Permanent offboard | hr_manager → super_admin approval | Dual-control: both logged |
| Quarterly access review | hr_manager (hr:access_review) | Review all privileged access |

### 7.2 Training Enforcement

- All staff with write permissions must complete role-specific training every 180 days
- Staff with `trainingStatus === "overdue"` are blocked from sensitive pages via middleware
- Training status is stored in `user_metadata.trainingCompletedAt`
- `hr_manager` and `compliance_officer` can view compliance reports across all staff
- `exempt` status is granted only to read-only roles (auditor, investor)

---

## 8. Data Protection & Privacy

### 8.1 PII Access Controls

| Data Category | super | admin | regional | support | compliance | treasury | hr | investor | auditor | broadcast |
|---------------|:-----:|:-----:|:--------:|:-------:|:----------:|:--------:|:--:|:--------:|:-------:|:---------:|
| Full name | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |
| Email address | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |
| Phone number | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ |
| National ID | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ |
| Transaction history | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | Aggregated | ✅ | ❌ |
| Wallet balance | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ | Aggregated | ✅ | ❌ |
| Staff records | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |

### 8.2 Investor Data Isolation

The `investor` role accesses only pre-aggregated, anonymized platform metrics:
- Total user count, active merchant count, platform float
- Transaction volume aggregates (no individual transactions)
- Network growth metrics (no individual user PII)
- Aggregation is enforced at the API layer before response serialization

---

## 9. Emergency Controls

### 9.1 Kill Switches (super_admin only)

| Control | Effect | Logged |
|---------|--------|--------|
| Global Transaction Freeze | Halts ALL transactions network-wide | ✅ Immutable |
| FX Rate Halt | Locks exchange rates, blocks conversions | ✅ Immutable |
| Payout & Settlement Freeze | Holds all disbursements | ✅ Immutable |
| KYC Approval Lockout | Pauses all identity verifications | ✅ Immutable |
| Notification Blackout | Blocks all outbound notifications | ✅ Immutable |
| API Read-Only Mode | All write ops return 503 | ✅ Immutable |
| Region-Specific Freeze | Surgical freeze for a single region | ✅ Immutable |

- Every activation/reversal requires a written reason
- Both activation and reversal are permanently logged (cannot be deleted)
- Emergency Action Log is separate from the main AuditLog for regulatory access

---

## 10. Compliance Controls Summary

| Control | Implementation | Standard |
|---------|---------------|----------|
| Multi-factor authentication | Supabase TOTP (mandatory for write roles) | NIST 800-63B |
| Session management | HTTP-only cookie, 30-min inactivity timeout | OWASP ASVS |
| Role-based access control | 10-role RBAC with 35+ granular permissions | ISO 27001 A.9 |
| Separation of duties | No single role can initiate + approve + execute | SOC 2 CC6 |
| Dual-control enforcement | 16 high-risk actions require second approver | BRH Directive |
| Audit logging | Append-only, 7-year retention, immutable | BRH Circular 97-1 |
| Least privilege | Explicit allow-lists per role | ISO 27001 A.9.2 |
| Data minimization | Investor/broadcaster data isolation + anonymization | GDPR Art. 5(1)(c) |
| Access reviews | Quarterly HR access review cycle | ISO 27001 A.9.2.5 |
| Training enforcement | Mandatory 180-day cycle, blocks access if overdue | Internal Policy |
| Regional scope isolation | All regional_manager queries filtered by region_id | Internal Policy |
| Emergency controls | 7 kill switches with permanent audit trail | BRH Directive |
| No shared accounts | One account per human, enforced by HR governance | Internal Policy |

---

## 11. Incident Response & Escalation

| Scenario | Responsible Role | Action |
|----------|-----------------|--------|
| Suspicious transaction detected | support_agent | Flag → regional_manager or compliance_officer reviews |
| KYC fraud identified | compliance_officer | SAR filing → permanent freeze (dual-control with super_admin) |
| AML threshold breach | compliance_officer | Compliance report → BRH notification |
| Float discrepancy | treasury_officer | Dual-control reconciliation with super_admin |
| Mass withdrawal attack | super_admin | Global Transaction Freeze → emergency broadcast |
| System breach attempt | super_admin + auditor | API read-only mode + audit export |
| Regulatory inquiry | auditor | audit:export → full trail for BRH submission |
| Staff misconduct | hr_manager | Suspend → offboard (dual-control with super_admin) |

---

## 12. Document Control

| Version | Date | Author | Change |
|---------|------|--------|--------|
| 1.0 | 2026-02-25 | KobKlein Tech | Initial release — 7-role RBAC |
| 2.0 | 2026-02-26 | KobKlein Tech | Expanded to 10 roles: +compliance_officer, +treasury_officer, +hr_manager. Added dual-control registry (16 actions), emergency controls, regional governance, training enforcement, HR lifecycle, region scope enforcement |

*This document is maintained in `apps/admin/docs/COMPLIANCE_RBAC.md` and is versioned with the platform codebase.*
