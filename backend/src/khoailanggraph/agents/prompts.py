"""Prompt loading and assembly (docs/architecture/prompts.md).

Every agent role and version has one Markdown file with YAML front matter,
kept beside the graph and versioned like code. The system part is fixed for
every call of a role within a run (provider prompt-cache friendly); the user
part carries the changing data. This module loads, validates and assembles
those files — no prompt text lives in Python.
"""

from __future__ import annotations

import re
from functools import lru_cache
from importlib import resources
from typing import TYPE_CHECKING, cast

from pydantic import BaseModel

if TYPE_CHECKING:
    from collections.abc import Mapping, Sequence
from yaml import safe_load

_REQUIRED_SYSTEM_H2 = ["role", "goal", "inputs", "procedure", "rules"]
_OPTIONAL_SYSTEM_H2 = ["skills", "output", "examples"]
# The sections of the System part in the order they may appear.
_SYSTEM_H2_ORDER = ["role", "goal", "skills", "inputs", "procedure", "rules", "output", "examples"]
_REQUIRED_USER_H2 = ["context", "task"]
_PLACEHOLDER_PATTERN = re.compile(r"\{\{ ([a-zA-Z][a-zA-Z0-9_]*) \}\}")
_COMMENT_PATTERN = re.compile(r"<!--.*?-->", flags=re.DOTALL)


class PromptInput(BaseModel):
    """One declared input, rendered as one `{{ name }}` placeholder."""

    name: str
    part: str
    description: str = ""


class LoadedPrompt(BaseModel):
    """The validated face of one `<role>.v<version>.md` file.

    `system` is the whole System part: the common settings of the app first when the prompt
    names a version of them (`common` in its front matter), then the sections of the role."""

    role: str
    version: int
    description: str
    output: str
    inputs: list[PromptInput]
    system: str
    user: str


def read_prompt(graph_package: str, role: str, version: int) -> str:
    """The raw Markdown of one prompt file (comments still in place)."""
    return (resources.files(graph_package) / "prompts" / f"{role}.v{version}.md").read_text(
        encoding="utf-8"
    )


def read_common(graph_package: str, version: int) -> str:
    """The raw Markdown of one version of the common settings, which every role may name."""
    return (resources.files(graph_package) / "prompts" / f"_common.v{version}.md").read_text(
        encoding="utf-8"
    )


COMMON_HEADING = "# Your role in this step"


def strip_comments(text: str) -> str:
    """Drop HTML comments: editor notes never reach the model."""
    return _COMMENT_PATTERN.sub("", text)


def load_prompt(graph_package: str, role: str, version: int) -> LoadedPrompt:
    """Ingest and validate one prompt file of one graph."""
    raw = strip_comments(read_prompt(graph_package, role, version))
    if not raw.startswith("---\n") or "\n---\n" not in raw[4:]:
        msg = f"prompt for '{role}' v{version} must start with a YAML front-matter block"
        raise ValueError(msg)

    front_matter_text, _, markdown = raw[4:].partition("\n---\n")
    meta_raw = safe_load(front_matter_text)
    if not isinstance(meta_raw, dict):
        msg = f"prompt for '{role}' v{version} must hold a mapping in its front matter"
        raise ValueError(msg)
    front: dict[str, object] = dict(meta_raw)

    declared_role = str(front.get("role", ""))
    declared_version = int(str(front.get("version", "0")))
    if declared_role != role or declared_version != version:
        msg = (
            f"prompt for '{role}' v{version} declares '{declared_role}' "
            f"v{declared_version}; file name and front matter must match"
        )
        raise ValueError(msg)

    inputs = [
        PromptInput.model_validate(item)
        for item in cast("list[dict[str, object]]", front.get("inputs", []))
    ]
    if "output" not in front:
        msg = f"prompt for '{role}' v{version} must name its output model"
        raise ValueError(msg)

    parsed = _split_sections(markdown)
    _validate_system_sections(role, version, parsed["system"])
    _validate_user_sections(role, version, parsed["user"])
    common_version = int(str(front.get("common", "0")))
    if common_version:
        common = strip_comments(read_common(graph_package, common_version)).strip()
        parsed["system"] = f"{common}\n\n{COMMON_HEADING}\n\n{parsed['system'].strip()}\n"
    _validate_placeholders(role, version, parsed, inputs)

    return LoadedPrompt(
        role=role,
        version=version,
        description=str(front.get("description", "")),
        output=str(front["output"]),
        inputs=inputs,
        system=parsed["system"].strip() + "\n",
        user=parsed["user"].strip() + "\n",
    )


def _split_sections(markdown: str) -> dict[str, str]:
    if "# System" not in markdown or "# User" not in markdown:
        msg = "prompt must contain one # System part and one # User part"
        raise ValueError(msg)
    system, _, user = markdown.partition("# User")
    return {"system": system.replace("# System", "", 1), "user": user}


def _validate_system_sections(role: str, version: int, system: str) -> None:
    titles = [line[3:].strip().lower() for line in system.splitlines() if line.startswith("## ")]
    allowed = _REQUIRED_SYSTEM_H2 + _OPTIONAL_SYSTEM_H2
    for title in titles:
        if title not in allowed:
            msg = f"prompt '{role}' v{version}: unknown System section '{title}'"
            raise ValueError(msg)
    required_present = [title for title in titles if title in _REQUIRED_SYSTEM_H2]
    in_order = titles == sorted(titles, key=_SYSTEM_H2_ORDER.index)
    if required_present != _REQUIRED_SYSTEM_H2 or not in_order:
        msg = (
            f"prompt '{role}' v{version}: System sections must appear in the order "
            f"{_SYSTEM_H2_ORDER} (the optional ones may be left out); found {titles}"
        )
        raise ValueError(msg)


def _validate_user_sections(role: str, version: int, user: str) -> None:
    titles = [line[3:].strip().lower() for line in user.splitlines() if line.startswith("## ")]
    if titles != _REQUIRED_USER_H2:
        msg = (
            f"prompt '{role}' v{version}: the User part needs exactly the sections "
            f"{_REQUIRED_USER_H2} in that order, then the XML-tagged data"
        )
        raise ValueError(msg)


def _validate_placeholders(
    role: str,
    version: int,
    parts: dict[str, str],
    inputs: Sequence[PromptInput],
) -> None:
    declared = {item.name: item for item in inputs}
    for part_name, text in parts.items():
        for name in _PLACEHOLDER_PATTERN.findall(text):
            declared_input = declared.get(name)
            if declared_input is None:
                msg = f"prompt '{role}' v{version}: placeholder '{name}' has no declared input"
                raise ValueError(msg)
            if declared_input.part != part_name:
                msg = (
                    f"prompt '{role}' v{version}: input '{name}' is declared for the "
                    f"{declared_input.part} part but used in the {part_name} part"
                )
                raise ValueError(msg)
    for item in inputs:
        if f"{{{{ {item.name} }}}}" not in parts[item.part]:
            msg = f"prompt '{role}' v{version}: input '{item.name}' is declared but never used"
            raise ValueError(msg)


def assemble_prompt(
    prompt: LoadedPrompt,
    values: Mapping[str, str],
) -> list[tuple[str, str]]:
    """Build the LangChain message pair: system first, then user.

    Every declared placeholder must be present in `values` — a node that
    forgets an input fails loudly instead of sending an empty tag.
    """
    for input_spec in prompt.inputs:
        if input_spec.name not in values:
            msg = f"prompt '{prompt.role}': input '{input_spec.name}' was not provided"
            raise ValueError(msg)

    def render(text: str) -> str:
        return _PLACEHOLDER_PATTERN.sub(lambda match: str(values[match.group(1)]), text)

    return [
        ("system", render(prompt.system).strip()),
        ("human", render(prompt.user).strip()),
    ]


@lru_cache
def load_cached(graph_package: str, role: str, version: int) -> LoadedPrompt:
    """Parse once per process (prompts are versioned and immutable; tests load all)."""
    return load_prompt(graph_package, role, version)
