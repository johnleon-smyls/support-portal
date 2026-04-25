# Support Portal — Development Changelog

A running record of every phase, what changed, why, and how it fits together. Designed so you can read this end-to-end and understand the full application architecture.

---

## Phase 1: Foundation & Infrastructure

### 1.0 Pre-flight Checks
- Switched GitHub CLI to `johnleon-smyls` account (company-linked, public repos)
- Stopped smyls-ops Docker stack (10 containers) to free laptop resources
- Reviewed uncommitted changes in smyls-ops — minor port mapping + README, safe to leave

### 1.1 Initialize support-portal-docker
- **Repo:** `johnleon-smyls/support-portal-docker` (public)
- Pinned Helpdesk to **v1.21.3** (last version supporting both Frappe v15 and v16)
  - *Why v15:* SMYLS ops runs Frappe v15. If we merge to the same instance later, we need version compatibility.
  - *Why not v1.22.2:* It requires Frappe >= 16, which would block same-instance deployment.
- Initial commit: `docker-compose.yml`, `apps.json`, `.env.example`, `.gitignore`

### 1.2 Build Docker Image & Boot Stack
- Built custom Frappe v15 image (`sp-helpdesk:v15`) using `sp-frappe-docker/images/custom/Containerfile`
  - Build args: `FRAPPE_BRANCH=version-15`, `PYTHON_VERSION=3.12.12`, `APPS_JSON_BASE64` (helpdesk + telephony)
- **Bug found & fixed:** Docker Compose mounted empty volumes over `/apps` and `/env`, hiding the image's baked-in content → `No module named 'frappe'`
  - *Fix:* Removed `sp-apps-data`, `sp-env-data`, `sp-logs-data` volume mounts. Only `sp-sites-data` is needed (matching official `frappe_docker` pattern).
- **11 services running:** sp-mariadb, sp-redis-cache, sp-redis-queue, sp-configurator, sp-create-site, sp-backend, sp-frontend, sp-websocket, sp-queue-short, sp-queue-long, sp-scheduler, sp-mailpit
- **Ports:** Frappe Desk `:4000`, Portal `:4080`, MariaDB `:4306`, Mailpit `:9025`

### 1.3 Scaffold support_desk Custom Frappe App
- **Repo:** `johnleon-smyls/support-desk` (public)
- Scaffolded with `bench new-app support_desk` inside the running container
- Added `overrides/` and `api/` module directories for future customizations
- Set `required_apps = ["helpdesk"]` in `hooks.py`
- Installed on site: `bench --site support-portal.local install-app support_desk`
- **Apps installed:** frappe 15.106.0, helpdesk 1.21.3, telephony 0.0.1, support_desk 0.0.1

### 1.4 Connect Next.js to Local Frappe
- Updated `.env.local`: `NEXT_PUBLIC_FRAPPE_BASE_URL=http://localhost:4000`
- Commented out `FRAPPE_INTERNAL_URL` (Docker-internal hostname, only used when Next.js runs inside Docker)
- Disabled demo mode: `NEXT_PUBLIC_DEMO_MODE=false`
- Verified: API proxy at `localhost:3000/api/frappe/*` forwards to Frappe at `localhost:4000`

### 1.5 Set Up Test Data
- **HD Customers:** "SMYLS Dental Toronto", "TestClinic Vancouver"
- **Portal Users** (password: `Portal@2026!`):
  - sarah@smylsdental.com, mike@smylsdental.com → linked to SMYLS Dental Toronto
  - lisa@testclinic.com, james@testclinic.com → linked to TestClinic Vancouver
- **Agent User:** agent@smyls.com (password: `Agent@2026!`), roles: Agent + System Manager
- **Contacts:** Each portal user has a Contact record with a Dynamic Link to their HD Customer
- **Sample Tickets:** 4 tickets (2 per clinic) with realistic subjects
- **Data isolation verified:** Sarah sees only Clinic A tickets, Lisa sees only Clinic B. Mike (same clinic as Sarah) sees Sarah's tickets — company-level visibility works.

**Key files:**
- `support-portal-docker/docker-compose.yml` — 12-service orchestration
- `support-portal-docker/apps.json` — helpdesk v1.21.3 + telephony
- `support-desk/support_desk/hooks.py` — custom Frappe app config
- `Support Portal/.env.local` — frontend environment config

---

## Phase 2: Frontend Architecture Overhaul

### 2.1 Fix Reply Model (CRITICAL BUG)
**Problem:** The frontend created `HD Ticket Comment` records for replies. But `HD Ticket Comment` is for **internal agent comments only** — `new_comment()` throws `PermissionError` for non-agents. Customer replies would silently fail or error.

**Root cause analysis:**
- Helpdesk has two reply mechanisms:
  1. `create_communication_via_contact` → creates a `Communication` record (customer-facing, triggers email)
  2. `reply_via_agent` → creates a `Communication` record (agent-facing, sends email to customer)
  3. `new_comment` → creates `HD Ticket Comment` (internal, agent-only, no email)
- The frontend was using #3 for all replies, which is wrong for portal users.

**Permission discovery:** Portal users (Website Users) can't read the `Communication` doctype via REST API. But Helpdesk's `get_one` whitelisted method returns communications as part of the ticket data, using `has_permission("HD Ticket")` as the gate. This is the correct approach.

**Changes:**
| File | What Changed |
|------|-------------|
| `src/types/frappe.ts` | `HDCommunication` now models the `Communication` doctype (sender, sent_or_received, communication_type). Added `HDTicketComment` as separate type. Expanded `HDTicket.status` to include Replied/Resolved. Renamed priority Critical → Urgent. |
| `src/lib/services/types.ts` | `REPLY_FIELDS` updated for Communication fields |
| `src/lib/services/ticket-service.ts` | `getTicketReplies` uses `get_one` API (whitelisted, returns communications). `addTicketReply` uses `run_doc_method` with `create_communication_via_contact`. |
| `src/lib/api.ts` | Same changes in the FrappeAPIClient class |
| `src/app/tickets/[id]/page.tsx` | Reply rendering uses `reply.sender` instead of `reply.commented_by`. Agent detection via `sent_or_received === 'Sent'` instead of name heuristics. |
| `src/app/tickets/new/page.tsx` | Priority type updated to use `'Urgent'` |
| `src/lib/demo-data.ts` | Demo replies updated with Communication fields |
| `src/lib/demo-api.ts` | Demo API updated |
| `src/lib/services/demo-ticket-service.ts` | Demo service updated |

**Strategy:** Use Helpdesk's built-in whitelisted methods rather than direct REST access to doctypes. This respects the permission model without needing to grant portal users doctype-level access to Communication.

### 2.3 Auth Store Role Detection
**Problem:** The auth store stored `roles: []` and `user_type: 'System User'` for all users. No way to distinguish agent from customer in the frontend — needed for admin vs customer routing.

**Discovery:** Helpdesk has a `helpdesk.api.auth.get_user` whitelisted method that returns `is_agent`, `is_admin`, `is_manager`, `has_desk_access` — exactly what we need. Portal users can call it (it's whitelisted). No need to query `Has Role` or `User` doctype directly.

**Changes:**
| File | What Changed |
|------|-------------|
| `src/types/auth.ts` | Added `is_agent`, `is_admin`, `is_manager`, `has_desk_access` to `FrappeUser`. Added `isAgent`, `isAdmin`, `isCustomer` to `AuthStore`. |
| `src/store/auth.ts` | Added `fetchHelpdeskRoles()` helper that calls `helpdesk.api.auth.get_user`. Called after login and during session rehydration. Role flags persisted to localStorage. |

**Strategy:** Leverage Helpdesk's existing auth API rather than building our own role detection. The `is_agent` check is based on HD Agent records, which is the correct source of truth for Helpdesk (not Frappe roles like "Agent" — those can fall out of sync).

---

## Architecture Overview (updated as we go)

### How the App Works (request flow)

```
Browser (localhost:3000)
  → Next.js App Router (pages, layouts)
    → API Proxy (/api/frappe/[...path]/route.ts)
      → Frappe Backend (localhost:4000)
        → MariaDB (sp-mariadb:3306)
```

### Repo Structure (3 repos)

```
support-portal (Next.js frontend)     — what the user sees
support-desk (Frappe backend app)     — custom backend logic
support-portal-docker (orchestration) — ties everything together
```

### Key Architectural Decisions

1. **Company separation via HD Customer** — not Company doctype (no ERPNext), not Cost Center
2. **Cookie-based auth** — Frappe session cookies forwarded through Next.js API proxy
3. **No Helpdesk fork** — customizations go in support_desk via hooks/overrides
4. **Communication for replies** — not HD Ticket Comment (which is agent-only internal notes)
5. **Design system from smyls-portal** — port tokens + components for visual parity with main app
6. **React Query for server state, Zustand for auth** — not frappe-react-sdk (SWR conflict, proxy incompatibility)
7. **Next.js over Vite** — standalone deployment needs server-side API proxy, file proxy, SSR potential

### Permission Model

```
User email
  → Contact (matched by email_id)
    → Dynamic Link (link_doctype: "HD Customer")
      → HD Customer (company-level grouping)

Ticket visibility: permission_query() in hd_ticket.py filters by HD Customer
Ticket replies: get_one() checks has_permission("HD Ticket"), then queries Communications internally
```
