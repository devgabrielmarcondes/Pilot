# Agentic Marketing Campaign Planner

Full-stack portfolio demo for an Agentic Developer role at SAMY. The app plans a social-first campaign using a small agent loop, tool calling, lightweight local RAG, guardrails, human approval, and deterministic evaluations.

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
- Evaluation dashboard for tool success, guardrails, quality, latency, and cost

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

`GET /api/evaluations`

Runs deterministic evaluation scenarios for happy path, prompt injection, and unsupported claim review.

## Tests

```bash
bun test
```

Covered areas:

- Schema and provider selection
- Guardrails
- Tool execution
- Evaluation scoring

## Demo Notes

The project intentionally avoids databases, Redis, vector DBs, and external social APIs. The goal is a reliable two-day portfolio piece that makes the agentic architecture visible without adding operational setup.
