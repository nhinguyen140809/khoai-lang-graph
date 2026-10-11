"""Pydantic shapes of the account feature (frontend Zod contracts)."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from khoailanggraph.platform.serialization import IsoDatetime

# The six fields of the settings the client sends and reads (mock parity).
Theme = Literal["light", "dark", "system"]
Language = Literal["en", "vi"]


class Me(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    email: str
    display_name: str
    avatar_url: str | None
    role: str
    status: str
    email_verified_at: IsoDatetime | None
    last_login_at: IsoDatetime | None
    monthly_budget_usd: float | None
    created_at: IsoDatetime
    updated_at: IsoDatetime


class RegisterBody(BaseModel):
    model_config = ConfigDict(extra="forbid")

    email: EmailStr
    password: str = Field(min_length=1)
    display_name: str = Field(min_length=1)


class LoginBody(BaseModel):
    model_config = ConfigDict(extra="forbid")

    email: str
    password: str


class PatchMeBody(BaseModel):
    model_config = ConfigDict(extra="forbid")

    display_name: str | None = None
    avatar_url: str | None = None


class RunDefaultsShape(BaseModel):
    """RunDefaults: any subset; null means 'not set' (frontend contract)."""

    model_config = ConfigDict(extra="forbid")

    review_checkpoints: list[str] | None = None
    max_steps: int | None = None
    max_cost_usd: float | None = None
    parameters: dict[str, object] | None = None


class UserSettings(BaseModel):
    model_config = ConfigDict(extra="forbid")

    user_id: str
    theme: Theme
    ui_language: Language
    default_output_language: Language
    default_run_config: RunDefaultsShape
    notify_on_interrupt: bool
    notify_on_run_finished: bool
    created_at: IsoDatetime
    updated_at: IsoDatetime


class UserSettingsBody(BaseModel):
    """The six replaceable fields of PUT /me/settings (§5)."""

    model_config = ConfigDict(extra="forbid")

    theme: Theme
    ui_language: Language
    default_output_language: Language
    default_run_config: RunDefaultsShape
    notify_on_interrupt: bool
    notify_on_run_finished: bool
