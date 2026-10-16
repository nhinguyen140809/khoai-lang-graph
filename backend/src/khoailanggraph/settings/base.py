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
    # Demo mode pins every role to fake:demo (keyless scripted runs); false
    # leaves the model choice to config/models.yaml and the gateway env keys.
    demo_mode: bool = True
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
    # from the same .env as the gateway keys and never committed. Demo mode
    # never needs it: the demo search tool serves fixture documents offline.
    tavily_api_key: str | None = None
    # The interactive API docs (/docs, /redoc, /openapi.json) are developer
    # tooling. None (the default) serves them outside `production` only;
    # API_DOCS_ENABLED=true|false sets the rule explicitly.
    api_docs_enabled: bool | None = None


@lru_cache
def get_settings() -> Settings:
    """Process-wide settings; import-time free (call inside functions)."""
    return Settings()
