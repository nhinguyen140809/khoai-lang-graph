"""Application settings, read once at startup and passed down explicitly."""

from __future__ import annotations

from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

# src/khoailanggraph/settings/base.py -> parents[3] is the backend/ directory.
BACKEND_DIR = Path(__file__).resolve().parents[3]


class Settings(BaseSettings):
    """The environment-driven configuration of the backend.

    Values come from environment variables or a `.env` file next to the backend
    (never committed); every field pins a dev default that needs no setup.
    """

    model_config = SettingsConfigDict(
        env_file=BACKEND_DIR / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_env: str = "local"
    # Dev defaults to SQLite (zero setup): a file under backend/data. Production
    # points DATABASE_URL at Postgres; both use SQLAlchemy async engines.
    database_url: str = (
        f"sqlite+aiosqlite:///{(BACKEND_DIR / 'data' / 'khoailanggraph.db').as_posix()}"
    )
    # Origins the CSRF check accepts besides the backend's own request host
    # (docs/API.md §3: Origin must equal "the application origin"). In dev the
    # web app is served by Next.js on :3000, which proxies /api here, so the
    # application origin is the frontend's; production sets its own list.
    csrf_allowed_origins: list[str] = ["http://localhost:3000"]
    log_level: str = "INFO"
    log_format: str = "console"
    # The model profiles file (defaults, role mapping, allowlist) for the llm layer.
    models_config_file: Path = BACKEND_DIR / "config" / "models.yaml"
    # The OpenAI-compatible gateway the llm layer calls through; None keeps
    # whatever the process environment already provides (langchain reads
    # OPENAI_API_KEY / OPENAI_BASE_URL itself when these are unset).
    openai_api_key: str | None = None
    openai_base_url: str | None = None
    # The research-search provider key of the corpus builder (Tavily), read
    # from the same .env as the gateway keys and never committed. Without it
    # the keyless DuckDuckGo→Wikipedia chain serves the corpus builder.
    tavily_api_key: str | None = None
    # The academic part of the research search: paper abstracts from OpenAlex
    # and arXiv, added to the web hits. `openalex_api_key` is optional (a free
    # key gives OpenAlex its own daily budget); `research_academic=false`
    # turns the whole part off.
    research_academic: bool = True
    openalex_api_key: str | None = None
    # The bounded decision layer of the workflow gates (README.md: Decision
    # layer): "off" keeps every gate on the LLM's own value, "mock" confirms
    # the defaults, "jev" answers through typesafe_sdk (needs the `jev`
    # dependency group; falls back to mock without it).
    decision_provider: str = "off"
    decision_fallback: str = "mock"
    # The model the llm decision provider asks (README.md: Decision layer):
    # None keeps the registry default of config/models.yaml — a No-Think
    # variant answers the small gate questions much faster.
    decision_model: str | None = None
    decision_auto_confidence: float | None = None
    decision_review_confidence: float | None = None
    # The typesafe.ai credentials of the jev provider: the SDK reads the
    # same-named env vars itself; these fields let backend/.env carry them
    # like the gateway keys (never committed).
    typesafe_api_key: str | None = None
    typesafe_base_url: str | None = None
    # Uploaded source documents (docs/API.md §5 Source documents): the raw
    # bytes land under this directory as {uuid}.bin keys the API never
    # returns; uploads over the limit answer 422 too_large.
    documents_dir: Path = BACKEND_DIR / "data" / "documents"
    # The files of the exports land under this directory as {uuid}.bin keys the API never returns.
    exports_dir: Path = BACKEND_DIR / "data" / "exports"
    max_upload_mb: int = 10
    # How runs execute: "background" walks the workflow on a thread of the API process and
    # answers at once; "inline" walks it inside the request (tests and scripts that need the
    # finished run in the response).
    run_execution: str = "background"
    # The reviews a run pauses for when neither the request, the project nor the user settings
    # name any: None pauses at every checkpoint of the workflow, an empty list at none.
    default_review_checkpoints: list[str] | None = None
    # The budget of a user per calendar month in UTC (US dollars) when the user has none of
    # their own; None means no limit.
    default_monthly_budget_usd: float | None = 20.0
    # Time limits (seconds): a node may work this long before its next call to a model is
    # refused (error code `timeout`), a tool call (search, documents) this long, and one call to
    # a model this long before the client gives up.
    node_timeout_seconds: float = 900.0
    tool_timeout_seconds: float = 60.0
    llm_call_timeout_seconds: float = 300.0
    # The most tokens one call to a model may generate, hidden reasoning included; a reply cut
    # at this length cannot be parsed, so the call is tried again.
    llm_max_output_tokens: int = 65536
    # Requests per minute and per user that the API accepts (429 rate_limited after that).
    requests_per_minute: int = 1200
    # Attempts per minute and per IP address on login and registration.
    auth_attempts_per_minute: int = 20
    # The interactive API docs (/docs, /redoc, /openapi.json) are developer
    # tooling. None (the default) serves them outside `production` only;
    # API_DOCS_ENABLED=true|false sets the rule explicitly.
    api_docs_enabled: bool | None = None


@lru_cache
def get_settings() -> Settings:
    """Process-wide settings; import-time free (call inside functions)."""
    return Settings()
