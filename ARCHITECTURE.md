# Support Portal — Architecture

A 10-minute read to understand the entire application. Updated as the app evolves.

---

## What This Is

A customer support portal for SMYLS clinic customers. Clinic staff submit tickets, SMYLS agents respond. Built on Frappe Helpdesk with a custom Next.js frontend.

## Three Repos

| Repo | Tech | Purpose |
|------|------|---------|
| `support-portal` | Next.js 15, React 19, TypeScript | Frontend — what users see |
| `support-desk` | Python, Frappe Framework | Backend — custom API, overrides, AI features |
| `support-portal-docker` | Docker Compose | Orchestration — ties everything together |

## How a Request Flows

```
Browser (:3000)
  → Next.js page (React component)
    → React Query hook (useTickets, useTicketReplies, etc.)
      → Service layer (TicketService.getTickets)
        → API proxy (/api/frappe/[...path]/route.ts)
          → Frappe backend (:4000)
            → MariaDB
```

**Why the proxy?** Frappe uses cookie-based session auth. The Next.js API route forwards cookies server-side, keeping the Frappe URL out of the browser and enabling future SSR/file proxy features that a direct client→Frappe connection can't do.

## Permission Model (how data isolation works)

```
User email (e.g. sarah@smylsdental.com)
  → Contact (matched by email_id)
    → Dynamic Link (link_doctype: "HD Customer")
      → HD Customer ("SMYLS Dental Toronto")
```

**Result:** `permission_query()` in Helpdesk filters the ticket list by HD Customer. Sarah sees all tickets from her clinic — including ones created by Mike (same clinic) — but nothing from TestClinic Vancouver. This is company-level separation, not per-user.

## Key Architectural Decisions

| # | Decision | Why |
|---|----------|-----|
| 1 | **Company separation via HD Customer** | No ERPNext on this instance, so no Company doctype. HD Customer is the Helpdesk equivalent. Maps 1:1 if we merge to the main Frappe instance later. |
| 2 | **Cookie-based auth** | Frappe session cookies forwarded through the API proxy. No API tokens exposed to the browser. |
| 3 | **No Helpdesk fork** | Customizations go in `support_desk` via `hooks.py` overrides. Upstream updates don't break us. |
| 4 | **Communication for replies, not HD Ticket Comment** | `HD Ticket Comment` is agent-only internal notes. Customer replies use `create_communication_via_contact` → Communication doctype. |
| 5 | **Design system from smyls-portal** | Port design tokens + components from smyls-portal's `design` branch for visual parity with the main app. |
| 6 | **React Query + Zustand, not frappe-react-sdk** | frappe-react-sdk uses SWR and assumes direct Frappe communication. We use React Query (more capable for polling, conditional queries) and route through a proxy. |
| 7 | **Next.js over Vite** | Standalone Docker deployment needs server-side API proxy, private file proxy, SSR for knowledge base. smyls-portal uses Vite because it's bundled inside a Frappe app (same origin). Different deployment model = different framework. |
| 8 | **Helpdesk v1.21.3** | Last version supporting Frappe v15 *and* v16. Keeps the door open for same-instance deployment with smyls-ops (currently v15). |
| 9 | **DOMPurify on all HTML rendering** | Every `dangerouslySetInnerHTML` is sanitized via `safeHtml()` or `sanitizeHtml()`. No raw user HTML touches the DOM. |
| 10 | **AI features are non-blocking** | Auto-categorization, suggested replies, summarization all fail gracefully. AI unavailability never blocks core functionality. |

## The Most Important Files

| File | What It Does |
|------|-------------|
| `src/app/api/frappe/[...path]/route.ts` | **API Proxy** — forwards all `/api/frappe/*` requests to Frappe with cookies. The single chokepoint for all backend communication. |
| `src/store/auth.ts` | **Auth Store** — Zustand store with login/logout/session validation. Persists user + isAuthenticated + role flags (isAgent/isAdmin/isCustomer) to localStorage. Fetches roles from Helpdesk's `get_user` API. |
| `src/lib/services/ticket-service.ts` | **Ticket Service** — all ticket CRUD. Uses `get_one` for replies (whitelisted, respects permissions), `run_doc_method` for creating replies. |
| `src/lib/services/types.ts` | **Service Interfaces** — `ITicketService`, `IArticleService` contracts + field lists. The service factory swaps real/demo implementations. |
| `src/types/frappe.ts` | **Type Definitions** — HDTicket, HDCommunication, HDTicketComment, HDArticle. Source of truth for Frappe doctype shapes. |
| `src/lib/api.ts` | **FrappeAPIClient** — Axios wrapper with interceptors, error formatting, cookie forwarding. The low-level HTTP layer. |
| `src/app/(customer)/layout.tsx` | **Customer Layout** — auth guard + sidebar wrapper for all customer pages. Redirects agents to `/admin`. |
| `src/app/(admin)/layout.tsx` | **Admin Layout** — auth guard + admin sidebar for agent pages. Redirects non-agents to `/dashboard`. |
| `src/app/(customer)/dashboard/page.tsx` | **Dashboard** — customer ticket list with search, status filter, sort. Entry point after login. |
| `src/app/(customer)/tickets/[id]/page.tsx` | **Ticket Detail** — full conversation thread, reply form. Uses `sent_or_received` to distinguish agent vs customer messages. |
| `src/app/(customer)/tickets/new/page.tsx` | **Create Ticket** — RHF form with subject, rich text (TipTap), type, priority, screen recording, KB suggestions. |
| `src/app/(admin)/admin/tickets/page.tsx` | **Admin Ticket List** — all tickets with server-side filtering, pagination, StatusBadge. |
| `src/app/(admin)/admin/tickets/[id]/page.tsx` | **Admin Ticket Detail** — metadata sidebar, reply/note modes, AI suggest/summarize, status/assignment changes. |
| `src/lib/services/admin-ticket-service.ts` | **Admin Service** — agent-specific API (list, detail, reply, assign, filter). |
| `src/components/screen-recorder/ScreenRecorder.tsx` | **Screen Recorder** — browser capture → preview → upload to Frappe. |
| `src/lib/format.ts` | **Formatters** — `safeHtml()` (sanitize + transform URLs), `stripHtml()`, `formatDate()`. |
| `src/hooks/use-ai.ts` | **AI Hooks** — categorize, suggest reply, summarize via support_desk backend. |

## Data Flow Examples

### Creating a Ticket
```
User fills form → handleSubmit()
  → useCreateTicket().mutateAsync(data)
    → TicketService.createTicket(data)
      → POST /api/frappe/resource/HD Ticket
        → Frappe creates ticket, auto-calls set_customer()
        → set_customer() links ticket to HD Customer via Contact → Dynamic Link
  → React Query invalidates ['tickets']
  → Redirect to /dashboard
```

### Replying to a Ticket (customer)
```
User types reply → handleSubmitReply()
  → useAddReply().mutate(content)
    → TicketService.addTicketReply(ticketId, content)
      → POST /api/frappe/method/run_doc_method
        → { dt: "HD Ticket", dn: ticketId, method: "create_communication_via_contact", args: { message } }
        → Frappe creates Communication record (sent_or_received: "Received")
  → React Query invalidates ['ticket-replies', ticketId]
```

### Loading Replies
```
Ticket detail page mounts
  → useTicketReplies(ticketId) [polls every 30s]
    → TicketService.getTicketReplies(ticketId)
      → GET /api/frappe/method/helpdesk.helpdesk.doctype.hd_ticket.api.get_one?name=ticketId
        → Frappe checks has_permission("HD Ticket")
        → Queries Communication records internally (ignore_permissions)
        → Returns { communications: [...] }
  → UI renders: "Received" = customer (left), "Sent" = agent (right, branded)
```

## Docker Services

| Service | Image | Port | Purpose |
|---------|-------|------|---------|
| sp-backend | sp-helpdesk:v15 | 8000 (internal) | Gunicorn (Frappe + Helpdesk + Telephony + support_desk) |
| sp-frontend | sp-helpdesk:v15 | 4000 → 8080 | Nginx reverse proxy for Frappe Desk |
| sp-portal | Next.js | 4080 → 3000 | Customer/admin portal frontend |
| sp-websocket | sp-helpdesk:v15 | 9000 (internal) | Socket.IO for real-time |
| sp-mariadb | mariadb:10.6 | 4306 → 3306 | Database |
| sp-redis-cache | redis:6.2-alpine | internal | Caching |
| sp-redis-queue | redis:6.2-alpine | internal | Job queue + Socket.IO |
| sp-queue-short | sp-helpdesk:v15 | — | Background jobs (short/default) |
| sp-queue-long | sp-helpdesk:v15 | — | Background jobs (long) |
| sp-scheduler | sp-helpdesk:v15 | — | Cron-like task scheduler |
| sp-mailpit | mailpit:v1.29 | 9025 → 8025 | Email testing (dev only) |

## Test Accounts

| Email | Password | Role | Company |
|-------|----------|------|---------|
| Administrator | admin | Admin | — |
| agent@smyls.com | Agent@2026! | Agent | — |
| sarah@smylsdental.com | Portal@2026! | Customer | SMYLS Dental Toronto |
| mike@smylsdental.com | Portal@2026! | Customer | SMYLS Dental Toronto |
| lisa@testclinic.com | Portal@2026! | Customer | TestClinic Vancouver |
| james@testclinic.com | Portal@2026! | Customer | TestClinic Vancouver |
