"""The hermetic installer: the scripted provider + the fixture corpus.

Production has no fake branch, so every consumer that needs the offline
storyline — the test suite and the seed script — installs the test doubles
at the same two seams: the model factory (which answers `fake:*` ids) and
the run executor (whose roles and search tool default to the fixtures).
"""

from __future__ import annotations

from typing import TYPE_CHECKING, Any

from khoailanggraph.agents.requirements_engineering.definition import agent_roles
from khoailanggraph.features.runs import service as runs_service
from khoailanggraph.llm import factory as llm_factory
from support.fake_data import make_demo_data
from support.fake_llm import FakeChatModel
from support.fake_search import demo_research_search

if TYPE_CHECKING:
    from langchain_core.language_models.chat_models import BaseChatModel

FAKE_MODEL_ID = "fake:demo"


def install_fake_provider() -> None:
    """Answer `fake:*` model ids and serve the fixture corpus from now on.

    Permanent by design (the process exits with its purpose served): tests
    install it in `conftest.py`, the seed before its scripted run. Tests that
    need a drifting dataset may still patch `llm_factory.make_demo_data`.
    """
    # mypy cannot see an attribute the patch installs; the seam is Any.
    seam: Any = llm_factory
    llm_factory.reset_model_cache()
    seam.make_demo_data = make_demo_data

    def build_with_fake(model_id: str, temperature: float | None = None) -> BaseChatModel:
        provider, _, name = model_id.partition(":")
        if provider == "fake":
            return FakeChatModel(demo=seam.make_demo_data(name))
        return real_build(model_id, temperature)

    real_build = llm_factory.build_chat_model
    llm_factory.build_chat_model = build_with_fake
    # The executor seams: every role resolves to the scripted model, and the
    # run's search tool is the fixture corpus. Any-typed — mypy does not
    # re-check an attribute the patch swaps at runtime.
    service_seam: Any = runs_service
    service_seam.role_models = lambda: {role: FAKE_MODEL_ID for role in agent_roles()}
    service_seam.make_research_search = lambda _settings: demo_research_search
