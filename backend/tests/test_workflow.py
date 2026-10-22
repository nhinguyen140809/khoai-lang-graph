"""Phase C gate: the full workflow runs on the fake model.

With `review_checkpoints = []` the gateway checkpoints auto-take their
default options (§2.4), so the run must walk every stage end-to-end and close
itself: elicitation plan → research corpus → mined observations → grounded
personas → interviews → analysis → specification → backlog → validation, the
validator failing once on a backlog-category issue and passing after the
engineer and backlog reworks (the demo dataset). Every artifact, item and
link the run wrote must hold against the domain rules with the version-2
definition.
"""

from __future__ import annotations

from typing import TYPE_CHECKING, cast
from unittest.mock import patch

import pytest

import khoailanggraph.llm.factory as llm_factory

if TYPE_CHECKING:
    from collections.abc import Generator

    from langchain_core.runnables import RunnableConfig

    from khoailanggraph.agents.requirements_engineering.ports import ArtifactSink

from khoailanggraph.agents import prompts as prompt_loader
from khoailanggraph.agents.requirements_engineering import definition as wf
from khoailanggraph.agents.requirements_engineering.definition import agent_roles
from khoailanggraph.agents.requirements_engineering.graph import build_re_graph
from khoailanggraph.agents.requirements_engineering.nodes import PROMPTS_PACKAGE
from khoailanggraph.agents.requirements_engineering.outputs import InterviewerTurnOutput
from khoailanggraph.agents.requirements_engineering.state import REState, make_initial_state
from khoailanggraph.domain import rules as domain_rules
from khoailanggraph.llm import reset_model_cache
from khoailanggraph.llm.demo import DEMO_INTENT, DemoData, _corpus, _mined, _personas
from khoailanggraph.llm.fake import FakeChatModel
from khoailanggraph.tools.research import demo_research_search
from support.in_memory_sinks import InMemoryArtifactSink, InMemoryDirectiveSink

ROLES = sorted(agent_roles())


def fake_config(sink: ArtifactSink, directives: InMemoryDirectiveSink) -> RunnableConfig:
    return {
        "configurable": {
            "run_id": "run-1",
            "artifact_sink": sink,
            "directive_sink": directives,
            "models": {role: "fake:demo" for role in ROLES},
            "research_search": demo_research_search,
        }
    }


def run_state() -> REState:
    return make_initial_state(
        "project-1",
        DEMO_INTENT,
        {
            "models": {role: "fake:demo" for role in ROLES},
            "review_checkpoints": [],
            "output_language": "en",
            "max_steps": 200,
            "max_cost_usd": None,
            "parameters": {
                "target_sources_num": 3,
                "target_personas_num": 3,
                "max_personas": 3,
                "max_turns": 6,
                "max_iterations": 2,
            },
        },
        first_run=True,
    )


@pytest.fixture(autouse=True)
def fresh_models() -> Generator[None]:
    reset_model_cache()
    yield
    reset_model_cache()


def test_full_workflow_succeeds_and_passes_domain_rules() -> None:
    sink = InMemoryArtifactSink()
    directives = InMemoryDirectiveSink()
    graph = build_re_graph()

    final = graph.invoke(run_state(), config=fake_config(sink, directives))

    # The run closed itself cleanly after two validation passes.
    assert final["status"] == "succeeded", final.get("error")
    assert final["error"] is None
    assert final["iteration_count"] == 2

    # Every stage wrote its artifact exactly as v1 defines the kinds.
    plan = sink.read_artifact("project-1", "elicitation_plan")
    catalog = sink.read_artifact("project-1", "persona_catalog")
    analysis = sink.read_artifact("project-1", "requirements_analysis")
    spec = sink.read_artifact("project-1", "requirement_specification")
    backlog = sink.read_artifact("project-1", "product_backlog")
    assert plan
    assert catalog
    assert analysis
    assert spec
    assert backlog

    # — the research stage: corpus, observations, evidence chains —
    corpus = sink.read_artifact("project-1", "research_corpus")
    assert corpus
    sources = [entry for entry in sink.items if entry["kind"] == "source_document"]
    assert len(sources) == 3
    assert {entry["key"] for entry in sources} == {"SRC-001", "SRC-002", "SRC-003"}
    observations = [entry for entry in sink.items if entry["kind"] == "stakeholder_observation"]
    assert len(observations) == 6
    assert {entry["key"] for entry in observations} == {f"OBS-00{i}" for i in range(1, 7)}
    # Every observation quotes its source text word for word, and links to it.
    source_by_key = {entry["key"]: entry for entry in sources}
    for entry in observations:
        source = source_by_key[entry["content"]["source"]]
        assert entry["content"]["evidence"] in str(source["content"]["text"])
    obs_evidence_sources = {
        link["source_key"]
        for link in sink.links
        if link["link_type"] == "evidenced_by" and link["source_key"].startswith("OBS")
    }
    assert obs_evidence_sources == {f"OBS-00{i}" for i in range(1, 7)}

    # Three personas grounded in the observations, each with exact evidence.
    personas = [entry for entry in sink.items if entry["kind"] == "persona"]
    assert len(personas) == 3
    obs_by_key = {entry["key"]: entry for entry in observations}
    grounded_rows = [row for row in sink.links if row["link_type"] == "grounded_in"]
    assert {row["source_key"] for row in grounded_rows} == {"PER-001", "PER-002", "PER-003"}
    assert len(grounded_rows) == 6, "two grounded_in links per persona"
    for persona in personas:
        content = persona["content"]
        assert content["evaluative_dimension"]
        assert content["grounded_in"], "every persona is grounded in observations"
        assert all(key in obs_by_key for key in content["grounded_in"])
        for entry in content["evidence"]:
            assert entry["quote"] == str(obs_by_key[entry["observation"]]["content"]["evidence"])
            assert entry["source"] == str(obs_by_key[entry["observation"]]["content"]["source"])
    catalog_groups = list(catalog["content"]["stakeholder_groups"])
    assert len(catalog_groups) == 3
    assert all(group["observations"] for group in catalog_groups), (
        "every consolidated group cites its observations"
    )

    transcripts = [
        artifact for artifact in sink.artifacts if artifact["kind"] == "interview_transcript"
    ]
    assert len(transcripts) == 3
    messages = [entry for entry in sink.items if entry["kind"] == "interview_message"]
    assert len(messages) == 18  # 3 questions asked per persona (demo stops at 3)
    assert all(entry["key"].startswith("PER-00") for entry in messages)

    # The analysis items and their links resolve.
    analyzed = [entry for entry in sink.items if entry["kind"] == "analyzed_requirement"]
    assert len(analyzed) == 6
    raw = [entry for entry in sink.items if entry["kind"] == "raw_requirement"]
    assert len(raw) == 9
    assert all(
        link["link_type"] == "stated_by" for link in sink.links if link["link_type"] == "stated_by"
    )
    derived_rows = [row for row in sink.links if row["link_type"] == "derived_from"]
    assert derived_rows, "the analysis must trace analyzed → raw"

    # Spec + backlog: rework superseded the old non-functional requirement and
    # the backlog grew a story that inherits the measurable criteria (§2.3).
    specs = [
        entry
        for entry in sink.items
        if entry["kind"] == "spec_requirement" and entry["review_status"] != "superseded"
    ]
    superseded_specs = [
        entry
        for entry in sink.items
        if entry["kind"] == "spec_requirement" and entry["review_status"] == "superseded"
    ]
    assert len(specs) == 5
    assert len(superseded_specs) == 1
    stories = [entry for entry in sink.items if entry["kind"] == "backlog_item"]
    assert len(stories) == 5
    assert any(row["link_type"] == "supersedes" for row in sink.links), (
        "the rework must supersede the old requirement"
    )

    # Two validation reports: per validator execution (per_project: many).
    reports = [artifact for artifact in sink.artifacts if artifact["kind"] == "validation_report"]
    assert len(reports) == 2

    # Every stored content is valid against its canonical schema + rules.
    value_lists = wf.value_lists()
    plan_values = {
        "elicitation_plan.topics": sink.plan_values("project-1", "topics"),
        "elicitation_plan.stakeholder_types": sink.plan_values("project-1", "stakeholder_types"),
    }
    for artifact in sink.artifacts:
        violations = domain_rules.validate_content(
            artifact["kind"], artifact["content"], value_lists=value_lists
        )
        assert violations == [], (artifact["kind"], violations)
    for entry in sink.items:
        violations = domain_rules.validate_content(
            entry["kind"],
            entry["content"],
            value_lists=value_lists,
            plan_values=plan_values,
        )
        assert violations == [], (entry["key"], violations)

    # The checkpoints took their default option: everything reviewed approved.
    assert analysis["review_status"] in {"approved"}
    assert spec["review_status"] == "approved"
    outcomes = final["checkpoint_outcomes"]
    assert {outcome["node"] for outcome in outcomes} == {
        "checkpoint_personas",
        "checkpoint_analysis",
        "checkpoint_spec",
    }
    assert all(outcome["option"] in {"approve", "accept", "ok"} for outcome in outcomes)

    # Directives: the rework round a checkpoint reject triggered was `rework`;
    # the auto-approve pass records none (§2.4), so this set is data-driven.
    kinds = {row["kind"] for row in directives.rows}
    assert kinds <= {"rework", "intent"}


def test_get_graph_topology_matches_definition() -> None:
    graph = build_re_graph()
    drawn = graph.get_graph()

    node_ids = (
        set(drawn["nodes"])
        if isinstance(drawn, dict)
        else {getattr(node, "id", node) for node in drawn.nodes}
    )
    assert len(node_ids) == 17
    assert "planner" in node_ids
    assert "corpus_builder" in node_ids
    assert "stakeholder_miner" in node_ids
    assert "validator" in node_ids
    assert "intent_router" in node_ids

    edge_pairs = (
        drawn["edges"]
        if isinstance(drawn, dict)
        else [(edge.source, edge.target) for edge in drawn.edges]
    )
    edges = {tuple(pair) for pair in edge_pairs}
    # The definition's 27 rows, error drains aside (backend-only, routing.py).
    definition_pairs = {(str(row["source"]), str(row["target"])) for row in wf.edges()}
    application_edges = {
        pair for pair in edges if not (pair[1] == "__end__" and pair[0] != "validator")
    }
    assert application_edges == definition_pairs


@pytest.mark.parametrize(
    "case",
    sorted((role, int(entry["prompt_version"])) for role, entry in agent_roles().items()),
)
def test_every_prompt_loads_and_validates(case: tuple[str, int]) -> None:
    role, version = case
    prompt = prompt_loader.load_cached(PROMPTS_PACKAGE, role, version)
    assert prompt.role == role
    assert prompt.version == version
    text = prompt.system + prompt.user
    assert "# System" not in text
    assert "# User" not in text


def test_fake_model_returns_instead_of_providers() -> None:
    # bind_tools wiring: the fake model answers the bound schema with a tool
    # call the StructuredResponse parser turns back into the model instance.
    fake = FakeChatModel(demo=DemoData())
    bound = fake.bind_tools([InterviewerTurnOutput])
    answer = bound.with_structured_output(InterviewerTurnOutput)
    result = answer.invoke(
        [("system", "x"), ("human", "PERSONA: Minh\nROLE: Student\nTRANSCRIPT SO FAR:\n(none)")]
    )
    assert isinstance(result, InterviewerTurnOutput)
    assert result.stop is False
    assert result.question


def test_research_gates_fail_the_run_at_the_lying_node() -> None:
    """Every honesty gate fires at the node that lied (the V5 contract).

    The research chain is plain edges, so a failing node's successors would
    run anyway and their own surface error would overwrite the root cause's;
    the `_stop_prior_failure` guard keeps the kept error on the first failing
    node. Each variant of the demo dataset lies in one place and the run must
    fail on exactly that node's gate message.
    """

    class DriftingQuotesData(DemoData):
        @staticmethod
        def MinerOutput(system: str, user: str, call_number: int) -> dict[str, object]:  # noqa: N802 - schema name
            answer = _mined(system, user, call_number)
            for observation in cast("list[dict[str, object]]", answer["observations"]):
                observation["evidence"] = str(observation["evidence"]) + " plus absent words"
            return answer

    class InventedUrlsData(DemoData):
        @staticmethod
        def CorpusBuilderOutput(system: str, user: str, call_number: int) -> dict[str, object]:  # noqa: N802 - schema name
            answer = _corpus(system, user, call_number)
            sources = cast("list[dict[str, object]]", answer["sources"])
            fake = dict(sources[0])
            fake.update(
                {"ref": "S9", "title": "Fabricated study", "url": "https://invented.test/doc"}
            )
            sources.append(fake)
            return answer

    class AlteredEvidenceData(DemoData):
        @staticmethod
        def GeneratorOutputV2(system: str, user: str, call_number: int) -> dict[str, object]:  # noqa: N802 - schema name
            answer = _personas(system, user, call_number)
            first = cast("list[dict[str, object]]", answer["personas"])[0]
            evidence = cast("list[dict[str, object]]", first["evidence"])[0]
            evidence["quote"] = str(evidence["quote"]) + " drifted"
            return answer

    cases = [
        (DriftingQuotesData, "stakeholder_miner_node: ", "does not quote SRC-001 word for word"),
        (InventedUrlsData, "corpus_builder_node: ", "selected invented documents"),
        (AlteredEvidenceData, "persona_generator_node: ", "altered the evidence quote of OBS-001"),
    ]
    for dataset_class, node_prefix, needle in cases:
        with patch.object(llm_factory, "make_demo_data", lambda _name, cls=dataset_class: cls()):
            reset_model_cache()
            graph = build_re_graph()
            final = graph.invoke(
                run_state(),
                config=fake_config(InMemoryArtifactSink(), InMemoryDirectiveSink()),
            )
        reset_model_cache()
        assert final["status"] == "failed", (dataset_class.__name__, final)
        message = str(final["error"]["message"])
        assert message.startswith(node_prefix), message
        assert needle in message, message
