# Dev Endpoints for Testing the Flight Status → Telegram Message Pipeline

## Overview

In dev/mock mode, the AeroDataBox client always returns `status: 'Scheduled'`, so the poller never detects a change and the pipeline sits idle. These three dev-only endpoints let you manually simulate a flight progressing through `SCHEDULED → DEPARTED → EN_ROUTE → ARRIVED` and trigger message dispatch.

All endpoints are gated behind `NODE_ENV === 'development'`.

## Endpoints

### 1. `POST /api/dev/simulate-status`

Simulates a flight status change and triggers message creation — the same code path the poller uses in production.

- Accepts `{ flight_id, new_status }`
- Updates the flight record (status, status_version, timestamps like actual_departure/arrival)
- Checks `isSignificantStatusChange()` and calls `handleFlightStatusChange()` for all active subscriptions
- Returns what happened (old/new status, how many subscriptions were notified)

**Valid statuses:** `SCHEDULED`, `DEPARTED`, `EN_ROUTE`, `ARRIVED`, `DELAYED`, `CANCELED`

```bash
curl -X POST localhost:3000/api/dev/simulate-status \
  -H "Content-Type: application/json" \
  -d '{"flight_id": "uuid-here", "new_status": "DEPARTED"}'
```

### 2. `POST /api/dev/trigger-scheduler`

Manually fires a scheduler tick so you don't have to wait 60s after simulating a change.

- Calls `runSchedulerTick()` to immediately pick up and dispatch pending messages
- Returns processed/sent/failed/skipped counts

```bash
curl -X POST localhost:3000/api/dev/trigger-scheduler
```

### 3. `GET /api/dev/pipeline-status`

Dashboard endpoint to see the full pipeline state at a glance.

- Returns flights, subscriptions (with nested receivers), and recent messages
- Supports `?flight_id=...` to filter to a specific flight
- Includes summary counts by message status (PENDING, SENT, FAILED, etc.)

```bash
curl localhost:3000/api/dev/pipeline-status
curl "localhost:3000/api/dev/pipeline-status?flight_id=uuid-here"
```

## End-to-End Testing Flow

```bash
# 1. Create subscription via UI (POST /api/subscriptions with MOCK_FLIGHTS=true)

# 2. Receiver clicks Telegram opt-in link (t.me/FlightagramBot?start=TOKEN)

# 3. Simulate departure
curl -X POST localhost:3000/api/dev/simulate-status \
  -H "Content-Type: application/json" \
  -d '{"flight_id": "...", "new_status": "DEPARTED"}'

# 4. Dispatch messages immediately
curl -X POST localhost:3000/api/dev/trigger-scheduler
# → Telegram message delivered to receiver

# 5. Continue the lifecycle
curl -X POST localhost:3000/api/dev/simulate-status \
  -H "Content-Type: application/json" \
  -d '{"flight_id": "...", "new_status": "EN_ROUTE"}'
curl -X POST localhost:3000/api/dev/trigger-scheduler

curl -X POST localhost:3000/api/dev/simulate-status \
  -H "Content-Type: application/json" \
  -d '{"flight_id": "...", "new_status": "ARRIVED"}'
curl -X POST localhost:3000/api/dev/trigger-scheduler

# 6. Check state at any point
curl localhost:3000/api/dev/pipeline-status
```

## Key Pipeline Files

| File | Role |
|------|------|
| `lib/flights/poller.ts` | Polls AeroDataBox every 5 min (production) |
| `app/api/webhooks/aerodatabox/route.ts` | Receives ADB push notifications (production) |
| `lib/messages/dispatcher.ts` | `handleFlightStatusChange()` creates PENDING messages |
| `lib/scheduler/index.ts` | `runSchedulerTick()` dispatches PENDING messages via adapters |
| `lib/aerodatabox/mapper.ts` | `isSignificantStatusChange()` determines if a transition warrants notifications |
| `lib/supabase/admin.ts` | `createAdminClient()` for DB access |
