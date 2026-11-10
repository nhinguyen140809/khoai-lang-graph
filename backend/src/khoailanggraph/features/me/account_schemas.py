"""Shapes of the account routes beyond the profile and the settings: password, sessions, model
settings and usage."""

from __future__ import annotations

from pydantic import BaseModel, ConfigDict

from khoailanggraph.platform.serialization import IsoDatetime  # noqa: TC001 - pydantic reads it


class PasswordBody(BaseModel):
    model_config = ConfigDict(extra="forbid")

    current_password: str
    new_password: str


class SessionView(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    expires_at: IsoDatetime
    last_seen_at: IsoDatetime
    user_agent: str | None
    ip_address: str | None
    created_at: IsoDatetime
    current: bool


class ModelSetting(BaseModel):
    model_config = ConfigDict(extra="forbid")

    agent_role: str
    model_id: str
    temperature: float | None = None


class ModelSettingsBody(BaseModel):
    model_config = ConfigDict(extra="forbid")

    items: list[ModelSetting]


class UsageTotals(BaseModel):
    model_config = ConfigDict(extra="forbid")

    input_tokens: int
    output_tokens: int
    cache_read_tokens: int
    cache_write_tokens: int
    cost_usd: float
    duration_ms: int


class UsageGroup(BaseModel):
    model_config = ConfigDict(extra="forbid")

    key: str
    usage: UsageTotals


class UsageView(BaseModel):
    model_config = ConfigDict(extra="forbid")

    month: str
    budget_usd: float | None
    total: UsageTotals
    groups: list[UsageGroup]
