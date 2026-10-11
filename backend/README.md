# Khoailanggraph backend

FastAPI + LangGraph backend of `khoai-lang-graph`: the multi-agent requirements
engineering workflow (elicitation → analysis → specification → backlog →
validation, with human review checkpoints) behind the `/api/v1` contract of
[docs/API.md](../docs/API.md).

This port is guided by the repository docs, in this priority order: the
frontend's current client calls (`frontend/src/mocks/**`, `frontend/src/features/*/*.types.ts`)
> [docs/API.md](../docs/API.md) > [docs/DATA_SHAPE.md](../docs/DATA_SHAPE.md) >
`docs/workflow/requirements_engineering.v1.json` > `docs/schemas/**` >
`docs/architecture/**`. Conventions: [CONTRIBUTING.md](../CONTRIBUTING.md).

## Layout

```
backend/
├── config/models.yaml          # model profiles + role mapping + allowlist
├── scripts/                    # developer scripts (schema export, codegen)
├── src/khoailanggraph/
│   ├── main.py                 # create_app(); no side effects until lifespan
│   ├── api/                    # HTTP wiring: routers under /api/v1, shared schemas
│   ├── features/               # one package per business feature (vertical slice)
│   ├── agents/                 # LangGraph graphs; never import features/ or api/
│   ├── llm/                    # provider-agnostic model layer (role -> model)
│   ├── tools/ integrations/    # agent tools and external clients
│   ├── platform/               # db engine, storage, run executor
│   ├── domain/                # content models + integrity rules; imports nothing
│   └── settings/               # pydantic-settings + structlog
├── migrations/                 # Alembic (created with the first schema)
└── tests/                      # pytest: unit + API parity (httpx/ASGI)
```

## Running

```bash
cd backend
uv sync                      # creates .venv and installs the package + dev deps
cp .env.example .env         # optional; every default runs without keys
uv run uvicorn khoailanggraph.main:app --reload --port 8000
```

- Health: http://localhost:8000/health — readiness: http://localhost:8000/ready
- API docs (OpenAPI): http://localhost:8000/docs
- The dev database is SQLite at `backend/data/khoailanggraph.db` (created on
  first use, git-ignored). Production sets `DATABASE_URL` to PostgreSQL;
  migrations are shared (`alembic upgrade head`).

## Demo with the frontend

```bash
# terminal 1 — the backend on :8001 with the demo database
uv run python scripts/seed_demo.py --reset
DATABASE_URL="sqlite:///$(pwd)/data/dev.db" uv run uvicorn khoailanggraph.main:app --port 8001

# terminal 2 — the frontend (Next.js proxies /api to the backend)
cd ../frontend
API_PROXY_TARGET=http://localhost:8001 pnpm dev     # NOT dev:mock
```

Sign in as `linh.pham@example.com` / `secret`; the seed creates the
fixture projects plus one finished run for «Mentor platform». The CSRF
rule accepts the application origins of `settings.csrf_allowed_origins`
(the Next server on `:3000` by default) — see `gap-report.md` §1.1.

`DEMO_MODE=true` (the default) pins every role to the keyless scripted
`fake:demo` model — the whole 15-node walk replays the Mentor platform
storyline without any API key. `DEMO_MODE=false` in `backend/.env` (with
`OPENAI_BASE_URL` + `OPENAI_API_KEY`) answers chat runs with real models:
`config/models.yaml` defaults to `openai:glm-5.2` through the BioTuring
gateway (the vn endpoint for low latency), and a full real run takes
minutes — the log pages in only when the whole workflow finishes (known
follow-up §2.3 of `gap-report.md`). The test suite and the seed pin demo
mode themselves (`tests/conftest.py`, `scripts/seed_demo.py`), so they
never call a gateway whatever `.env` contains.

## Checks

```bash
uv run ruff format . && uv run ruff check .   # lint (line length 100)
uv run mypy src tests                          # strict type checking
uv run lint-imports                           # layering (import-linter)
uv run pytest                                 # unit + API tests
```

## Follow-ups (parked, not ported)

- `decisions.py` hybrid decision layer of the source prototype — see
  [gap-report.md](gap-report.md); lands as a separate review-policy port later.
