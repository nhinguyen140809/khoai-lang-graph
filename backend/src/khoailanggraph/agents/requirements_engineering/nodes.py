"""The nodes of the requirements engineering graph (version 2).

The topology follows `definition.v2.json` exactly (mapping §2.1): planner →
corpus_builder → stakeholder_miner → persona_generator → checkpoint_personas
→ the interview loop → analyst → (rework_elicitation | checkpoint_analysis) →
requirement_engineer → checkpoint_spec → backlog_manager → validator. The
research stage (MAJ-EVAL, arXiv:2507.21028) grounds the personas in real
documents: the corpus builder curates search hits into source documents, the
miner pulls stakeholder observations with verbatim evidence out of them, and
the persona generator builds every persona from the observations, rejecting
any evidence quote that does not appear in the mined record. Checkpoint
options walk the conditional edges named after them; the analyst verdict
decides whether the stakeholders are interviewed again; the validator ends a
still-failing run at the iteration limit instead of failing the run.

Every agent node calls `llm.get_chat_model(role, config)` — never a
hard-coded model — and returns a structured output model, never prose. Every
artifact and link goes through the `ArtifactSink` of the run, which enforces
the domain rules; the state keeps references only. A node failure becomes an
error update that drains the run to the graph exit (the safe_node pattern of
the prototype); LangGraph control flow (a checkpoint's `interrupt`) passes
through untouched. Nothing here imports FastAPI or the features layer.
"""

import json
import time
from collections.abc import Callable, Mapping, Sequence
from functools import wraps
from typing import TYPE_CHECKING, Any, TypeVar, cast

import structlog
from langchain_core.runnables import RunnableConfig
from pydantic import BaseModel

from khoailanggraph.agents import prompts as prompt_loader
from khoailanggraph.agents.requirements_engineering import orchestrator, review
from khoailanggraph.agents.requirements_engineering.decisions import (
    AppliedDecision,
    DecisionResult,
    DecisionSpec,
    apply_confidence_policy,
    policy_from_environment,
    run_decision,
)
from khoailanggraph.agents.requirements_engineering.definition import (
    agent_roles as definition_agent_roles,
)
from khoailanggraph.agents.requirements_engineering.definition import link_types as get_link_types
from khoailanggraph.agents.requirements_engineering.definition import nodes as definition_nodes
from khoailanggraph.agents.requirements_engineering.definition import (
    persona_aspects as definition_persona_aspects,
)
from khoailanggraph.agents.requirements_engineering.definition import value_lists as get_value_lists
from khoailanggraph.agents.requirements_engineering.outputs import (
    AnalystOutput,
    BacklogOutput,
    CorpusBuilderOutput,
    EngineerOutput,
    GeneratorOutputV2,
    IntentDirectiveOutput,
    InterviewerTurnOutput,
    ItemLink,
    LinkRef,
    MessageLink,
    MinerOutput,
    PersonaAnswerOutput,
    PlannerOutput,
    ValidatorOutput,
    generator_output_for,
    interviewer_output_for,
)
from khoailanggraph.agents.requirements_engineering.ports import (
    ArtifactSink,
    DirectiveItem,
    DirectiveSink,
    ItemRecord,
    LlmGate,
    RunLimitError,
)
from khoailanggraph.agents.requirements_engineering.state import ArtifactRef, REState
from khoailanggraph.agents.requirements_engineering.views import (
    prompt_view,
    prompt_views,
    transcript_lines,
)
from khoailanggraph.domain import rules as domain_rules
from khoailanggraph.domain.run_config import RunConfig
from khoailanggraph.llm import get_chat_model, resolve_model_id
from khoailanggraph.llm.usage import UsageHandler
from khoailanggraph.tools.research import research_queries, research_search_of

if TYPE_CHECKING:
    from langchain_core.language_models.chat_models import BaseChatModel

PROMPTS_PACKAGE = "khoailanggraph.agents.requirements_engineering"

# One degenerate streamed generation retries fresh twice before failing.
_LLM_PARSE_ATTEMPTS = 3

logger = structlog.get_logger(__name__)

_T = TypeVar("_T", bound=BaseModel)
NodeFn = Callable[..., dict[str, Any]]

ItemRefDict = dict[str, Any]
Known = dict[str, ItemRefDict]


def _log_decision(
    node: str,
    decision_id: str,
    result: DecisionResult,
    applied: list[AppliedDecision],
    extra: str,
) -> None:
    """One structured log line per gate decision — the observability of the
    decision layer: provider, per-spec action, fallback, latency."""
    logger.info(
        "decision",
        node=node,
        decision_id=decision_id,
        provider=result.provider,
        fallback_used=result.fallback_used,
        latency_ms=round(result.latency_ms, 1),
        applied=[item.model_dump(mode="json") for item in applied],
        summary=extra,
    )


# ---------------------------------------------------------------------------
# Config access and the one LLM call helper


def _configurable(config: Mapping[str, Any] | RunnableConfig | None) -> Mapping[str, Any]:
    value = dict(config or {}).get("configurable", {})
    return value if isinstance(value, dict) else {}


def _review_for(state: REState, checkpoint: str, output: Any) -> dict[str, Any]:
    """The state update that keeps what a node wrote for the review after it."""
    brief = getattr(output, "review", None)
    if brief is None:
        return {}
    briefs = {**state.get("review_briefs", {}), checkpoint: brief.model_dump(mode="json")}
    return {"review_briefs": briefs}


def _decisions_of(state: REState, checkpoint: str) -> str:
    """What the user decided at the latest review of `checkpoint`, when they answered questions of
    the agent there: the lines that the agents after it read as part of their instruction."""
    for outcome in reversed(state["checkpoint_outcomes"]):
        if outcome["node"] == checkpoint:
            return outcome["feedback"] if not outcome.get("automatic") else ""
    return ""


def _instruction(*parts: str) -> str:
    """The parts that are not empty, one after the other."""
    return "\n\n".join(part for part in parts if part)


def _tell_user(sink: ArtifactSink, output: Any) -> None:
    """What the node tells the user: its notes while it worked, then its report as a message."""
    sink.add_notes([note.model_dump() for note in output.notes])
    sink.add_report(output.report)


def _sink(config: Mapping[str, Any] | RunnableConfig | None) -> ArtifactSink:
    sink = _configurable(config).get("artifact_sink")
    if sink is None:
        msg = "the run config must provide an artifact_sink"
        raise RuntimeError(msg)
    return sink  # type: ignore[no-any-return]


def _directive_sink(config: Mapping[str, Any] | RunnableConfig | None) -> DirectiveSink:
    sink = _configurable(config).get("directive_sink")
    if sink is None:
        msg = "the run config must provide a directive_sink"
        raise RuntimeError(msg)
    return sink  # type: ignore[no-any-return]


def _run_id(config: Mapping[str, Any] | RunnableConfig | None) -> str:
    return str(_configurable(config).get("run_id", ""))


def _run_config(state: REState) -> RunConfig:
    return RunConfig.model_validate(state["run_config"])


def _language(run_config: RunConfig) -> str:
    return "English" if run_config.output_language == "en" else "Vietnamese"


def _reply_tail(exc: Exception) -> str:
    """The last characters of a reply that was cut at the length limit, '' for other errors."""
    try:
        message = exc.completion.choices[0].message  # type: ignore[attr-defined]
        calls = message.tool_calls or []
        text = calls[0].function.arguments if calls else (message.content or "")
    except (AttributeError, IndexError, TypeError):
        return ""
    return f"{len(text)} chars, ends: {text[-300:]!r}"


def _invoke[T: BaseModel](
    role: str,
    config: Mapping[str, Any] | RunnableConfig | None,
    schema: type[T],
    prompt_values: Mapping[str, str],
) -> T:
    """Assemble the role's prompt, ask its model, and parse the structured output.

    The prompt version comes from the workflow definition's `agent_roles`
    entry of the role, so one role can move to a new prompt (the persona
    generator's v2) while every other role keeps the version it shipped.
    """
    roles = definition_agent_roles()
    entry = roles.get(role)
    if entry is None:
        msg = f"role '{role}' has no agent_roles entry in the workflow definition"
        raise ValueError(msg)
    prompt = prompt_loader.load_cached(PROMPTS_PACKAGE, role, int(entry["prompt_version"]))
    messages = prompt_loader.assemble_prompt(prompt, prompt_values)
    model: BaseChatModel = get_chat_model(role, config)
    gate = cast("LlmGate | None", _configurable(config).get("llm_gate"))
    model_id = resolve_model_id(role, cast("Mapping[str, Any]", config))
    # A streamed generation can degenerate (a repetition loop that ends in a
    # truncated, unparseable tool call — seen as 386KB of junk on the real
    # gateway 2026-10-27). One fresh attempt is almost always clean, so a bad
    # parse retries instead of failing the whole run.
    last_error: Exception | None = None
    for attempt in range(_LLM_PARSE_ATTEMPTS):
        if gate is not None:
            gate.before_call(role)
        handler = UsageHandler(
            on_text=None if gate is None else (lambda text: gate.record_text(role, text))
        )
        started = time.monotonic()
        try:
            answer = model.with_structured_output(schema).invoke(
                messages, config={"callbacks": [handler]}
            )
            if not isinstance(answer, schema):
                msg = f"{role} returned {type(answer).__name__}, expected {schema.__name__}"
                raise TypeError(msg)
            return answer
        except Exception as exc:
            last_error = exc
            if attempt < _LLM_PARSE_ATTEMPTS - 1:
                logger.warning(
                    "llm retry",
                    role=role,
                    attempt=attempt + 1,
                    error=f"{type(exc).__name__}: {str(exc)[:200]}",
                    reply_tail=_reply_tail(exc),
                )
        finally:
            # A call that failed was paid for as well: its tokens count.
            if gate is not None:
                elapsed = int((time.monotonic() - started) * 1000)
                gate.record_call(role, model_id, handler.usage(model_id, elapsed))
    if last_error is None:  # unreachable: the loop always ran at least once
        msg = f"{role} produced no answer"
        raise RuntimeError(msg)
    raise last_error


# ---------------------------------------------------------------------------
# The safe_node wrapper (kept from the prototype)


def _agent_role_of_node(name: str) -> str | None:
    """The agent role of a node by the name of its function (`analyst_node`, or the node id)."""
    node = definition_nodes().get(name.removesuffix("_node"))
    role = None if node is None else node.get("agent_role")
    return None if role is None else str(role)


def safe_node(fn: NodeFn) -> NodeFn:
    """Turn any node failure into an error update instead of a crash.

    Any exception becomes `error` + `status: failed`, so the conditional
    edges drain the run to the graph exit. LangGraph control flow (a
    checkpoint's `interrupt`) is re-raised untouched.
    """

    @wraps(fn)
    def wrapper(state: REState, config: RunnableConfig | None = None) -> dict[str, Any]:
        sink = _configurable(config).get("artifact_sink")
        if sink is not None:
            sink.begin_node(_agent_role_of_node(fn.__name__))
        try:
            return fn(state, config or {})
        except Exception as exc:
            return {
                "error": {
                    "code": exc.code if isinstance(exc, RunLimitError) else "node_failed",
                    "message": f"{fn.__name__}: {exc}",
                    "stage": str(state.get("current_stage", "")),
                },
                "status": "failed",
            }

    return wrapper


def _plan_term(value: str) -> str:
    """A plan term as compared: trimmed and without sentence punctuation.

    Real plans type their stakeholder types as short sentences ("…staff."),
    and models copy them with or without the trailing period — the term is
    the words, the punctuation is not.
    """
    return value.strip().strip(".,;:").casefold()


_WORD_MIN = 4
_PARAPHRASE_THRESHOLD = 0.7


def _content_words(text: str) -> frozenset[str]:
    """The content words of a plan term: 4+ letters, simple plural stemming."""
    return frozenset(
        (w if len(w) <= _WORD_MIN else w.removesuffix("s"))
        for w in text.replace(".", " ")
        .replace(",", " ")
        .replace("(", " ")
        .replace(")", " ")
        .split()
        if len(w) >= _WORD_MIN
    )


def match_plan_value(value: str, allowed: list[str]) -> str | None:
    """The plan term `value` stands for, verbatim; None when it matches none.

    The controlled vocabulary of the plan is the one the artifacts must
    reuse. Five matching tiers, from strict to tolerant:

    1. Verbatim — the value is exactly a plan term.
    2. Casefold + punctuation — the same words, different case or period.
    3. Decoration — the plan term appears inside the value's wording.
    4. Shortening — the value is inside a plan term, keeping at least
       half its words (a dropped parenthetical or trailing clause).
    5. Paraphrase — the value and the plan term share at least 70% of
       their content words (with simple plural stemming). A model may
       reorder or drop words while keeping the topic's meaning.

    A value matching none of these stays None so the caller can reject it
    honestly. Sentence punctuation around either side never decides the
    match.
    """
    if value in allowed:
        return value
    lowered = _plan_term(value)
    candidates = [(term, _plan_term(term)) for term in allowed]
    for original, candidate in candidates:
        if candidate == lowered:
            return original
    best_pair = max(
        ((original, candidate) for original, candidate in candidates if candidate),
        key=lambda pair: len(pair[1]),
        default=("", ""),
    )
    best_term, best_candidate = best_pair
    if best_candidate and best_candidate in lowered:
        return best_term
    containing = [
        (original, candidate)
        for original, candidate in candidates
        if lowered
        and candidate
        and lowered in candidate
        and len(lowered.split()) * 2 >= len(candidate.split())
    ]
    if containing:
        return max(containing, key=lambda pair: len(pair[1]))[0]
    # Paraphrase: word overlap with simple stemming — the model reworded
    # the term but kept most of its content words.
    if lowered:
        value_words = _content_words(lowered)
        best_overlap, best_original = 0.0, None
        for original, candidate in candidates:
            if not candidate:
                continue
            term_words = _content_words(candidate)
            if not term_words:
                continue
            overlap = len(value_words & term_words) / len(term_words)
            if overlap > best_overlap:
                best_overlap = overlap
                best_original = original
        if best_original is not None and best_overlap >= _PARAPHRASE_THRESHOLD:
            return best_original
    return None


# ---------------------------------------------------------------------------
# Shared helpers: known items, links, superseding


def _known_of(sink: ArtifactSink, state: REState) -> Known:
    """Every persona and interview message by key, for link resolution."""
    known: Known = {}
    for ref in state["personas"]:
        persona = sink.read_item(ref["item_id"])
        known[persona["key"]] = {
            "item_id": persona["item_id"],
            "kind": persona["kind"],
            "key": persona["key"],
            "version": persona["version"],
        }
        record = sink.read_artifact(
            state["project_id"], "interview_transcript", subject_id=persona["item_id"]
        )
        if record is None:
            continue
        for message in sink.read_items(record["artifact_id"]):
            known[message["key"]] = {
                "item_id": message["item_id"],
                "kind": message["kind"],
                "key": message["key"],
                "version": message["version"],
            }
    return known


def _must_find(known: Known, value: str) -> ItemRefDict:
    target = known.get(value)
    if target is None:
        msg = f"no known item for the reference {value}"
        raise ValueError(msg)
    return target


def _key_of(reference: LinkRef | MessageLink) -> str:
    """The key (or ref) an agent named in a link, whether it gave a key or an object."""
    if isinstance(reference, str):
        return reference
    return reference.message if isinstance(reference, MessageLink) else reference.item


def _quotes_of(reference: LinkRef | MessageLink) -> tuple[str | None, str | None]:
    """The words a link is about, on the source and on the target; none for a bare key."""
    if isinstance(reference, str):
        return None, None
    if isinstance(reference, MessageLink):
        return None, reference.target_quote
    return reference.source_quote, reference.target_quote


def _held_quote(
    sink: ArtifactSink,
    side: str,
    quote: str | None,
    *,
    link_type: str,
    item_id: str,
) -> str | None:
    """A quote that the quote rules accept, else none: a model that does not copy the words
    exactly still links the items, without the words (logged)."""
    if quote is None:
        return None
    item = sink.read_item(item_id)
    violations = domain_rules.check_quote(
        side,
        quote,
        link_type=link_type,
        link_type_definition=get_link_types()[link_type],
        kind=item["kind"],
        content=item["content"],
    )
    if violations:
        logger.warning(
            "link quote dropped",
            link_type=link_type,
            side=side,
            item=item["key"],
            reason=violations[0].message,
            quote=quote[:80],
        )
        return None
    return quote


def _link_each(
    sink: ArtifactSink,
    source_id: str,
    link_type: str,
    known: Known,
    references: Sequence[LinkRef | MessageLink],
) -> None:
    """One link of `link_type` per referenced key, with the words it quotes; an unknown key
    fails loudly."""
    for reference in references:
        target = _must_find(known, _key_of(reference))
        source_quote, target_quote = _quotes_of(reference)
        sink.add_link(
            source_id=source_id,
            target_id=target["item_id"],
            link_type=link_type,
            source_quote=_held_quote(
                sink, "source", source_quote, link_type=link_type, item_id=source_id
            ),
            target_quote=_held_quote(
                sink, "target", target_quote, link_type=link_type, item_id=target["item_id"]
            ),
        )


def _evidence_links(
    sink: ArtifactSink,
    source_id: str,
    known: Known,
    evidence: list[Any],
) -> None:
    """One `evidenced_by` link per message, with the words of the message that it quotes."""
    seen: set[str] = set()
    for entry in evidence:
        if entry.message in seen:
            continue
        seen.add(entry.message)
        _link_each(sink, source_id, "evidenced_by", known, [entry.as_link()])


def _supersede_each(
    sink: ArtifactSink,
    current: Known,
    source_id: str,
    supersedes: list[str],
) -> None:
    """Link a new item to what it replaces and mark the old ones superseded."""
    for key in supersedes:
        replaced = _must_find(current, key)
        sink.add_link(source_id=source_id, target_id=replaced["item_id"], link_type="supersedes")
        sink.mark_item_superseded(replaced["item_id"])


def _directive_for(
    state: REState,
    config: Mapping[str, Any] | None,
    checkpoint: str,
) -> str:
    """The rework instruction of a re-entering stage: the review feedback, or
    the latest rework directive of the run, or empty on a first pass."""
    for outcome in reversed(state["checkpoint_outcomes"]):
        if outcome["node"] == checkpoint and outcome["feedback"]:
            return outcome["feedback"]
    directives = state["rework_directives"]
    if directives:
        directive = _directive_sink(config).read_directive(directives[-1])
        if directive is not None:
            return str(directive["instruction"])
    return ""


# ---------------------------------------------------------------------------
# The elicitation nodes


@safe_node
def planner_node(
    state: REState,
    config: RunnableConfig | None = None,
) -> dict[str, Any]:
    cfg = _run_config(state)
    plan: PlannerOutput = _invoke(
        "planner",
        config or {},
        PlannerOutput,
        {"output_language": _language(cfg), "intent": state["initial_intent"]},
    )
    sink = _sink(config or {})
    created = sink.create_artifact(
        state["project_id"],
        "elicitation_plan",
        title="Elicitation plan",
        content=plan.model_dump(mode="json", exclude={"report", "notes", "summary"}),
        summary=plan.summary,
    )
    _tell_user(sink, plan)
    return {"elicitation_plan": dict(created), "current_stage": "planning"}


def _plan_terms(
    sink: ArtifactSink,
    state: REState,
) -> tuple[dict[str, Any] | None, list[str], list[str]]:
    """The plan record with its topics and stakeholder types, if the plan exists."""
    plan_record = sink.read_artifact(state["project_id"], "elicitation_plan")
    if plan_record is None:
        return None, [], []
    plan_content = cast("dict[str, list[str]]", plan_record["content"])
    return (
        dict(plan_record),
        [str(topic) for topic in plan_content.get("topics", [])],
        [str(name) for name in plan_content.get("stakeholder_types", [])],
    )


def _stop_prior_failure(state: REState) -> bool:
    """True when a node earlier in the plain-edge chain already failed.

    The research stage sits on plain edges (`planner → corpus_builder →
    stakeholder_miner → persona_generator → checkpoint_personas`), and
    conditional routing reads `status` only at routing points — so without
    this guard, a failed node's plain successors still execute and their
    own surface error would overwrite the root cause's.
    """
    return bool(state.get("status") == "failed")


@safe_node
def corpus_builder_node(
    state: REState,
    config: RunnableConfig | None = None,
) -> dict[str, Any]:
    """The corpus step (MAJ-EVAL): search the world, keep what carries voices.

    The queries are built in node code from the plan's topics and stakeholder
    types — no LLM round trip — and the injected search tool runs them; the
    one structured call curates the hits into source documents. Anything the
    model invents beyond the hits is refused by the prompt contract, and the
    honest-mode check below keeps only hits the tool actually returned.
    """
    if _stop_prior_failure(state):
        return {}
    cfg = _run_config(state)
    sink = _sink(config or {})
    plan_record, topics, stakeholder_types = _plan_terms(sink, state)

    search = research_search_of(config or {})
    documents_tool = _configurable(config).get("project_documents")
    uploaded = documents_tool(str(state["project_id"])) if documents_tool is not None else []
    hits = [
        *uploaded,
        *search(research_queries(topics, stakeholder_types, state["initial_intent"])),
    ]
    known_urls = {str(hit.get("url", "")) for hit in hits}
    hits_lines = "\n".join(json.dumps(hit, ensure_ascii=False) for hit in hits) or "(no hits)"

    draft: CorpusBuilderOutput = _invoke(
        "corpus_builder",
        config or {},
        CorpusBuilderOutput,
        {
            "output_language": _language(cfg),
            "intent": state["initial_intent"],
            "plan": (
                json.dumps(plan_record["content"], ensure_ascii=False)
                if plan_record is not None
                else "(no plan; cover the intent's obvious stakeholder types)"
            ),
            "target_sources_num": str(cfg.parameters.target_sources_num),
            "search_results": hits_lines,
        },
    )
    outside = [source.url for source in draft.sources if source.url not in known_urls]
    if outside:
        msg = f"corpus builder selected invented documents: {outside}"
        raise ValueError(msg)

    if not draft.sources:
        msg = (
            "research found no source document to mine: the web search returned "
            f"{len(hits)} usable result(s). Upload documents to the project or set "
            "TAVILY_API_KEY, then run again"
        )
        raise ValueError(msg)

    corpus = sink.create_artifact(
        state["project_id"],
        "research_corpus",
        title="Research corpus",
        content={"selection_rationale": draft.selection_rationale},
        summary=f"{len(draft.sources)} documents",
    )
    sources: list[ItemRefDict] = []
    for source in draft.sources:
        content = source.model_dump(mode="json", exclude={"ref"})
        content["origin"] = (
            "upload" if str(content.get("url", "")).startswith("upload://") else "web"
        )
        item = sink.add_item(
            corpus["artifact_id"],
            "source_document",
            content,
            ref=source.ref,
        )
        sources.append(dict(item))
    _tell_user(sink, draft)
    return {
        "research_corpus": dict(corpus),
        "current_stage": "research",
    }


@safe_node
def stakeholder_miner_node(
    state: REState,
    config: RunnableConfig | None = None,
) -> dict[str, Any]:
    """The mining step (MAJ-EVAL): stakeholder tuples with verbatim evidence.

    One structured call per source document; every observation must quote the
    document word for word and name the document's key, or the node fails —
    a fabricated quote never enters the store. Refs are renumbered across the
    whole node response, unique per response as the sink contract demands.
    """
    if _stop_prior_failure(state):
        return {}
    cfg = _run_config(state)
    sink = _sink(config or {})
    corpus = state.get("research_corpus")
    if corpus is None:
        msg = "no research corpus to mine; run the corpus builder first"
        raise ValueError(msg)
    source_records = [
        record
        for record in sink.read_items(corpus["artifact_id"])
        if record["kind"] == "source_document"
    ]

    observations: list[ItemRefDict] = []
    ref_number = 0
    for record in source_records:
        document = str(record["content"].get("text", ""))
        draft: MinerOutput = _invoke(
            "stakeholder_miner",
            config or {},
            MinerOutput,
            {
                "output_language": _language(cfg),
                "intent": state["initial_intent"],
                "source": json.dumps(prompt_view(record), ensure_ascii=False),
                "document": document,
            },
        )
        for mined in draft.observations:
            if str(mined.source) != str(record["key"]):
                logger.warning(
                    "miner observation skipped: wrong source",
                    dimension=str(mined.dimension),
                    cites=str(mined.source),
                    actual=str(record["key"]),
                )
                continue
            if mined.evidence not in document:
                logger.warning(
                    "miner observation skipped: evidence not verbatim",
                    dimension=str(mined.dimension),
                    evidence=str(mined.evidence)[:100],
                    source=str(record["key"]),
                )
                continue
            ref_number += 1
            item = sink.add_item(
                corpus["artifact_id"],
                "stakeholder_observation",
                mined.model_dump(mode="json", exclude={"ref"}),
                ref=f"O{ref_number}",
            )
            sink.add_link(
                source_id=item["item_id"],
                target_id=record["item_id"],
                link_type="evidenced_by",
                target_quote=_held_quote(
                    sink,
                    "target",
                    str(mined.evidence),
                    link_type="evidenced_by",
                    item_id=record["item_id"],
                ),
            )
            observations.append(dict(item))
        _tell_user(sink, draft)
    return {
        "observations": observations,
        "current_stage": "research",
    }


def _check_groups(
    draft: GeneratorOutputV2,
    known_observations: dict[str, ItemRecord],
) -> None:
    """Every consolidated group cites observation keys that exist."""
    for group in draft.stakeholder_groups:
        for key in group.observations:
            if key not in known_observations:
                msg = f"group '{group.name}' consolidates unknown observation key '{key}'"
                raise ValueError(msg)


def _check_persona_grounding(
    persona: Any,
    known_observations: dict[str, ItemRecord],
) -> None:
    """A persona's evidence is the mined record, word for word, and its
    `grounded_in` keys exist — nothing invented reaches the store."""
    if not persona.evidence:
        msg = f"persona '{persona.name}' carries no evidence"
        raise ValueError(msg)
    for entry in persona.evidence:
        record = known_observations.get(entry.observation)
        if record is None:
            msg = f"persona '{persona.name}' cites unknown observation key '{entry.observation}'"
            raise ValueError(msg)
        content = cast("dict[str, Any]", record["content"])
        if entry.quote != str(content["evidence"]):
            msg = f"persona '{persona.name}' altered the evidence quote of {entry.observation}"
            raise ValueError(msg)
        if entry.source != str(content["source"]):
            msg = (
                f"persona '{persona.name}' names source '{entry.source}' but "
                f"{entry.observation} was mined from '{content['source']}'"
            )
            raise ValueError(msg)
    for key in persona.grounded_in:
        if key not in known_observations:
            msg = f"persona '{persona.name}' is grounded in unknown observation '{key}'"
            raise ValueError(msg)


@safe_node
def persona_generator_node(
    state: REState,
    config: RunnableConfig | None = None,
) -> dict[str, Any]:
    """The persona step (MAJ-EVAL step 2): ground every persona in evidence.

    The clusters of the mined observations, the personas built on them, and
    every evidence quote are checked against the observation record — a quote
    that drifted from what was mined, or an observation key that does not
    exist, fails the run instead of entering the store.
    """
    if _stop_prior_failure(state):
        return {}
    cfg = _run_config(state)
    sink = _sink(config or {})
    plan_record, _topics, _stakeholder_types = _plan_terms(sink, state)

    observation_records: list[ItemRecord] = [
        sink.read_item(reference["item_id"]) for reference in state.get("observations", [])
    ]
    known_observations = {record["key"]: record for record in observation_records}
    observations_lines = (
        prompt_views(observation_records) or "(none mined; fall back to the intent)"
    )

    aspects = persona_aspect_list(
        cast("dict[str, Any]", plan_record["content"]) if plan_record is not None else None
    )
    draft: GeneratorOutputV2 = _invoke(
        "persona_generator",
        config or {},
        generator_output_for(sorted(known_observations), [entry["key"] for entry in aspects]),
        {
            "output_language": _language(cfg),
            "intent": state["initial_intent"],
            "plan": (
                json.dumps(plan_record["content"], ensure_ascii=False)
                if plan_record is not None
                else "(no plan; cover the intent's obvious stakeholder types)"
            ),
            "observations": observations_lines,
            "aspects": aspect_lines(aspects),
            "target_personas_num": str(cfg.parameters.target_personas_num),
        },
    )

    if plan_record is not None:
        plan_content = cast("dict[str, list[str]]", plan_record["content"])
        allowed = plan_content.get("stakeholder_types", [])
        # Same tolerant matching as the personas themselves: the model phrases
        # a plan term without its sentence punctuation ("…staff" for the
        # plan's "…staff."), and punctuation must not decide the match.
        outside = [
            value
            for value in draft.uncovered_stakeholder_types
            if match_plan_value(value, allowed) is None
        ]
        if outside:
            msg = f"personas listed unknown stakeholder types: {outside}"
            raise ValueError(msg)
    else:
        allowed = []
    _check_groups(draft, known_observations)

    catalog = sink.create_artifact(
        state["project_id"],
        "persona_catalog",
        title="Persona catalog",
        content={
            "selection_rationale": draft.selection_rationale,
            "stakeholder_groups": [
                group.model_dump(mode="json", exclude={"ref"}) for group in draft.stakeholder_groups
            ],
            "uncovered_stakeholder_types": draft.uncovered_stakeholder_types,
        },
        summary=(
            f"{len(draft.personas)} personas, grounded in {len(observation_records)} observations"
        ),
    )
    personas: list[ItemRefDict] = []
    for persona_draft in draft.personas:
        _check_persona_grounding(persona_draft, known_observations)
        content = persona_draft.model_dump(mode="json", exclude={"ref"})
        # The trait as the user reads it comes from the aspect, not from the model.
        titles = {entry["key"]: entry["title"] for entry in aspects}
        content["scores"] = [
            {**score, "title": titles.get(score["aspect"], score["aspect"])}
            for score in content.get("scores", [])
        ]
        if allowed:
            matched = match_plan_value(str(content.get("stakeholder_type", "")), allowed)
            if matched is None:
                # The plan's stakeholder_types are the lawful vocabulary: a
                # persona typed outside it is skipped (logged) — the evidence
                # may be real (e.g. parents in the uploaded document) but the
                # plan didn't list it, so the persona doesn't enter the store.
                logger.warning(
                    "persona skipped: stakeholder_type outside plan",
                    name=str(content.get("name", "?")),
                    stakeholder_type=str(content.get("stakeholder_type", "")),
                    plan_types=sorted(allowed),
                )
                continue
            content["stakeholder_type"] = matched
        content["interview_status"] = "not_started"
        item = sink.add_item(catalog["artifact_id"], "persona", content, ref=persona_draft.ref)
        personas.append(dict(item))
        for key in persona_draft.grounded_in:
            sink.add_link(
                source_id=item["item_id"],
                target_id=known_observations[key]["item_id"],
                link_type="grounded_in",
            )
    _tell_user(sink, draft)
    return {
        "personas": personas,
        "interview_transcripts": [],
        "interview_turn": 0,
        "active_persona_index": 0,
        "interviewer_stop": False,
        "current_stage": "persona_generation",
        **_review_for(state, "checkpoint_personas", draft),
    }


INTERVIEWER_KEY = "interviewer"


def _role_of(transcript: dict[str, Any], message: ItemRecord) -> str:
    """The role (`interviewer` or `persona`) of the participant who says a message."""
    speaker = message["content"]["speaker"]
    for participant in transcript["content"]["participants"]:
        if participant["key"] == speaker:
            return str(participant["role"])
    return "persona"


def _transcript_of(
    state: REState,
    sink: ArtifactSink,
    persona: ItemRecord,
) -> tuple[dict[str, Any], list[ItemRecord]]:
    """The interview transcript of one persona, created on the first question."""
    record = sink.read_artifact(
        state["project_id"], "interview_transcript", subject_id=persona["item_id"]
    )
    if record is not None:
        return dict(record), sink.read_items(record["artifact_id"])
    created = sink.create_artifact(
        state["project_id"],
        "interview_transcript",
        title=f"Interview with {persona['content'].get('name', persona['key'])}",
        content={
            "participants": [
                {
                    "key": INTERVIEWER_KEY,
                    "name": "Interviewer",
                    "role": "interviewer",
                    "item_id": None,
                },
                {
                    "key": str(persona["key"]),
                    "name": str(persona["content"].get("name", persona["key"])),
                    "role": "persona",
                    "item_id": str(persona["item_id"]),
                },
            ],
            "status": "in_progress",
            "turn_count": 0,
            "stop_reason": None,
            "data_coverage": [],
            "top_findings": [],
            "follow_ups": [],
        },
        subject_id=persona["item_id"],
    )
    return dict(created), []


def _set_summary(sink: ArtifactSink, artifact_id: str, summary: str | None) -> None:
    """The overview of an artifact that a pass updated, when the agent wrote a new one."""
    if summary:
        sink.set_artifact_summary(artifact_id, summary)


def _plan_topics(sink: ArtifactSink, state: REState) -> list[str]:
    """The topics of the elicitation plan; none when the project has no plan."""
    record = sink.read_artifact(state["project_id"], "elicitation_plan")
    if record is None:
        return []
    topics = cast("dict[str, list[str]]", record["content"]).get("topics", [])
    return [str(topic) for topic in topics]


def _ask_interviewer(
    state: REState,
    config: RunnableConfig | Mapping[str, Any],
    persona: ItemRecord,
    messages: list[ItemRecord],
    *,
    limit_reached: bool,
) -> InterviewerTurnOutput:
    """One turn of the interviewer: the next question, or the stop with the summary of the
    interview. With `limit_reached` the turn limit ended the interview: the interviewer writes
    the summary and asks nothing."""
    cfg = _run_config(state)
    sink = _sink(config)
    plan_record = sink.read_artifact(state["project_id"], "elicitation_plan")
    plan_lines = "(no plan)"
    plan = cast("dict[str, Any]", plan_record["content"]) if plan_record is not None else None
    if plan is not None:
        plan_lines = plan_lines_of(plan)
    data_items = plan_data_items(plan)
    turn: InterviewerTurnOutput = _invoke(
        "interviewer",
        config,
        interviewer_output_for(
            data_items,
            [str(topic) for topic in (plan or {}).get("topics", [])],
            [str(message["key"]) for message in messages[-TRANSCRIPT_TAIL:]],
        ),
        {
            "output_language": _language(cfg),
            "plan": plan_lines,
            "coverage": coverage_lines(data_items, messages),
            "persona": json.dumps(prompt_view(persona), ensure_ascii=False),
            "transcript": "\n".join(transcript_lines(persona["key"], messages[-TRANSCRIPT_TAIL:]))
            or "(none yet; this is the opening turn)",
            "turn": str(int(state["interview_turn"]) + 1),
            "limit_reached": "yes" if limit_reached else "",
            "directive": _instruction(
                _decisions_of(state, "checkpoint_personas"),
                _directive_for(state, config, "checkpoint_analysis"),
            ),
        },
    )
    return turn


def data_items_of(state: REState, sink: ArtifactSink) -> list[str]:
    """The items of data that the plan of the project asks the interviews to bring back."""
    plan_record = sink.read_artifact(state["project_id"], "elicitation_plan")
    return plan_data_items(
        cast("dict[str, Any]", plan_record["content"]) if plan_record is not None else None
    )


def _close_interview(
    sink: ArtifactSink,
    transcript: dict[str, Any],
    stop_reason: str,
    turn: InterviewerTurnOutput,
    coverage: list[dict[str, Any]],
) -> ArtifactRef:
    """End the interview of a persona: the transcript is completed, and the sentence that the
    interviewer wrote about what the persona said becomes its summary. What the interviewer
    tells the user about the interview is the report, a message of the chat."""
    closed = sink.update_artifact_content(
        transcript["artifact_id"],
        dict(transcript["content"])
        | {
            "status": "completed",
            "stop_reason": stop_reason,
            "data_coverage": coverage,
            "top_findings": list(turn.top_findings),
            "follow_ups": list(turn.follow_ups),
        },
    )
    if turn.summary:
        sink.set_artifact_summary(transcript["artifact_id"], turn.summary)
    else:
        logger.warning("interview closed without a summary", artifact=transcript["artifact_id"])
    if turn.report:
        sink.add_report(turn.report)
    return closed


def _merge_transcripts(state: REState, transcript: dict[str, Any]) -> list[dict[str, Any]]:
    """The transcript refs of the state, with `transcript` added or refreshed."""
    kept = [
        dict(existing)
        for existing in state.get("interview_transcripts", [])
        if existing["artifact_id"] != transcript["artifact_id"]
    ]
    kept.append(transcript)
    return kept


def _merged(state: REState, updates: Mapping[str, Any]) -> REState:
    """The state with a partial update applied (LangGraph merges these the same way)."""
    return {**state, **updates}  # type: ignore[typeddict-item]


# ---------------------------------------------------------------------------
# The interview loop


@safe_node
def interviewer_node(
    state: REState,
    config: RunnableConfig | None = None,
) -> dict[str, Any]:
    cfg = _run_config(state)
    sink = _sink(config or {})
    runnable_config = config or {}
    # Cursor changes survive this invocation: they all go into one update dict.
    cursor: dict[str, Any] = {}
    if orchestrator.interviews_complete(state):
        cursor.update(orchestrator.open_cycle_update())
        state = _merged(state, cursor)

    while True:
        if orchestrator.exceeded_max_turns(state, turns_per_persona=cfg.parameters.max_turns):
            persona = orchestrator.active_persona(state, sink)
            transcript, messages = _transcript_of(state, sink, persona)
            last = _ask_interviewer(state, runnable_config, persona, messages, limit_reached=True)
            _record_what_the_last_answer_gave(sink, messages, last)
            closed = _close_interview(
                sink,
                transcript,
                "max_turns",
                last,
                _coverage_of(data_items_of(state, sink), messages, last.covered_by_last_answer),
            )
            if int(state["active_persona_index"]) + 1 >= len(state["personas"]):
                return {
                    **cursor,
                    "interviewer_stop": True,
                    "interview_transcripts": _merge_transcripts(state, dict(closed)),
                    "current_stage": "interviewing",
                }
            cursor.update(orchestrator.advance_update(state))
            state = _merged(state, cursor)
            continue

        persona = orchestrator.active_persona(state, sink)
        transcript, messages = _transcript_of(state, sink, persona)
        turn_no = int(state["interview_turn"]) + 1
        turn = _ask_interviewer(state, runnable_config, persona, messages, limit_reached=False)

        # Gate point 1/3 — interview_turn_policy: the bounded decision layer
        # (Jev/mock via DECISION_PROVIDER, off by default) may stop an
        # interview earlier than the interviewer's own `stop`, never later.
        done_spec = DecisionSpec(
            name="persona_complete",
            kind="noul",
            criteria=(
                "this persona's answers substantially cover the elicitation-plan "
                "topics and information gaps they can speak to; remaining gaps "
                "belong to other personas or later rounds"
            ),
            default=turn.stop,
        )
        decision_result = run_decision(
            "interview_turn_policy",
            {
                "persona": {
                    "key": persona["key"],
                    "name": persona["content"].get("name"),
                    "stakeholder_type": persona["content"].get("stakeholder_type"),
                },
                "transcript": [
                    {
                        "role": _role_of(transcript, entry),
                        "content": entry["content"]["content"],
                    }
                    for entry in messages[-TRANSCRIPT_TAIL:]
                ],
                "plan_topics": _plan_topics(sink, state),
                "turn": turn_no,
                "max_turns": cfg.parameters.max_turns,
                "llm_stop": turn.stop,
                "llm_question": turn.question,
            },
            [done_spec],
        )
        stop = bool(turn.stop)
        if decision_result is not None:
            applied = apply_confidence_policy(
                decision_result, done_spec, turn.stop, policy_from_environment()
            )
            verdict = decision_result.value("persona_complete")
            if verdict is not None and applied.action in {"auto", "applied_unrated"}:
                stop = stop or bool(verdict)
            _log_decision(
                "interviewer",
                "interview_turn_policy",
                decision_result,
                [applied],
                f"persona {persona['key']} llm_stop={turn.stop} final_stop={stop}",
            )

        _record_what_the_last_answer_gave(sink, messages, turn)
        if stop:
            closed = _close_interview(
                sink,
                transcript,
                "interviewer_stopped",
                turn,
                _coverage_of(data_items_of(state, sink), messages, turn.covered_by_last_answer),
            )
            if int(state["active_persona_index"]) + 1 >= len(state["personas"]):
                return {
                    **cursor,
                    "interviewer_stop": True,
                    "interview_transcripts": _merge_transcripts(state, dict(closed)),
                    "current_stage": "interviewing",
                }
            cursor.update(orchestrator.advance_update(state))
            state = _merged(state, cursor)
            continue

        sink.add_item(
            transcript["artifact_id"],
            "interview_message",
            {
                "turn": turn_no,
                "speaker": INTERVIEWER_KEY,
                "content": turn.question,
                "iteration": int(state["iteration_count"]),
                "topic": turn.topic,
                "message_kind": "opening" if not messages else (turn.question_kind or "follow_up"),
                "follows_up_on": turn.follows_up_on,
                "covers": [],
            },
        )
        return {
            **cursor,
            "interview_transcripts": _merge_transcripts(state, transcript),
            "current_stage": "interviewing",
        }


def plan_data_items(plan: Mapping[str, Any] | None) -> list[str]:
    """Every item of the data that the plan asks the interviews to bring back, once, in the order of
    the plan."""
    items: list[str] = []
    for entry in [] if plan is None else plan.get("data_to_collect", []):
        items.extend(str(item) for item in entry["needed"] if str(item) not in items)
    return items


def _covers_of(message: ItemRecord) -> list[str]:
    """The data of the plan that the judged answer gave; empty for a question."""
    return [str(item) for item in cast("list[object]", message["content"].get("covers", []))]


def coverage_lines(data_items: Sequence[str], messages: Sequence[ItemRecord]) -> str:
    """What the interview has brought back so far, one line for each item of data of the plan: the
    ones that an answer gave are ticked."""
    if not data_items:
        return "(the plan lists no data to collect)"
    covered = {item for message in messages for item in _covers_of(message)}
    return "\n".join(f"- [{'x' if item in covered else ' '}] {item}" for item in data_items)


def _coverage_of(
    data_items: Sequence[str], messages: Sequence[ItemRecord], last: Sequence[str]
) -> list[dict[str, Any]]:
    """For each item of data of the plan, whether any answer of the interview gave it."""
    covered = {item for message in messages for item in _covers_of(message)}
    covered.update(last)
    return [{"data": item, "covered": item in covered} for item in data_items]


def _record_what_the_last_answer_gave(
    sink: ArtifactSink, messages: Sequence[ItemRecord], turn: InterviewerTurnOutput
) -> None:
    """The interviewer judged what the last answer of the persona told: it is written on that
    message, which the persona never reads."""
    if not messages or messages[-1]["content"]["speaker"] == INTERVIEWER_KEY:
        return
    last = messages[-1]
    sink.update_item_content(
        str(last["item_id"]), {**last["content"], "covers": list(turn.covered_by_last_answer)}
    )


def plan_lines_of(plan: Mapping[str, Any]) -> str:
    """The plan as the interviewer reads it, one line each: the questions to open with, the topics
    with the data to bring back for each, and when to stop."""
    lines = [f"opening question: {question}" for question in plan.get("opening_questions", [])]
    needed = {
        str(entry["topic"]): [str(item) for item in entry["needed"]]
        for entry in plan.get("data_to_collect", [])
    }
    for topic in plan.get("topics", []):
        lines.append(f"topic: {topic}")
        lines.extend(f"  data to collect: {item}" for item in needed.get(str(topic), []))
    lines.extend(f"stop when: {condition}" for condition in plan.get("stopping_conditions", []))
    return "\n".join(lines)


def persona_aspect_list(plan: Mapping[str, Any] | None) -> list[dict[str, str]]:
    """The aspects every persona is scored on: the ones the system defines (the first tier), then
    the ones that the plan proposes for the project (the second tier), without a repeated key."""
    aspects = [{**entry, "tier": "system"} for entry in definition_persona_aspects()]
    taken = {entry["key"] for entry in aspects}
    for entry in [] if plan is None else plan.get("persona_aspects", []):
        if str(entry["key"]) not in taken:
            taken.add(str(entry["key"]))
            aspects.append({**{k: str(v) for k, v in entry.items()}, "tier": "plan"})
    return aspects


def aspect_lines(aspects: Sequence[Mapping[str, str]]) -> str:
    """The aspects as the persona generator reads them, one line each."""
    return "\n".join(
        f"- {entry['key']} ({entry['tier']}): {entry['title']}. {entry['description']} "
        f"1 means: {entry['low']}. 5 means: {entry['high']}."
        for entry in aspects
    )


PERSONA_ANSWER_LIMIT = 600


def _clip_answer(text: str, limit: int = PERSONA_ANSWER_LIMIT) -> str:
    """A persona answer that is far longer than a person would say is cut at the end of the last
    sentence that fits; a text of one long sentence is cut at a word."""
    text = text.strip()
    if len(text) <= limit:
        return text
    head = text[:limit]
    ends = [head.rfind(mark) for mark in (". ", "? ", "! ")]
    end = max(ends)
    if end > limit // 2:
        return head[: end + 1]
    return head[: head.rfind(" ")].rstrip(",;:") + "..."


PERSONA_KNOWLEDGE_LINES = 12
PERSONA_KNOWLEDGE_CHARS = 4000


def _persona_knowledge(state: REState, sink: ArtifactSink, persona: ItemRecord) -> str:
    """What the persona knows from research, besides its own profile: what the stakeholder group it
    is built from said in the research documents, one line for each observation. The observations
    the persona is grounded in come first. Without mined observations the persona has only its
    profile."""
    records = [sink.read_item(reference["item_id"]) for reference in state.get("observations", [])]
    if not records:
        return "(none)"
    grounded = set(cast("list[str]", persona["content"].get("grounded_in", [])))
    groups = {
        str(record["content"]["stakeholder_name"])
        for record in records
        if record["key"] in grounded
    }
    own = [record for record in records if record["key"] in grounded]
    others = [
        record
        for record in records
        if record["key"] not in grounded and str(record["content"]["stakeholder_name"]) in groups
    ]
    lines: list[str] = []
    for record in [*own, *others][:PERSONA_KNOWLEDGE_LINES]:
        content = record["content"]
        lines.append(
            f"- {content['stakeholder_name']}, judging by {content['dimension']}: "
            f'{content["description"]} In a research document: "{content["evidence"]}"'
        )
    return "\n".join(lines)[:PERSONA_KNOWLEDGE_CHARS] or "(none)"


@safe_node
def persona_agent_node(
    state: REState,
    config: RunnableConfig | None = None,
) -> dict[str, Any]:
    cfg = _run_config(state)
    sink = _sink(config or {})
    persona = orchestrator.active_persona(state, sink)
    transcript, messages = _transcript_of(state, sink, persona)
    turn_no = int(state["interview_turn"]) + 1

    question = next(
        (
            str(entry["content"]["content"])
            for entry in reversed(messages)
            if entry["content"]["speaker"] == INTERVIEWER_KEY
        ),
        None,
    )
    if question is None:
        msg = f"no interviewer question to answer for persona {persona['key']}"
        raise ValueError(msg)

    answer: PersonaAnswerOutput = _invoke(
        "persona_agent",
        config or {},
        PersonaAnswerOutput,
        {
            "output_language": _language(cfg),
            "persona": json.dumps(prompt_view(persona), ensure_ascii=False),
            "knowledge": _persona_knowledge(state, sink, persona),
            "question": question,
            "conversation": "\n".join(transcript_lines(persona["key"], messages[-TRANSCRIPT_TAIL:]))
            or "(none)",
        },
    )

    sink.add_item(
        transcript["artifact_id"],
        "interview_message",
        {
            "turn": turn_no,
            "speaker": str(persona["key"]),
            "content": _clip_answer(answer.answer),
            "iteration": int(state["iteration_count"]),
            "topic": messages[-1]["content"].get("topic"),
            "message_kind": "answer",
            "follows_up_on": None,
            "covers": [],
        },
    )
    closed = sink.update_artifact_content(
        transcript["artifact_id"],
        dict(transcript["content"]) | {"turn_count": turn_no},
    )
    return {
        "interview_transcripts": _merge_transcripts(state, dict(closed)),
        "interview_turn": turn_no,
    }


# ---------------------------------------------------------------------------
# The analyst and the rework control node


def _normalize_raw_topics(analysis: AnalystOutput, plan_topic_values: list[str]) -> None:
    """The plan's topics are the lawful vocabulary of a raw requirement's
    topic; the model's phrasing resolves to the plan term, and a topic
    matching none becomes None — the field is optional, an unresolvable
    phrasing loses the linkage rather than failing the whole run."""
    for draft in analysis.raw_requirements:
        if draft.topic and plan_topic_values:
            matched = match_plan_value(draft.topic, plan_topic_values)
            if matched is not None:
                draft.topic = matched
            else:
                logger.warning(
                    "analyst topic dropped",
                    ref=str(draft.ref),
                    dropped=str(draft.topic),
                    note="no plan topic matched; topic is optional (str | None)",
                )
                draft.topic = None


# Valid target kinds per link field, from definition.v3.json link_types.
_PERSONA = frozenset({"persona"})
_MSG = frozenset({"interview_message"})
_REQ_LEVEL = frozenset({"raw_requirement", "analyzed_requirement", "spec_requirement"})
_AR_OR_RAW = frozenset({"raw_requirement", "latent_need"})


def _normalize_analyzed_quality(analysis: AnalystOutput) -> None:
    """quality_category is an optional enum: a model value outside the
    value list becomes None (the field is str | None in the schema)."""
    allowed = frozenset(
        str(entry["key"]) for entry in get_value_lists().get("quality_category", [])
    )
    if not allowed:
        return
    for analyzed_draft in analysis.analyzed_requirements:
        if analyzed_draft.quality_category and str(analyzed_draft.quality_category) not in allowed:
            logger.warning(
                "analyst quality_category normalized",
                ref=str(analyzed_draft.ref),
                dropped=str(analyzed_draft.quality_category),
                note="value outside the quality_category value list",
            )
            analyzed_draft.quality_category = None


def _normalize_analyst_links(analysis: AnalystOutput, known: Known) -> None:
    """Drop link refs whose target kind the trace law doesn't allow for
    that field — a model citing a latent_need in concerns is over-citing.
    AR derived_from is normalized SEPARATELY after RAW items are in `known`."""
    for latent in analysis.latent_needs:
        latent.involves = _keep_valid(latent.involves, known, _PERSONA)
    for ar in analysis.analyzed_requirements:
        ar.involves = _keep_valid(ar.involves, known, _PERSONA)
    for assumption in analysis.assumptions:
        assumption.concerns = _keep_valid(assumption.concerns, known, _REQ_LEVEL)
    for ambiguity in analysis.ambiguity_issues:
        ambiguity.concerns = _keep_valid(ambiguity.concerns, known, _REQ_LEVEL)
    for conflict in analysis.conflicts:
        conflict.concerns = _keep_valid(conflict.concerns, known, _REQ_LEVEL)
        conflict.involves = _keep_valid(conflict.involves, known, _PERSONA)


def _keep_valid[RefT: str | ItemLink](
    references: list[RefT],
    known: Known,
    valid_kinds: frozenset[str],
) -> list[RefT]:
    kept = [ref for ref in references if known.get(_key_of(ref), {}).get("kind") in valid_kinds]
    dropped = [_key_of(ref) for ref in references if ref not in kept]
    if dropped:
        logger.warning(
            "analyst link refs filtered",
            dropped=dropped,
            valid_kinds=sorted(valid_kinds),
        )
    return kept


@safe_node
def analyst_node(
    state: REState,
    config: RunnableConfig | None = None,
) -> dict[str, Any]:
    cfg = _run_config(state)
    sink = _sink(config or {})
    runnable_config = config or {}
    known = _known_of(sink, state)

    personas = [sink.read_item(entry["item_id"]) for entry in state["personas"]]
    transcript_rendered = (
        "\n".join(
            line
            for persona in personas
            for line in transcript_lines(
                persona["key"],
                sink.read_items(_transcript_of(state, sink, persona)[0]["artifact_id"]),
            )
        )
        or "(no interviews yet)"
    )
    plan_record = sink.read_artifact(state["project_id"], "elicitation_plan")
    topics = ""
    plan_topic_values: list[str] = []
    if plan_record is not None:
        plan_topics = cast("dict[str, list[str]]", plan_record["content"])["topics"]
        plan_topic_values = list(plan_topics)
        topics = "\n".join(plan_topics)

    analysis_record = sink.read_artifact(state["project_id"], "requirements_analysis")
    current_items = (
        sink.read_items(analysis_record["artifact_id"]) if analysis_record is not None else []
    )
    current_keys = {entry["key"]: dict(entry) for entry in current_items}
    current_lines = prompt_views(current_items) if current_items else "(empty)"

    analysis: AnalystOutput = _invoke(
        "analyst",
        runnable_config,
        AnalystOutput,
        {
            "output_language": _language(cfg),
            "topics": topics,
            "personas": prompt_views(personas),
            "transcripts": str(transcript_rendered),
            "current_analysis": current_lines,
            "directive": _directive_for(state, runnable_config, "checkpoint_analysis"),
        },
    )

    if analysis_record is not None:
        analysis_ref = sink.update_artifact_content(
            analysis_record["artifact_id"],
            {
                "key_findings": analysis.key_findings,
                "open_questions": analysis.open_questions,
            },
        )
        artifact_id: str = str(analysis_ref["artifact_id"])
        _set_summary(sink, artifact_id, analysis.summary)
    else:
        created = sink.create_artifact(
            state["project_id"],
            "requirements_analysis",
            title="Requirements analysis",
            content={
                "key_findings": analysis.key_findings,
                "open_questions": analysis.open_questions,
            },
            summary=analysis.summary,
        )
        artifact_id = str(created["artifact_id"])

    refs: dict[str, list[dict[str, Any]]] = {
        "raw_requirements": [],
        "analyzed_requirements": [],
        "latent_needs": [],
        "assumptions": [],
        "ambiguities": [],
        "conflicts": [],
    }

    def write(
        kind: str,
        draft: Any,
        content: dict[str, Any],
        slot: str,
    ) -> dict[str, Any]:
        item = dict(sink.add_item(artifact_id, kind, content, ref=draft.ref))
        known[str(draft.ref)] = item
        known[str(item["key"])] = item
        refs[slot].append(item)
        return item

    _normalize_raw_topics(analysis, plan_topic_values)
    _normalize_analyst_links(analysis, known)
    _normalize_analyzed_quality(analysis)

    for draft in analysis.raw_requirements:
        item = write(
            "raw_requirement",
            draft,
            draft.model_dump(
                mode="json", exclude={"ref", "supersedes", "stated_by", "evidenced_by"}
            ),
            "raw_requirements",
        )
        _link_each(sink, item["item_id"], "stated_by", known, [draft.stated_by])
        _evidence_links(sink, item["item_id"], known, draft.evidenced_by)
        _supersede_each(sink, current_keys, item["item_id"], draft.supersedes)

    for latent in analysis.latent_needs:
        item = write(
            "latent_need",
            latent,
            latent.model_dump(
                mode="json", exclude={"ref", "supersedes", "evidenced_by", "involves"}
            ),
            "latent_needs",
        )
        _evidence_links(sink, item["item_id"], known, latent.evidenced_by)
        _link_each(sink, item["item_id"], "involves", known, latent.involves)
        _supersede_each(sink, current_keys, item["item_id"], latent.supersedes)

    # AR derived_from is normalized here — after RAW items are in `known`:
    # the model may cite a latent_need it promoted; the trace law only
    # allows derived_from between analyzed_requirement and raw_requirement
    # or latent_need, and a ref of any other kind is dropped (logged).
    for analyzed_draft in analysis.analyzed_requirements:
        analyzed_draft.derived_from = _keep_valid(analyzed_draft.derived_from, known, _AR_OR_RAW)

    for analyzed_draft in analysis.analyzed_requirements:
        item = write(
            "analyzed_requirement",
            analyzed_draft,
            analyzed_draft.model_dump(
                mode="json", exclude={"ref", "supersedes", "derived_from", "involves"}
            ),
            "analyzed_requirements",
        )
        _link_each(sink, item["item_id"], "derived_from", known, analyzed_draft.derived_from)
        _link_each(sink, item["item_id"], "involves", known, analyzed_draft.involves)
        _supersede_each(sink, current_keys, item["item_id"], analyzed_draft.supersedes)

    for assumption in analysis.assumptions:
        item = write(
            "assumption",
            assumption,
            assumption.model_dump(mode="json", exclude={"ref", "supersedes", "concerns"}),
            "assumptions",
        )
        _link_each(sink, item["item_id"], "concerns", known, assumption.concerns)
        _supersede_each(sink, current_keys, item["item_id"], assumption.supersedes)

    for ambiguity in analysis.ambiguity_issues:
        content = ambiguity.model_dump(
            mode="json", exclude={"ref", "supersedes", "concerns", "resolved_by"}
        )
        item = write("ambiguity_issue", ambiguity, content, "ambiguities")
        _link_each(sink, item["item_id"], "concerns", known, ambiguity.concerns)
        if ambiguity.resolved_by is not None:
            _link_each(sink, item["item_id"], "resolved_by", known, [ambiguity.resolved_by])
        _supersede_each(sink, current_keys, item["item_id"], ambiguity.supersedes)

    for conflict in analysis.conflicts:
        content = conflict.model_dump(
            mode="json", exclude={"ref", "supersedes", "concerns", "involves", "resolved_by"}
        )
        item = write("conflict", conflict, content, "conflicts")
        _link_each(sink, item["item_id"], "concerns", known, conflict.concerns)
        _link_each(sink, item["item_id"], "involves", known, conflict.involves)
        if conflict.resolved_by is not None:
            _link_each(sink, item["item_id"], "resolved_by", known, [conflict.resolved_by])
        _supersede_each(sink, current_keys, item["item_id"], conflict.supersedes)

    unresolved = [
        issue
        for issue in analysis.conflicts
        if issue.status == "open" and not issue.proposed_resolutions
    ]
    _tell_user(sink, analysis)
    return {
        **refs,
        "response_analyst_status": "needs_interviews" if unresolved else "ok",
        "current_stage": "analysis",
        **_review_for(state, "checkpoint_analysis", analysis),
    }


def _rework_items(
    sink: ArtifactSink, state: REState, open_issues: list[dict[str, Any]]
) -> list[DirectiveItem]:
    """The items a rework directive refers to: the open issues that caused it (`about`) and the
    personas that those issues involve, to interview again (`addressed_to`)."""
    items: list[DirectiveItem] = [
        {"item_id": str(issue["item_id"]), "role": "about"} for issue in open_issues
    ]
    catalog = sink.read_artifact(state["project_id"], "persona_catalog")
    if catalog is None:
        return items
    personas = {
        entry["key"]: str(entry["item_id"]) for entry in sink.read_items(catalog["artifact_id"])
    }
    involved = dict.fromkeys(
        key
        for issue in open_issues
        for link in issue["links"]
        if link["link_type"] == "involves"
        for key in link["targets"]
    )
    items += [
        {"item_id": personas[key], "role": "addressed_to"} for key in involved if key in personas
    ]
    return items


@safe_node
def rework_elicitation_node(
    state: REState,
    config: RunnableConfig | None = None,
) -> dict[str, Any]:
    """The control node behind `analyst --not OK-->` (mapping §2.1).

    Gathers the open issues of the requirements analysis and records a rework
    directive for the interviewer; every later round of the interview appends
    to the same artifacts (the state gains the directive id only).
    """
    sink = _sink(config or {})
    analysis = sink.read_artifact(state["project_id"], "requirements_analysis")
    open_issues: list[dict[str, Any]] = []
    if analysis is not None:
        open_issues = [
            dict(entry)
            for entry in sink.read_items(analysis["artifact_id"])
            if str(entry["content"].get("status")) == "open"
        ]

    if open_issues:
        listing = "; ".join(
            f"{entry['key']} ({entry['content'].get('description', '')})" for entry in open_issues
        )
        instruction = f"Interview the stakeholders again to settle the open issues: {listing}."
    else:
        instruction = "Interview the stakeholders again to gather more evidence."
    directive_id = _directive_sink(config or {}).create_directive(
        _run_id(config or {}),
        "rework",
        target_node="interviewer",
        iteration=int(state["iteration_count"]),
        instruction=instruction,
        items=_rework_items(sink, state, open_issues),
    )
    return {"rework_directives": [directive_id], "current_stage": "rework_planning"}


def _normalize_engineer_quality(draft: EngineerOutput) -> None:
    """quality_category is an optional enum (value list): a model value outside
    the list becomes None — same normalization the analyst already applies."""
    allowed = frozenset(
        str(entry["key"]) for entry in get_value_lists().get("quality_category", [])
    )
    if not allowed:
        return
    for spec_draft in draft.requirements:
        if spec_draft.quality_category and str(spec_draft.quality_category) not in allowed:
            logger.warning(
                "engineer quality_category normalized",
                ref=str(spec_draft.ref),
                dropped=str(spec_draft.quality_category),
            )
            spec_draft.quality_category = None


def _normalize_engineer_derived_from(draft: EngineerOutput, known: Known) -> None:
    """Keep derived_from lawful: only analyzed_requirement refs.

    The trace law allows derived_from only between spec_requirement and
    analyzed_requirement. The engineer sometimes cites a latent need it
    promoted into a requirement — a ref of another kind is dropped (logged)
    as long as at least one AR ref remains; a requirement with no AR ref
    at all still fails honestly.
    """
    for spec_draft in draft.requirements:
        lawful = [
            ref
            for ref in spec_draft.derived_from
            if known.get(_key_of(ref), {}).get("kind") == "analyzed_requirement"
        ]
        dropped = [_key_of(ref) for ref in spec_draft.derived_from if ref not in lawful]
        if dropped:
            logger.warning(
                "engineer derived_from normalized",
                requirement=str(spec_draft.ref),
                dropped=dropped,
                kept=lawful,
            )
            spec_draft.derived_from = lawful


@safe_node
def requirement_engineer_node(
    state: REState,
    config: RunnableConfig | None = None,
) -> dict[str, Any]:
    cfg = _run_config(state)
    sink = _sink(config or {})
    runnable_config = config or {}
    known = _known_of(sink, state)

    analysis_items: list[ItemRecord] = []
    analysis_record = sink.read_artifact(state["project_id"], "requirements_analysis")
    if analysis_record is not None:
        analysis_items = sink.read_items(analysis_record["artifact_id"])
    for entry in analysis_items:
        known[entry["key"]] = {
            "item_id": entry["item_id"],
            "kind": entry["kind"],
            "key": entry["key"],
            "version": entry["version"],
        }

    spec_record = sink.read_artifact(state["project_id"], "requirement_specification")
    current_items = sink.read_items(spec_record["artifact_id"]) if spec_record else []
    current_keys = {entry["key"]: dict(entry) for entry in current_items}
    current_lines = prompt_views(current_items) if current_items else "(empty)"

    # Only verified analysis flows back into the law the way analyst.v1 demands.
    verified_lines = prompt_views(analysis_items) if analysis_items else "(none)"

    draft: EngineerOutput = _invoke(
        "requirement_engineer",
        runnable_config,
        EngineerOutput,
        {
            "output_language": _language(cfg),
            "analyzed_requirements": verified_lines,
            "latent_needs": prompt_views(
                [
                    entry
                    for entry in analysis_items
                    if entry["kind"] == "latent_need"
                    and entry["content"].get("disposition") == "open"
                ]
            )
            or "(none)",
            "assumptions": prompt_views(
                [entry for entry in analysis_items if entry["kind"] == "assumption"]
            )
            or "(none)",
            "conflicts": prompt_views(
                [
                    entry
                    for entry in analysis_items
                    if entry["kind"] == "conflict" and entry["content"].get("status") == "open"
                ]
            )
            or "(none)",
            "current_specification": current_lines,
            "directive": _instruction(
                _decisions_of(state, "checkpoint_analysis"),
                _directive_for(state, runnable_config, "checkpoint_spec"),
            ),
        },
    )

    _normalize_engineer_quality(draft)

    # Gate point 2/3 — spec_type_priority_review: the bounded decision layer
    # (Jev/mock via DECISION_PROVIDER, off by default) reviews every
    # requirement's type and priority; high-confidence answers replace the
    # engineer's, low-confidence ones keep them, very low ones flag review.
    decision_specs: list[DecisionSpec] = []
    for index, spec_draft in enumerate(draft.requirements):
        decision_specs.append(
            DecisionSpec(
                name=f"req_{index + 1:03d}_type",
                kind="choice",
                options=[
                    {"value": "functional", "what": "a behaviour the system does"},
                    {"value": "non_functional", "what": "a quality the system must hold"},
                    {"value": "constraint", "what": "a limit the design must respect"},
                ],
                default=spec_draft.type,
            )
        )
        decision_specs.append(
            DecisionSpec(
                name=f"req_{index + 1:03d}_priority",
                kind="choice",
                options=[
                    {"value": "must", "what": "non-negotiable for launch"},
                    {"value": "should", "what": "important but deferrable"},
                    {"value": "could", "what": "nice to have"},
                    {"value": "wont", "what": "explicitly out of scope this release"},
                ],
                default=spec_draft.priority,
            )
        )
    decision_applied: dict[str, AppliedDecision] = {}
    decision_result = (
        run_decision(
            "spec_type_priority_review",
            {
                "requirements": [
                    {
                        "ref": spec_draft.ref,
                        "title": spec_draft.title,
                        "statement": spec_draft.statement,
                        "llm_type": spec_draft.type,
                        "llm_priority": spec_draft.priority,
                        "acceptance_criteria": spec_draft.acceptance_criteria,
                    }
                    for spec_draft in draft.requirements
                ],
                "scope": draft.scope,
                "out_of_scope": draft.out_of_scope,
            },
            decision_specs,
        )
        if decision_specs
        else None
    )
    if decision_result is not None:
        policy = policy_from_environment()
        for spec in decision_specs:
            decision_applied[spec.name] = apply_confidence_policy(
                decision_result, spec, spec.default, policy
            )
        for index, spec_draft in enumerate(draft.requirements):
            type_choice = decision_applied.get(f"req_{index + 1:03d}_type")
            if type_choice is not None and type_choice.action in {"auto", "applied_unrated"}:
                spec_draft.type = type_choice.chosen
            priority_choice = decision_applied.get(f"req_{index + 1:03d}_priority")
            if priority_choice is not None and priority_choice.action in {
                "auto",
                "applied_unrated",
            }:
                spec_draft.priority = priority_choice.chosen
        _log_decision(
            "requirement_engineer",
            "spec_type_priority_review",
            decision_result,
            list(decision_applied.values()),
            f"{decision_result.provider} reviewed type/priority of "
            f"{len(draft.requirements)} requirement(s)",
        )

    _normalize_engineer_derived_from(draft, known)

    if spec_record is not None:
        ref = sink.update_artifact_content(
            spec_record["artifact_id"],
            {
                "purpose": draft.purpose,
                "scope": draft.scope,
                "out_of_scope": draft.out_of_scope,
                "definitions": [item.model_dump(mode="json") for item in draft.definitions],
            },
        )
        artifact_id: str = str(ref["artifact_id"])
        _set_summary(sink, artifact_id, draft.summary)
    else:
        created = sink.create_artifact(
            state["project_id"],
            "requirement_specification",
            title="Requirement specification",
            content={
                "purpose": draft.purpose,
                "scope": draft.scope,
                "out_of_scope": draft.out_of_scope,
                "definitions": [item.model_dump(mode="json") for item in draft.definitions],
            },
            summary=draft.summary,
        )
        artifact_id = str(created["artifact_id"])

    written: list[dict[str, Any]] = []
    placeholder: dict[str, dict[str, Any]] = {}
    for spec_draft in draft.requirements:
        content = spec_draft.model_dump(
            mode="json",
            exclude={"ref", "supersedes", "derived_from", "depends_on"},
        )
        item_ref = sink.add_item(artifact_id, "spec_requirement", content, ref=spec_draft.ref)
        item = dict(item_ref)
        known[str(spec_draft.ref)] = item
        known[str(item["key"])] = item
        placeholder[spec_draft.ref] = item
        written.append(item)
        _link_each(sink, str(item["item_id"]), "derived_from", known, spec_draft.derived_from)
        _supersede_each(sink, current_keys, str(item["item_id"]), spec_draft.supersedes)
    # depends_on links need every ref → key mapping: attach them after all writes.
    for spec_draft, item in zip(draft.requirements, written, strict=True):
        _link_each(sink, str(item["item_id"]), "depends_on", placeholder, spec_draft.depends_on)

    _tell_user(sink, draft)
    return {
        "requirement_specification": written,
        "current_stage": "specification",
        **_review_for(state, "checkpoint_spec", draft),
    }


@safe_node
def backlog_manager_node(
    state: REState,
    config: RunnableConfig | None = None,
) -> dict[str, Any]:
    cfg = _run_config(state)
    sink = _sink(config or {})
    runnable_config = config or {}
    spec_record = sink.read_artifact(state["project_id"], "requirement_specification")
    spec_items: list[ItemRecord] = []
    if spec_record is not None:
        spec_items = sink.read_items(spec_record["artifact_id"])
    spec_lines = prompt_views(spec_items) if spec_items else "(none)"

    backlog_record = sink.read_artifact(state["project_id"], "product_backlog")
    current_items = sink.read_items(backlog_record["artifact_id"]) if backlog_record else []
    current_keys = {entry["key"]: dict(entry) for entry in current_items}
    current_lines = prompt_views(current_items) if current_items else "(empty)"

    draft: BacklogOutput = _invoke(
        "backlog_manager",
        runnable_config,
        BacklogOutput,
        {
            "output_language": _language(cfg),
            "specification": spec_lines,
            "current_backlog": current_lines,
            "directive": _directive_for(state, runnable_config, "checkpoint_spec"),
        },
    )

    known: Known = {
        entry["key"]: {
            "item_id": entry["item_id"],
            "kind": entry["kind"],
            "key": entry["key"],
            "version": entry["version"],
        }
        for entry in spec_items
    }

    if backlog_record is not None:
        ref = sink.update_artifact_content(
            backlog_record["artifact_id"],
            dict(backlog_record["content"])
            | {
                "product_goal": draft.product_goal,
                "prioritization_notes": draft.prioritization_notes,
                "definition_of_done": list(draft.definition_of_done),
            },
        )
        artifact_id: str = str(ref["artifact_id"])
        _set_summary(sink, artifact_id, draft.summary)
    else:
        created = sink.create_artifact(
            state["project_id"],
            "product_backlog",
            title="Product backlog",
            content={
                "product_goal": draft.product_goal,
                "prioritization_notes": draft.prioritization_notes,
                "definition_of_done": list(draft.definition_of_done),
            },
            summary=draft.summary,
        )
        artifact_id = str(created["artifact_id"])

    written: list[dict[str, Any]] = []
    placeholder: dict[str, dict[str, Any]] = {}
    for draft_item in draft.items:
        content = draft_item.model_dump(
            mode="json",
            exclude={"ref", "supersedes", "derived_from", "depends_on"},
        )
        content["delivery_status"] = "todo"
        item_ref = sink.add_item(artifact_id, "backlog_item", content, ref=draft_item.ref)
        item = dict(item_ref)
        known[str(draft_item.ref)] = item
        known[str(item["key"])] = item
        placeholder[draft_item.ref] = item
        written.append(item)
        _link_each(sink, str(item["item_id"]), "derived_from", known, draft_item.derived_from)
        _supersede_each(sink, current_keys, str(item["item_id"]), draft_item.supersedes)
    for draft_item, item in zip(draft.items, written, strict=True):
        _link_each(sink, str(item["item_id"]), "depends_on", placeholder, draft_item.depends_on)

    _tell_user(sink, draft)
    return {"product_backlog": written, "current_stage": "backlog"}


def _normalized_check(check: Any) -> dict[str, str]:
    """A check of the validator as the report keeps it: a result that is not in the value list
    reads as the closest one, and `partly` when none is close."""
    allowed = sorted(str(entry["key"]) for entry in get_value_lists().get("check_result", []))
    result = str(check.result)
    if result not in allowed:
        result = match_plan_value(result, allowed) or "partly"
    return {"check": str(check.check), "result": result, "note": str(check.note)}


@safe_node
def validator_node(
    state: REState,
    config: RunnableConfig | None = None,
) -> dict[str, Any]:
    cfg = _run_config(state)
    sink = _sink(config or {})
    runnable_config = config or {}

    spec_record = sink.read_artifact(state["project_id"], "requirement_specification")
    backlog_record = sink.read_artifact(state["project_id"], "product_backlog")
    spec_items = sink.read_items(spec_record["artifact_id"]) if spec_record else []
    backlog_items = sink.read_items(backlog_record["artifact_id"]) if backlog_record else []
    analysis_items: list[ItemRecord] = []
    analysis_record = sink.read_artifact(state["project_id"], "requirements_analysis")
    if analysis_record is not None:
        analysis_items = sink.read_items(analysis_record["artifact_id"])
    open_issues = [
        entry
        for entry in analysis_items
        if entry["kind"] in {"ambiguity_issue", "conflict"}
        and str(entry["content"].get("status")) == "open"
    ]

    iteration = int(state["iteration_count"]) + 1
    draft: ValidatorOutput = _invoke(
        "validator",
        runnable_config,
        ValidatorOutput,
        {
            "output_language": _language(cfg),
            "specification": prompt_views(spec_items) if spec_items else "(none)",
            "backlog": prompt_views(backlog_items) if backlog_items else "(none)",
            "open_issues": prompt_views(open_issues) if open_issues else "(empty)",
            "iteration": str(iteration),
        },
    )

    # Gate point 3/3 — validation_status_review: the bounded decision layer
    # (Jev/mock via DECISION_PROVIDER, off by default) reviews the validator's
    # verdict; a high-confidence override can pass or fail the run, a
    # low-confidence one keeps the LLM's, a very low one flags human review.
    status_spec = DecisionSpec(
        name="validation_passes",
        kind="noul",
        criteria=(
            "taken together, the artifacts satisfy all nine validation dimensions "
            "(completeness, consistency, ambiguity, correctness, feasibility, "
            "testability, traceability, stakeholder coverage, conflicts) — true passes"
        ),
        default=(draft.status == "pass"),
    )
    human_spec = DecisionSpec(
        name="needs_human_attention",
        kind="noul",
        criteria=(
            "the validation verdict is close, contested or consequential enough "
            "that a human reviewer should look at it before it is accepted"
        ),
        default=False,
    )
    decision_result = run_decision(
        "validation_status_review",
        {
            "llm_verdict": draft.status,
            "llm_issues": [
                {
                    "category": issue.category,
                    "severity": issue.severity,
                    "description": issue.description,
                }
                for issue in draft.issues
            ],
            "requirement_count": len(spec_items),
            "backlog_count": len(backlog_items),
            "iteration_count": iteration,
        },
        [status_spec, human_spec],
    )
    final_status = draft.status
    status_applied: AppliedDecision | None = None
    human_applied: AppliedDecision | None = None
    if decision_result is not None:
        policy = policy_from_environment()
        status_applied = apply_confidence_policy(decision_result, status_spec, final_status, policy)
        human_applied = apply_confidence_policy(decision_result, human_spec, False, policy)
        verdict = decision_result.value("validation_passes")
        if status_applied.action in {"auto", "applied_unrated"} and verdict is not None:
            final_status = "pass" if verdict else "fail"
        applied_items = [item for item in (status_applied, human_applied) if item is not None]
        bits = [f"llm={draft.status}", f"final={final_status}"]
        if human_applied is not None and human_applied.needs_human:
            bits.append("flagged for human attention")
        _log_decision(
            "validator",
            "validation_status_review",
            decision_result,
            applied_items,
            f"{decision_result.provider} reviewed the validation verdict ({' · '.join(bits)})",
        )

    known: Known = {
        entry["key"]: {
            "item_id": entry["item_id"],
            "kind": entry["kind"],
            "key": entry["key"],
            "version": entry["version"],
        }
        for entry in spec_items + backlog_items
    }
    # validation_category is an enum (value list): a model value outside the
    # list maps to the closest stage word — the field is required (str).
    _vc_allowed = frozenset(
        str(entry["key"]) for entry in get_value_lists().get("validation_category", [])
    )
    if _vc_allowed:
        for issue in draft.issues:
            if str(issue.category) not in _vc_allowed:
                original = str(issue.category)
                matched = match_plan_value(original, sorted(_vc_allowed))
                issue.category = matched if matched is not None else "specification"
                logger.warning(
                    "validator category normalized",
                    ref=str(issue.ref),
                    dropped=original,
                    mapped=str(issue.category),
                )
    report = sink.create_artifact(
        state["project_id"],
        "validation_report",
        title=f"Validation report, iteration {iteration}",
        content={
            "iteration": iteration,
            "status": final_status,
            "checks": [_normalized_check(check) for check in draft.checks],
        },
        summary=f"{len(draft.issues)} issue(s)",
    )
    for issue in draft.issues:
        content = issue.model_dump(mode="json", exclude={"ref", "flags"})
        content["status"] = "open"  # the schema's readOnly lifecycle field (§2.3)
        item_ref = sink.add_item(
            report["artifact_id"],
            "validation_issue",
            content,
            ref=issue.ref,
        )
        item = dict(item_ref)
        # flags cite item keys: a model word that isn't a key is dropped
        # (logged) — the model sometimes writes a topic word like "backlog"
        # instead of a specific item key such as "US-001".
        _valid_flags = [f for f in issue.flags if _key_of(f) in known]
        _dropped_flags = [_key_of(f) for f in issue.flags if f not in _valid_flags]
        if _dropped_flags:
            logger.warning(
                "validator flags normalized",
                issue_ref=str(issue.ref),
                dropped=_dropped_flags,
            )
        _link_each(sink, str(item["item_id"]), "flags", known, _valid_flags)

    updates: dict[str, Any] = {
        "validation_report": dict(report),
        "iteration_count": iteration,
    }
    if final_status == "pass":
        updates["status"] = "succeeded"
        updates["current_stage"] = "done"
    elif iteration >= cfg.parameters.max_iterations:
        # §2.1: the guard ends a still-failing run quietly, without failing it.
        updates["status"] = "succeeded"
        updates["current_stage"] = "done"
    else:
        updates["current_stage"] = "validation"
    _tell_user(sink, draft)
    return {**updates, "response_validator_status": final_status}


# ---------------------------------------------------------------------------
# The checkpoint factory (HITL per the v1 option keys: approval or feedback)


def make_checkpoint(
    node_id: str,
    artifact_kind: str,
) -> NodeFn:
    """Build one human-review checkpoint node from the definition's node.

    When the checkpoint is off (not in `run_config.review_checkpoints`, what experiment runs use)
    the default option is taken at once: the outcome is recorded as automatic and the artifacts
    under review turn approved when that option approves. When it is on, the node does not wait:
    it hands the review to the executor in `interrupt_payload` and ends the walk with the status
    `interrupted`. The executor stores the interrupt and, when the user answers, continues the
    workflow from the node that the chosen option leads to, so the state saved at this step is all
    a resume needs and no process has to stay alive while the user thinks.
    """
    spec = definition_nodes()[node_id]
    stage = str(spec.get("stage", ""))
    options = list(spec.get("options", []))

    @safe_node
    def node(
        state: REState,
        config: RunnableConfig | None = None,
    ) -> dict[str, Any]:
        sink = _sink(config or {})
        cfg = _run_config(state)
        records = [
            record
            for kind in spec.get("review_artifact_kinds", [artifact_kind])
            if (record := sink.read_artifact(state["project_id"], str(kind))) is not None
        ]
        review_artifacts = [
            ArtifactRef(
                artifact_id=record["artifact_id"],
                kind=record["kind"],
                title=record["title"],
                version=record["version"],
            )
            for record in records
        ]
        if node_id in cfg.review_checkpoints:
            asked = review.checkpoint_review(spec, state.get("review_briefs", {}).get(node_id))
            payload: dict[str, object] = {
                "node": node_id,
                "prompt": asked["prompt"],
                "options": asked["options"],
                "questions": asked["questions"],
                "allow_edits": bool(spec.get("allow_edits", False)),
                "review_artifacts": review_artifacts,
            }
            return {"status": "interrupted", "current_stage": stage, "interrupt_payload": payload}

        chosen = next(opt for opt in options if opt.get("is_default"))
        outcome = {
            "node": node_id,
            "option": str(chosen["key"]),
            "feedback": "",
            "automatic": True,
        }
        if bool(chosen.get("approves")):
            for record in records:
                sink.approve_artifact(record["artifact_id"])
        return {"checkpoint_outcomes": [outcome], "current_stage": stage}

    node.__name__ = node_id  # safe_node logs the wrapper under the node id
    return node


checkpoint_personas = make_checkpoint("checkpoint_personas", "persona_catalog")
checkpoint_analysis = make_checkpoint("checkpoint_analysis", "requirements_analysis")
checkpoint_spec = make_checkpoint("checkpoint_spec", "requirement_specification")


# The gateway in front of the models expires single completions that take too
# long (its proxy answers 504 at ~100s). Late interview turns resend the
# transcript each turn, so prompts (and their generation time) grow linearly;
# keeping only this tail bounds them: the conversational nodes answer coherently
# from the recent lines, and no late turn can outgrow the ceiling.
TRANSCRIPT_TAIL = 8


# ---------------------------------------------------------------------------
# The intent router and the state bookkeeping of later runs


@safe_node
def intent_router_node(
    state: REState,
    config: RunnableConfig | None = None,
) -> dict[str, Any]:
    cfg = _run_config(state)
    sink = _sink(config or {})
    runnable_config = config or {}
    pending = [dict(entry) for entry in _configurable(runnable_config).get("pending_messages", [])]
    if not pending:
        msg = (
            "intent_router reached with no pending message; the executor "
            "must route first runs at the planner"
        )
        raise ValueError(msg)
    messages = "\n".join(
        f"{index}. {entry['content']}" for index, entry in enumerate(pending, start=1)
    )
    spec_record = sink.read_artifact(state["project_id"], "requirement_specification")
    spec_items = sink.read_items(spec_record["artifact_id"]) if spec_record is not None else []
    backlog_record = sink.read_artifact(state["project_id"], "product_backlog")
    backlog_items = sink.read_items(backlog_record["artifact_id"]) if backlog_record else []
    listed_lines_spec = (
        "\n".join(f"{entry['key']} {entry['content'].get('statement', '')}" for entry in spec_items)
        or "(none yet)"
    )
    listed_lines_backlog = (
        "\n".join(f"{entry['key']} {entry['content'].get('title', '')}" for entry in backlog_items)
        or "(none yet)"
    )

    directive: IntentDirectiveOutput = _invoke(
        "intent_router",
        runnable_config,
        IntentDirectiveOutput,
        {
            "output_language": _language(cfg),
            "messages": messages,
            "specification": listed_lines_spec,
            "backlog": listed_lines_backlog,
        },
    )
    directive_id = _directive_sink(runnable_config).create_directive(
        _run_id(runnable_config),
        "intent",
        target_node=directive.target_node,
        iteration=int(state["iteration_count"]),
        instruction=directive.instruction,
        items=[
            {"item_id": str(entry["item_id"]), "role": "about"}
            for entry in [*spec_items, *backlog_items]
            if entry["key"] in set(directive.about)
        ],
    )
    _tell_user(_sink(runnable_config), directive)
    return {
        "rework_directives": [directive_id],
        "current_stage": "intent_routing",
        "routed_target": directive.target_node,
    }
