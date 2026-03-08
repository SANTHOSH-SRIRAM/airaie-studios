# Airaie Platform Architecture — How the Three Studios Align

## Platform Goal

Airaie is a single digital backbone connecting **design intent to manufacturing readiness** — where every decision is traceable, every execution is reproducible, and nothing falls through the cracks between tools.

The core problem: engineering workflows are fragmented across tools and vendors. Research outputs don't translate into production decisions. Manufacturers receive incomplete data. Intent and context are lost between steps.

The solution: a platform where parametric design intent, validation proof, and manufacturing readiness stay connected end-to-end, with deterministic workflows as the execution layer and AI agents as governed decision support.

---

## Three Studios, Three Layers

```
                          WHAT the engineer wants
                                  |
                    +-------------+-------------+
                    |                           |
              AI Agent Studio            Board Studio
              (DECISION layer)           (GOVERNANCE layer)
              "when, why, whether"       "is it ready? prove it."
                    |                           |
                    +-------------+-------------+
                                  |
                         Workflow Studio
                         (EXECUTION layer)
                         "how, in what order, deterministically"
                                  |
                          Airaie Kernel
                          (infrastructure)
```

Each studio owns a different layer of the platform goal:

| Studio | Port | Question It Answers | Core Object | What It Produces |
|--------|------|---------------------|-------------|------------------|
| **Workflow Studio** | 3001 | *How do we execute this?* | Versioned DAG (workflow) | Deterministic runs, artifacts, lineage |
| **AI Agent Studio** | 3002 | *What should we do next?* | Agent Spec + ActionProposal | Structured proposals — tool calls, parameters, confidence, rationale |
| **Board Studio** | 3003 | *Is this ready for production?* | Board with Cards + Gates | Evidence packs, gate evaluations, release packets |

---

## End-to-End Flow

How an engineer uses the platform from design to manufacturing:

```
1. BOARD STUDIO                    2. WORKFLOW STUDIO                 3. AGENT STUDIO
   Define what to prove               Define how to prove it             Intelligent decisions
   +-----------------------+          +-----------------------+          +-----------------------+
   | Engineering Board     |          | Workflow DAG          |          | Agent Spec            |
   |                       |          |                       |          |                       |
   | Cards:                |  maps    | Nodes:                |  some    | Role + Goals          |
   |   FEA validation   -------->     |   Update CAD          |  nodes   | Allowed Tools         |
   |   CFD analysis     -------->     |   Run Mesh            |  invoke  | Decision Policy       |
   |   DFM check        -------->     |   Run Solver       -------->    | Output Schema         |
   |                       |          |   Compute Metrics     |          |                       |
   | Gates:                |          |   Agent Decision   -------->    | Produces:             |
   |   Evidence thresholds |          |   Apply Changes       |          |   ActionProposal      |
   |   Human approvals     |          |                       |          |   (structured,        |
   |   Compliance checks   |          | Produces:             |          |    auditable,         |
   |                       |          |   Versioned artifacts  |          |    never executes     |
   +-----------+-----------+          |   Full lineage        |          |    directly)          |
               ^                      +----------+------------+          +-----------------------+
               |                                 |
               |    evidence flows back          |
               +---------------------------------+
               |
   4. BACK TO BOARD STUDIO
      +---------------------------+
      | Gates auto-evaluate       |
      | Evidence vs thresholds    |
      | Human reviewers approve   |
      | All gates pass -->        |
      |   Release Packet          |
      |   (manufacturing-ready)   |
      +---------------------------+
```

### Step by Step

1. **Board Studio** — Engineer creates an Engineering Board defining *what needs to be validated* (cards for FEA, CFD, DFM) and *what gates must pass* (evidence thresholds, reviewer approvals, compliance)

2. **Workflow Studio** — For each card, engineer builds or selects a workflow (a reproducible DAG of tool invocations). Compiles from DSL to AST to executable graph. Produces versioned, immutable artifacts with full lineage.

3. **AI Agent Studio** — For complex decisions (parameter optimization, design-of-experiments, failure triage), engineer defines agents that propose actions. Agents output `ActionProposal` objects — structured, auditable recommendations — but never execute directly. Proposals flow into workflows for execution.

4. **Board Studio** — Workflow results flow back as evidence. Gates auto-evaluate against thresholds. When all gates pass and reviewers approve, the board produces a Release Packet for manufacturing.

---

## Key Design Principles

### Agents Propose, Workflows Execute

Agents are bounded decision-makers. They recommend; the workflow runtime does the work. This ensures auditability and determinism.

```
Agent --> ActionProposal --> Workflow Node --> Tool Execution --> Artifact
          (structured)       (deterministic)    (sandboxed)      (versioned)
```

An `ActionProposal` contains:
- Summary and confidence score
- Risk classification
- Required validations
- Proposed tool invocations with parameters
- Rationale and evidence references

### Workflows Are the Only State Mutators

All execution goes through the Workflow Runtime. No ad-hoc side effects. Every result links back to inputs, tool versions, workflow version, and the proposing user or agent.

### Boards Govern, They Don't Execute

Boards bind together CAD revisions, workflow runs, evidence, and approvals into a governed state machine. They don't run anything themselves — they track and enforce.

---

## Board Studio — Governance Layer

### Core Objects

| Object | Purpose |
|--------|---------|
| **Board** | Container with mode (explore/study/release), status, readiness score |
| **Card** | A unit of work — simulation, optimization, validation, analysis |
| **Gate** | Policy-enforced checkpoint — must pass before state transitions |
| **Evidence** | Metrics collected from workflow runs — baseline vs current, pass/fail |
| **Release Packet** | Manufacturing-ready bundle — locked exports, BOM, tolerances, proof |

### Board Modes

| Mode | Purpose | Transitions To |
|------|---------|---------------|
| **Explore** | Experimentation, parameter sweeps, prototyping | Study |
| **Study** | Formal validation, evidence collection, regression testing | Release |
| **Release** | Gate enforcement, approvals, manufacturing readiness | — |

### Gate Types

| Gate | What It Checks | Auto-Evaluatable |
|------|---------------|-----------------|
| **AutoGate** | Evidence thresholds (KPI value vs target) | Yes |
| **ReviewGate** | Required human sign-off from designated roles | No |
| **ComplianceGate** | Required standards/documents attached | Partially |

### Card Statuses

```
pending --> running --> completed
                   --> failed
         --> blocked (waiting on dependencies)
         --> skipped / waived / cancelled
```

### Studio UI (IDE-style 3-panel cockpit)

```
+---------------------------------------------------------------------+
| COMMAND BAR: board name + mode badge + breadcrumb + actions          |
+----------+--------------------------------------+--------------------+
| OUTLINE  |         MAIN CANVAS                  |    INSPECTOR       |
| (left)   |  [Board] [DAG] [Table] [Timeline]    |    (right)         |
|          |                                      |                    |
| Cards    |  Card grid / dependency graph /      |  Selected item     |
| Gates    |  data table / timeline view          |  properties,       |
|          |                                      |  KPIs, actions     |
|          |  +-------------------------------+   |                    |
|          |  | Bottom Panel                  |   |                    |
|          |  | Logs | Evidence | Preflight    |   |                    |
+----------+--------------------------------------+--------------------+
| STATUS BAR: card count . gate count . readiness % . mode . Cmd+K    |
+---------------------------------------------------------------------+
```

---

## Workflow Studio — Execution Layer

### Core Objects

| Object | Purpose |
|--------|---------|
| **Workflow** | Versioned DAG defined in YAML DSL, compiled to AST then executable graph |
| **Node** | A single tool invocation with typed inputs/outputs and a ToolContract |
| **Run** | An execution instance of a workflow — tracks node states, artifacts, logs |
| **Artifact** | Immutable, content-addressed output with lineage (who/what/when produced it) |
| **Trigger** | Webhook, cron, or event that starts a workflow run |

### Workflow Compilation Pipeline

```
YAML DSL --> AST (typed validation) --> DAG (execution graph) --> Runtime
```

### Node States

```
QUEUED --> RUNNING --> SUCCEEDED
                  --> FAILED
                  --> RETRYING
       --> BLOCKED (upstream not complete)
       --> SKIPPED (conditional)
```

### Runtime Semantics

- Every node keyed by `workflow_version + node_id + resolved_inputs_hash + tool_version`
- Deterministic nodes eligible for cache hits
- If upstream artifacts change, downstream nodes become stale
- Parallel execution of independent branches
- Human-in-the-loop gates for approval nodes

### Studio UI (Tab-Based)

| Tab | Purpose |
|-----|---------|
| **Builder** | Node palette + graph editor + auto-generated config panels from ToolContracts |
| **Runs** | Timeline, status tracking, log streaming, artifact browser |
| **Artifacts** | Immutable outputs with lineage visualization |
| **Versions** | Workflow diffs, changelog, rollback |
| **Triggers** | Webhook, cron, event-driven trigger configuration |
| **Approvals** | Human-in-the-loop gate management |

---

## AI Agent Studio — Decision Layer

### Core Objects

| Object | Purpose |
|--------|---------|
| **Agent Spec** | Versioned definition: role, goals, allowed tools, policy, output schema |
| **ActionProposal** | Structured output: proposed tool calls, confidence, risk, rationale |
| **Policy** | Rules governing agent behavior: confidence thresholds, required checks, escalation |
| **Evaluation** | Test harness: golden datasets, regression tests, accuracy tracking |

### Critical Distinction

*Algorithms answer HOW. Agents answer WHEN, WHY, WHETHER.*

An agent does not run simulations. It decides *which* simulation to run, with *what* parameters, and *whether* the results are acceptable.

### Agent Execution Pattern

```
1. Agent node receives context (metrics, history, constraints)
2. Agent generates ActionProposal (structured, machine-readable)
3. Policy Engine evaluates: auto-approve / escalate / block
4. If approved: proposal becomes workflow nodes
5. Workflow Runtime executes the proposed tool calls
6. Validation nodes verify outputs
7. Results flow back as evidence
```

### Studio UI (Tab-Based)

| Tab | Purpose |
|-----|---------|
| **Builder** | Role/goal editor + tool allowlist + output schema definition |
| **Policy** | Confidence thresholds, mandatory validations, escalation rules |
| **Playground** | Run agent against historical data, inspect decisions interactively |
| **Evals** | Golden datasets, regression tests, accuracy tracking across versions |
| **Versions** | Diff prompts, tools, policies across agent versions |

---

## The Kernel — Backend Infrastructure

All three studios connect to the same Airaie Kernel backend:

```
Board Studio (:3003) --+
Workflow Studio (:3001) +--> Kernel API (:8080) --> Postgres + NATS + MinIO
Agent Studio (:3002) ---+                               |
                                                   Rust Worker
                                                  (Docker/WASM sandbox)
```

### Kernel Components

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **API Gateway** | Go | REST API (86 endpoints), JWT auth, rate limiting, CORS |
| **Tool Registry** | Go + Postgres | ToolContract storage, validation, capability scoring |
| **Workflow Runtime** | Go + Postgres + NATS | DSL compilation, DAG scheduling, state machine, caching |
| **Agent Registry** | Go + Postgres | Agent spec storage, ActionProposal generation, PolicyEngine |
| **Artifact Service** | Go + MinIO | Immutable blob storage, content addressing, lineage tracking |
| **Gate Evaluator** | Go + Postgres | Threshold evaluation, approval tracking, release packet generation |
| **Execution Runner** | Rust + Docker | Sandboxed tool execution, resource limits, NATS job consumption |
| **Audit Service** | Go + Postgres | Full audit trail for compliance and traceability |

### API Structure

```
/v0/workflows/*      — CRUD, compile, validate
/v0/runs/*            — execute, stream, cancel, retry
/v0/artifacts/*       — store, fetch, lineage
/v0/agents/*          — CRUD, propose, evaluate
/v0/tools/*           — registry, contracts, resolve
/v0/boards/*          — CRUD, summary, evidence, triage
/v0/gates/*           — evaluate, approve, reject, waive
/v0/projects/*        — multi-tenant isolation
```

---

## Shared Packages

The three studios share common infrastructure via monorepo packages:

```
/packages/
  ui/       @airaie/ui      Design system: Button, Badge, Card, Tabs, Spinner, etc.
                             Tailwind preset, color tokens, sharp-corner aesthetic
  shared/   @airaie/shared   TypeScript types (from kernel Go models), API client,
                             endpoint constants, status enums, SSE streaming
  shell/    @airaie/shell    Sidebar, Header, AppShell, BoardTabs — consistent
                             navigation chrome across all studios
```

### What Each Package Provides

| Package | To Studios | Key Exports |
|---------|-----------|-------------|
| `@airaie/ui` | Consistent look and feel | Components, `cn()` utility, format helpers, Tailwind preset |
| `@airaie/shared` | Type-safe API access | `apiClient` (Axios), endpoint constants, kernel types, SSE helpers |
| `@airaie/shell` | Consistent navigation | `Sidebar`, `Header`, `AppShell`, `BoardTabs`, `UserCard` |

---

## Why Three Studios Instead of One

Each studio is a **domain-specific IDE** optimized for its concern:

| Studio | Optimized For | Analogous To |
|--------|--------------|--------------|
| Workflow Studio | Building and monitoring execution graphs | Dagster, Airflow, Prefect |
| Agent Studio | Designing, testing, and governing AI decision-makers | LangSmith, prompt engineering tools |
| Board Studio | Engineering validation, evidence collection, release management | Linear + PLM + quality gates |

They run as separate apps (separate ports, separate routing, separate state) but share the shell, design system, type system, and API client. An engineer moves between studios as their work demands — building workflows, configuring agents, and tracking board readiness — all hitting the same kernel backend, all producing artifacts in the same lineage graph.

---

## Five Non-Negotiable Principles

1. **Everything is an artifact** — versioned, addressable, linkable (CAD, simulations, workflows, agents, datasets, reports)
2. **Workflows are the only state mutators** — all execution happens through the Workflow Runtime for determinism and auditability
3. **Agents propose; runtime executes** — agents output structured proposals that become workflow nodes; they never directly mutate state
4. **Contracts everywhere** — tools have typed I/O contracts enabling validation, auto-UI generation, and safe execution
5. **Traceability by default** — every result links back to inputs, tool versions, workflow version, and proposing user/agent
