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
from pydantic import BaseModel

import khoailanggraph.llm.factory as llm_factory
from khoailanggraph.agents.requirements_engineering import nodes

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
from khoailanggraph.domain.errors import IntegrityError
from khoailanggraph.llm import reset_model_cache
from support.fake_data import DEMO_INTENT, DemoData, _corpus, _mined, _personas
from support.fake_llm import FakeChatModel
from support.fake_search import demo_research_search
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
            "project_documents": lambda _project_id: [],
        }
    }


def run_state(max_turns: int = 6) -> REState:
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
                "max_turns": max_turns,
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
        # Drifted quotes are now SKIPPED (logged) instead of crashing the
        # miner; the observation never enters the store, so the persona
        # generator fails when its fixture cites the skipped key.
        (DriftingQuotesData, "persona_generator_node: ", "consolidates unknown observation key"),
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


def test_uploaded_documents_lead_the_corpus_and_ground_the_persona() -> None:
    """The upload half of the research corpus (docs/API.md §5): member
    documents render as `upload://` hits the curator keeps first, mining
    quotes their text verbatim, and the persona agent answers on the record
    the upload produced — origin `upload` stamped on the SRC item."""
    sink = InMemoryArtifactSink()
    directives = InMemoryDirectiveSink()
    upload_text = (
        "Parents report that 70% of mentoring questions repeat weekly. "
        "Staff answer the same ten questions every term."
    )

    def project_documents(project_id: str) -> list[dict[str, object]]:
        return [
            {
                "title": "Mentoring inbox notes",
                "url": "upload://mentoring-inbox.md",
                "publisher": "upload",
                "year": "",
                "text": upload_text,
            }
        ]

    base = fake_config(sink, directives)
    config = {
        "configurable": {
            **base["configurable"],
            "project_documents": project_documents,
        }
    }
    graph = build_re_graph()
    final = graph.invoke(run_state(), config=config)

    sources = [entry for entry in sink.items if entry["kind"] == "source_document"]
    by_url = {entry["content"]["url"]: entry for entry in sources}
    upload = by_url["upload://mentoring-inbox.md"]
    assert upload["content"]["origin"] == "upload"
    assert upload["content"]["text"] == upload_text
    assert by_url["https://en.wikipedia.org/wiki/Mentorship"]["content"]["origin"] == "web"

    observations = [entry for entry in sink.items if entry["kind"] == "stakeholder_observation"]
    uploaded_obs = next(
        entry for entry in observations if entry["content"]["source"] == upload["key"]
    )
    expected_quote = "Parents report that 70% of mentoring questions repeat weekly."
    assert uploaded_obs["content"]["evidence"] == expected_quote

    personas = [entry for entry in sink.items if entry["kind"] == "persona"]
    assert len(personas) == 1
    persona = personas[0]
    assert persona["content"]["grounded_in"] == [uploaded_obs["key"]]
    assert persona["content"]["evidence"] == [
        {
            "observation": uploaded_obs["key"],
            "source": upload["key"],
            "quote": expected_quote,
        }
    ]
    assert persona["content"]["stakeholder_type"] == "Student"

    grounded = [row for row in sink.links if row["link_type"] == "grounded_in"]
    assert {row["source_key"] for row in grounded} == {persona["key"]}

    # The whole run settles green on the one-persona fixtures: analysis,
    # specification, backlog and a passing validation all in the store.
    assert final["status"] == "succeeded", (final.get("error"), final.get("current_stage"))
    for kind in (
        "requirements_analysis",
        "requirement_specification",
        "product_backlog",
    ):
        assert sink.read_artifact("project-1", kind) is not None, kind
    assert [entry for entry in sink.items if entry["kind"] == "spec_requirement"]
    assert sink.read_artifact("project-1", "research_corpus") is not None
    reports = [a for a in sink.artifacts if a["kind"] == "validation_report"]
    assert len(reports) == 1
    assert reports[0]["content"]["status"] == "pass"


def test_invoke_retries_a_degenerate_generation() -> None:
    """A bad structured output (the streamed repetition loop of the real
    gateway) retries fresh instead of failing the run (nodes._invoke)."""

    class Probe(BaseModel):
        answer: str

    class FlakyModel:
        calls = 0

        def with_structured_output(self, _schema: type) -> FlakyModel:
            return self

        def invoke(self, _messages: object) -> Probe:
            FlakyModel.calls += 1
            if FlakyModel.calls == 1:
                msg = "Invalid JSON: EOF while parsing an object"
                raise ValueError(msg)
            return Probe(answer="clean")

    with patch.object(nodes, "get_chat_model", lambda _role, _cfg: FlakyModel()):
        result = nodes._invoke(
            "planner", {"configurable": {}}, Probe, {"output_language": "English", "intent": "test"}
        )
    assert result.answer == "clean"
    assert FlakyModel.calls == 2


def _finished_run(max_turns: int = 6) -> InMemoryArtifactSink:
    sink = InMemoryArtifactSink()
    final = build_re_graph().invoke(
        run_state(max_turns), config=fake_config(sink, InMemoryDirectiveSink())
    )
    assert final["status"] == "succeeded", final.get("error")
    return sink


def _item(sink: InMemoryArtifactSink, item_id: str) -> dict[str, object]:
    return next(entry for entry in sink.items if entry["item_id"] == item_id)


def test_the_evidence_of_a_requirement_quotes_its_message_word_for_word() -> None:
    sink = _finished_run()

    evidence = [
        link
        for link in sink.links
        if link["link_type"] == "evidenced_by"
        and _item(sink, link["source_id"])["kind"] == "raw_requirement"
    ]

    assert evidence
    for link in evidence:
        message = _item(sink, link["target_id"])["content"]
        assert link["quote"], f"{link['source_key']} quotes nothing"
        assert link["quote"] in str(message["content"])  # type: ignore[index]
        assert link["source_quote"] is None


def test_a_quote_that_is_not_in_the_message_makes_the_sink_refuse_the_link() -> None:
    sink = _finished_run()
    raw = next(entry for entry in sink.items if entry["kind"] == "raw_requirement")
    message = next(entry for entry in sink.items if entry["kind"] == "interview_message")

    with pytest.raises(IntegrityError):
        sink.add_link(
            source_id=str(raw["item_id"]),
            target_id=str(message["item_id"]),
            link_type="derived_from",
            target_quote="words that nobody said",
        )


def test_an_agent_whose_quote_is_not_exact_still_links_the_items() -> None:
    sink = _finished_run()
    raw = next(entry for entry in sink.items if entry["kind"] == "raw_requirement")
    messages = [entry for entry in sink.items if entry["kind"] == "interview_message"]
    other = next(
        entry
        for entry in messages
        if all(
            link["target_id"] != entry["item_id"]
            for link in sink.links
            if link["source_id"] == raw["item_id"]
        )
    )
    known = {
        str(other["key"]): {
            "item_id": str(other["item_id"]),
            "kind": "interview_message",
            "key": str(other["key"]),
            "version": 1,
        }
    }

    nodes._link_each(
        sink,
        str(raw["item_id"]),
        "evidenced_by",
        known,
        [nodes.MessageLink(message=str(other["key"]), target_quote="words that nobody said")],
    )

    assert sink.links[-1]["target_id"] == other["item_id"]
    assert sink.links[-1]["quote"] is None


def test_every_agent_step_reports_to_the_user_except_the_interview_turns() -> None:
    sink = _finished_run()

    roles = [report["agent_role"] for report in sink.reports]

    assert roles[0] == "planner"
    assert roles[1] == "corpus_builder"
    assert roles.count("stakeholder_miner") == 3, "one report for each document that was read"
    assert {"persona_generator", "analyst", "requirement_engineer", "backlog_manager"} <= set(roles)
    assert "validator" in roles
    assert "interviewer" not in roles
    assert "persona_agent" not in roles
    assert all(report["content"].strip() for report in sink.reports)


def test_a_report_refers_to_what_its_step_wrote() -> None:
    sink = _finished_run()

    by_role = {report["agent_role"]: report for report in sink.reports}

    planner = by_role["planner"]
    assert len(planner["artifact_ids"]) == 1
    assert planner["item_ids"] == []
    analyst = by_role["analyst"]
    written = {str(_item(sink, item_id)["kind"]) for item_id in analyst["item_ids"]}
    assert {"raw_requirement", "analyzed_requirement"} <= written
    backlog = by_role["backlog_manager"]
    assert {str(_item(sink, item_id)["kind"]) for item_id in backlog["item_ids"]} == {
        "backlog_item"
    }


def _transcripts(sink: InMemoryArtifactSink) -> list[dict[str, object]]:
    return [entry for entry in sink.artifacts if entry["kind"] == "interview_transcript"]


def test_a_transcript_gets_a_sentence_about_what_the_persona_said() -> None:
    sink = _finished_run()

    transcripts = _transcripts(sink)

    assert len(transcripts) == 3
    for transcript in transcripts:
        content = transcript["content"]
        assert content["status"] == "completed"  # type: ignore[index]
        assert content["stop_reason"] == "interviewer_stopped"  # type: ignore[index]
        assert 0 < len(str(transcript["summary"])) <= 160


def test_an_interview_that_reaches_the_turn_limit_is_closed_and_summed_up_too() -> None:
    sink = _finished_run(max_turns=3)

    transcripts = _transcripts(sink)

    assert len(transcripts) == 3
    for transcript in transcripts:
        content = transcript["content"]
        assert content["status"] == "completed"  # type: ignore[index]
        assert content["stop_reason"] == "max_turns"  # type: ignore[index]
        assert content["turn_count"] == 3  # type: ignore[index]
        assert transcript["summary"]
