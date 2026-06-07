# Agentic Marketing Campaign Planner

Full-stack portfolio demo for an Agentic Developer role at SAMY. The app models a realistic campaign-planning workflow: create a campaign, complete a structured brief, run an agent with local tools, approve the final output, then evaluate the specific run.

## Stack

- Next.js 16 App Router
- Bun
- TypeScript
- Tailwind CSS
- Zod
- Anthropic Claude Messages API
- OpenCode / OpenAI-compatible fallback
- Mock fallback for offline demos

## What It Shows

- Claude-style tool use with local tool execution
- Agent roles: Manager, Research, Strategist, Content, Reviewer
- Lightweight RAG over curated local knowledge
- Prompt-injection and claim-safety guardrails
- Human-in-the-loop approval before final report generation
- Run-specific evaluation for completeness, brief alignment, tool success, guardrails, actionability, and approval readiness
- Browser-local project persistence with `localStorage`

## Product Workflow

1. `Campaigns`
   - Starts empty on first load.
   - Create or reopen campaign projects saved in this browser.
2. `Workspace`
   - Complete the structured campaign brief.
   - Run the agent only when the brief has enough usable input.
   - Review tool traces, retrieved knowledge, decisions, blockers, and the approval gate.
   - Approve the draft to create final campaign output.
3. `Evaluations`
   - Empty until an approved run exists.
   - Scores the selected run against the original brief and generated output.

## Quick Start

```bash
bun install
bun run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment

Copy `.env.example` to `.env.local` and choose a provider.

```bash
AI_PROVIDER=anthropic
ANTHROPIC_API_KEY=...
ANTHROPIC_MODEL=claude-sonnet-4-5-20250929
```

OpenCode-compatible fallback:

```bash
AI_PROVIDER=opencode
OPENCODE_BASE_URL=http://localhost:4096/v1
OPENCODE_API_KEY=...
OPENCODE_MODEL=...
```

Offline demo:

```bash
AI_PROVIDER=mock
```

If `AI_PROVIDER` is empty, the app auto-detects in this order:

1. Anthropic when `ANTHROPIC_API_KEY` exists
2. OpenCode when `OPENCODE_BASE_URL` and `OPENCODE_MODEL` exist
3. Mock fallback

## API

`POST /api/agent/plan`

Validates the campaign brief, runs input guardrails, asks the active provider to plan tool calls, executes local tools, and returns a draft.

`POST /api/agent/finalize`

Requires `{ draft, approved: true }` and returns the final campaign report.

`POST /api/evaluations/run`

Evaluates a specific run from `{ brief, draft, report, toolTrace }`.

`GET /api/evaluations`

Returns an empty list in this local-first version. The UI uses run-specific evaluations instead of global dummy scenarios.

## Tests

```bash
bun test
```

Covered areas:

- Schema and provider selection
- Local campaign store serialization
- Guardrails
- Tool execution
- Run evaluation scoring

## Demo Notes

The project intentionally avoids databases, Redis, vector DBs, and external social APIs. Campaign projects are persisted in `localStorage` under `samy_campaign_projects_v1`, so the first visit looks like a real empty product instead of a pre-filled mock dashboard.
