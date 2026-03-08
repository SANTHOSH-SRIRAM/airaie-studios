# Handoff — 2026-03-07 Bug Fix Session

## Session Summary
Fixed 6 bugs across frontend (board-studio) and backend (airaie-kernel) triggered by console errors on the Wing Cert - Full Demo board.

## Fixes Applied

### 1. "undefined: [object Object]" in Card KPI Display
- **Root cause**: Backend `CardKPI` sends `metric_key`/`target_value` but frontend `transformCard()` expected `key`/`value`
- **Files changed**:
  - `studios/apps/board-studio/src/api/cards.ts` — uses `kpi.metric_key` and `kpi.target_value`
  - `studios/apps/board-studio/src/types/board.ts` — `BackendCard.kpis` type matches Go model
  - `studios/apps/board-studio/src/components/boards/CardComponent.tsx` — safe KPI rendering, filters `undefined` keys, stringifies objects

### 2. Plan 404 Retry Spam
- **Root cause**: TanStack Query retries 3x on 404 (expected for cards without plans)
- **Files changed**:
  - `studios/apps/board-studio/src/hooks/usePlan.ts` — `retry: false`, `staleTime: 30_000` on `usePlan` and `usePlanExecutionStatus`

### 3. Nested `<button>` Hydration Error
- **Root cause**: `OutlineSection` rendered `action` prop (a `<button>`) inside an outer `<button>`
- **Files changed**:
  - `studios/apps/board-studio/src/components/studio/OutlinePanel.tsx` — outer `<button>` → `<div role="button">`

### 4. Plan Generate 400 Bad Request (Empty Body)
- **Root cause**: Frontend `generatePlan()` called `apiClient.post(url)` with NO body; backend `json.Decode` failed on empty body
- **Files changed**:
  - `studios/apps/board-studio/src/api/plans.ts` — sends `{pipeline_id: ""}` body, accepts optional `pipeline_id` param
  - `airaie-kernel/internal/handler/plan.go` — tolerates empty body (ContentLength==0), still rejects malformed JSON

### 5. Pipeline Auto-Selection (Backend)
- **Root cause**: Frontend has no UI to pick a pipeline; backend required `pipeline_id`
- **Files changed**:
  - `airaie-kernel/internal/service/plan_generator.go` — auto-selects pipeline via `ListByIntentType` when `pipeline_id` is empty; extended `PipelineGetStore` interface
  - `airaie-kernel/internal/handler/plan_test.go` — mock implements `ListByIntentType`
  - `airaie-kernel/internal/service/plan_generator_test.go` — mock implements `ListByIntentType`

### 6. Generic Error Messages in PlanExecutionPanel
- **Root cause**: `err instanceof Error` check fails for `APIError` (plain object from axios interceptor), so all errors showed generic fallback text
- **Files changed**:
  - `studios/apps/board-studio/src/components/studio/PlanExecutionPanel.tsx` — uses `(err as any)?.message` to extract APIError message (9 locations)

## Remaining Issue: "Failed to generate plan"
The **actual root cause** is that demo board cards have **no `intent_spec_id`**. The plan generator requires an IntentSpec to function.

**Verified via API**:
```
POST /v0/cards/card_d6ks5rn7go6jim803rg0/plan/generate  {}
→ 400 {"error":{"code":"MISSING_INTENT_SPEC","message":"Card must have an IntentSpec to generate a plan"}}
```

**To fix**: Cards need IntentSpecs created and linked:
1. Create IntentSpec: `POST /v0/boards/{boardId}/intents` with intent_type, inputs, acceptance_criteria
2. Link to card: `PATCH /v0/cards/{cardId}` with `intent_spec_id`
3. Also set `intent_type` on the card (e.g., `sim.fea_stress_analysis`)

**Available pipelines** (from DB):
- `pipe_fea_standard` — supports `sim.fea_stress_analysis`, `sim.fea_modal_analysis`, `sim.fea_thermal_analysis`
- `pipe_cfd_quick` — supports `sim.cfd_pressure_drop`

**Available intent type endpoints**:
- `GET /v0/verticals/engineering/intent-types` — list all intent types
- `GET /v0/intent-types/{slug}/inputs` — get required inputs for an intent type
- `GET /v0/intent-types/{slug}/pipelines` — get compatible pipelines

## Pre-existing Issues (Not From This Session)
- `agent_test.go` mock missing `CreateTrigger` method (store.Store interface change)
- Multiple service test mocks missing `CreateTrigger` (board_composition_test, board_intent_test)
- 7 test files skipped in frontend

## Test Status
- **Frontend**: 298 tests passing, 0 failures
- **Backend**: `go build ./...` clean; plan handler tests pass; some unrelated service tests have pre-existing mock failures

## All Files Modified

### Frontend (studios/)
- `apps/board-studio/src/api/cards.ts`
- `apps/board-studio/src/api/plans.ts`
- `apps/board-studio/src/types/board.ts`
- `apps/board-studio/src/hooks/usePlan.ts`
- `apps/board-studio/src/components/boards/CardComponent.tsx`
- `apps/board-studio/src/components/studio/OutlinePanel.tsx`
- `apps/board-studio/src/components/studio/PlanExecutionPanel.tsx`

### Backend (airaie-kernel/)
- `internal/handler/plan.go`
- `internal/service/plan_generator.go`
- `internal/handler/plan_test.go`
- `internal/service/plan_generator_test.go`

## Next Steps
1. **Wire IntentSpecs to demo board cards** — either via seed script update or UI flow
2. **Restart kernel backend** to pick up Go changes
3. **Consider adding IntentSpec creation UI** to PlanExecutionPanel when card has no spec
4. Fix pre-existing `CreateTrigger` mock failures across service tests
