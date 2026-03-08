# Adaptive Vertical-Aware Card System

## Architecture Overview

The vertical-aware card system adapts card UI (icons, accent colors, summary fields, domain actions, form schemas) based on the STEM vertical (Engineering, Science, Technology, Mathematics) and intent type of each card.

### Key Pattern: Composition-based Registry

```
VERTICAL_REGISTRY['engineering'].theme       → { accentColor: 'blue-600', icon: Cog }
VERTICAL_REGISTRY['engineering'].intentConfigs['sim.fea'] → { summaryFields, actions, icon }
```

Components consume the registry via a `useVerticalConfig(card, board)` hook — no if/else chains. Unknown verticals gracefully fall back to generic rendering.

---

## File Map

### New Frontend Files (7)

| File | Purpose |
|------|---------|
| `src/types/vertical-registry.ts` | TypeScript interfaces: `VerticalTheme`, `CardFieldDefinition`, `CardActionDefinition`, `IntentCardConfig`, `VerticalRegistryEntry` |
| `src/constants/vertical-registry.ts` | Concrete registry with 4 verticals x 13 intent configs |
| `src/hooks/useVerticalConfig.ts` | `useVerticalConfig(card, board)` hook + `extractFieldValue()` + `formatFieldValue()` utilities |
| `src/components/boards/CardSummaryZone.tsx` | Renders 2-3 domain fields extracted from card config/kpis |
| `src/components/boards/VerticalBadge.tsx` | Reusable icon+name chip with vertical accent color |
| `src/components/studio/SchemaConfigEditor.tsx` | Schema-driven form for `IntentParameter[]` (text/number/select/boolean) |
| `src/components/studio/DomainActions.tsx` | Renders domain-specific action buttons from registry |

### Modified Frontend Files (9)

| File | Changes |
|------|---------|
| `src/types/board.ts` | Added `vertical_id?: string` to `Board`, `intent_type?: string` to `Card` |
| `src/api/cards.ts` | Flows `intent_type` through create payload and transform |
| `src/api/boards.ts` | Derives `vertical_id` from board type prefix in `fetchBoard()` (fallback) |
| `src/hooks/useCards.ts` | `useCreateCard` accepts `intent_type` and `config` |
| `src/components/boards/CardComponent.tsx` | Vertical accent bar, lucide icons, summary zone, vertical badge |
| `src/components/studio/CardNode.tsx` | Split accent bar (vertical + status), lucide icons, domain metrics |
| `src/components/studio/BoardCanvas.tsx` | Accepts `board` prop, threads `verticalSlug` to DAG nodes |
| `src/components/studio/InspectorPanel.tsx` | Accepts `board`, domain detail fields, domain actions, vertical badge |
| `src/components/studio/CreateCardDialog.tsx` | Accepts `board`, intent type grid, schema parameter fields |
| `src/pages/CardDetailPage.tsx` | Vertical badge in header/breadcrumb, domain metadata section |
| `src/pages/BoardDetailPage.tsx` | Passes `board` to `BoardCanvas`, `InspectorPanel`, `CreateCardDialog` |

### Backend Changes (Go — `airaie-kernel/`)

| File | Changes | Status |
|------|---------|--------|
| `infra/migrations/015_vertical_intent_type.sql` | New migration: `vertical_id` column on `boards`, `intent_type` column on `cards` | Done |
| `infra/migrations/015_vertical_intent_type_down.sql` | Rollback migration | Done |
| `internal/model/model.go` | Added `VerticalID *string` to `Board` struct | Done |
| `internal/model/card.go` | Added `IntentType *string` to `Card` struct | Done |
| `internal/store/postgres.go` | All board INSERT/SELECT/Scan include `vertical_id` | Done |
| `internal/store/postgres_cards.go` | All card INSERT/SELECT/Scan include `intent_type` | Done |
| `internal/service/board.go` | `CreateBoardRequest` gets `VerticalID`, passed into `Board` model | Done |
| `internal/handler/boards.go` | `CreateBoard` handler accepts `vertical_id` in request JSON | Done |
| `internal/service/board_template.go` | Copy `template.VerticalID` to `board.VerticalID` on instantiation | Done |
| `internal/service/board_intent.go` | Derive `vertical_id` from intent type's `vertical_id` on creation | Done |

---

## Registry Structure

### Verticals

| Vertical | Slug | Accent | Icon |
|----------|------|--------|------|
| Engineering | `engineering` | `blue-600` | `Cog` |
| Science | `science` | `emerald-600` | `FlaskConical` |
| Technology | `technology` | `violet-600` | `Code2` |
| Mathematics | `mathematics` | `amber-600` | `Calculator` |

### Intent Configs by Vertical

**Engineering:** `sim.fea`, `sim.cfd`, `check.dfm`, `check.pcb_drc`, `check.emc`

**Science:** `lab.protocol`, `analysis.mesh_convergence`, `analysis.uq`

**Technology:** `ml.training`, `review.bias`, `ci.pipeline`, `scan.security`

**Mathematics:** `doe.design`, `opt.pareto`, `stat.power_analysis`, `stat.hypothesis_test`

---

## Vertical Resolution Logic

Priority order in `resolveVerticalSlug(board)`:
1. `board.vertical_id` — direct registry lookup
2. `board.vertical_id` — `BOARD_TYPE_TO_VERTICAL` prefix map
3. `board.type` — direct slug match
4. `board.type` — split on `[-_.]` and check each segment
5. `board.type` — substring match against prefix map

Falls back to `null` (generic UI) if no match.

---

## Backend Integration

### Data Flow: Board Creation

#### Direct (`POST /v0/boards`)
```
Frontend → { type, vertical_id, name, ... }
Handler  → service.CreateBoardRequest{ VerticalID: req.VerticalID }
Service  → model.Board{ VerticalID: req.VerticalID }
Store    → INSERT INTO boards (..., vertical_id, ...) VALUES (...)
```

#### From Template (`POST /v0/boards/from-template`) — **TODO**
```
Frontend → { template_slug, name, ... }
Service  → template := store.GetTemplate(slug)
           board.VerticalID = &template.VerticalID  ← NEEDS IMPLEMENTATION
Store    → INSERT INTO boards (...)
```

#### From Intent (`POST /v0/boards/from-intent`) — **TODO**
```
Frontend → { intent_spec: { intent_type: "sim.fea", ... } }
Service  → intentTypeDef := store.GetIntentType("sim.fea")
           board.VerticalID = &intentTypeDef.VerticalID  ← NEEDS IMPLEMENTATION
Store    → INSERT INTO boards (...)
```

### Data Flow: Card Creation

```
Frontend → { title, card_type, intent_type, config, ... }
Handler  → json.Decode into model.Card{ IntentType: &req.IntentType }
Service  → store.CreateCard(card)
Store    → INSERT INTO cards (..., intent_type, ...) VALUES (...)
```

### Data Flow: Card Retrieval

```
Store    → SELECT ..., intent_type, ... FROM cards → model.Card{ IntentType }
Handler  → writeJSON(card) → { "intent_type": "sim.fea" }
Frontend → transformCard(raw) → Card{ intent_type: "sim.fea" }
Hook     → useVerticalConfig(card, board) → { theme, intentConfig }
UI       → CardComponent renders with vertical accent, icons, summary fields
```

### Frontend Fallback

When `board.vertical_id` is not set by the backend (e.g., older boards), the frontend `fetchBoard()` in `api/boards.ts` derives it from the board's `type` field using a prefix map:
```typescript
// engineering-mechanical → engineering
// science-lab → science
// technology-mlops → technology
// math-optimization → mathematics
```

---

## Database Schema (Migration 015)

```sql
ALTER TABLE boards ADD COLUMN IF NOT EXISTS vertical_id TEXT;
CREATE INDEX IF NOT EXISTS idx_boards_vertical ON boards(vertical_id);

ALTER TABLE cards ADD COLUMN IF NOT EXISTS intent_type TEXT;
CREATE INDEX IF NOT EXISTS idx_cards_intent_type ON cards(intent_type);
```

Both columns are nullable — no breaking change to existing data.

---

## Fallback Behavior

Every component null-checks `theme` and `intentConfig`:

- **CardComponent**: No vertical → generic status-color bar, type badge, KPI text
- **CardNode**: No vertical → single status-color bar, emoji icon, raw KPI display
- **InspectorPanel**: No vertical → standard Layers icon, generic Run/Stop actions
- **CreateCardDialog**: No vertical → no intent type grid, no parameter fields
- **CardDetailPage**: No vertical → no VerticalBadge, no domain metadata section

---

## Adding a New Vertical

1. Add the entry to `VERTICAL_REGISTRY` in `src/constants/vertical-registry.ts`
2. Add board-type prefix mappings to `BOARD_TYPE_TO_VERTICAL`
3. Add the accent bar color to `accentBarColors` in `CardComponent.tsx`
4. Add the CSS color to `verticalAccentCssColors` in `CardNode.tsx`
5. Add the Tailwind classes to `accentClasses` in `VerticalBadge.tsx`

## Adding a New Intent Config

1. Add to the appropriate vertical's `intentConfigs` in `VERTICAL_REGISTRY`
2. Define `summaryFields` (2-3 fields shown on card face)
3. Define `detailFields` (full field list for inspector/detail page)
4. Define `actions` (domain-specific action buttons)
5. Choose a `lucide-react` icon

---

## Key Utilities

### `extractFieldValue(card, keyPath)`
Extracts nested values using dot-path keys: `'config.solver'` → `card.config.solver`

### `formatFieldValue(value, format, unit?)`
Formats values by type: `number` (with unit), `percentage`, `boolean`, `duration`, `text`

### `useVerticalConfig(card, board)`
Returns `{ theme, intentConfig, verticalSlug }` — all nullable for safe fallback.

### `resolveVerticalSlug(board)`
Pure function (no hook) to derive vertical slug from board. Used in BoardCanvas for DAG node data.

---

## Completed TODOs

### Backend: Template Instantiation (`service/board_template.go`) — DONE
`BoardTemplateService.Instantiate()` now passes `VerticalID: &tmpl.VerticalID` in the `CreateBoardRequest`.

### Backend: Intent-based Creation (`service/board_intent.go`) — DONE
`BoardIntentService.CreateBoardFromIntent()` now extracts `intentTypeDef.VerticalID` and passes `VerticalID: &verticalID` in the `CreateBoardRequest`.

---

## Future Cleanup

### Frontend: Remove Fallback
Once all boards reliably have `vertical_id` set by the backend, the prefix-matching fallback in `api/boards.ts` `fetchBoard()` can be simplified or removed.
