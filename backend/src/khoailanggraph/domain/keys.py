"""Item keys: the readable ids of artifact items (docs/DATA_SHAPE: identifiers).

A key is a prefix and a running number, unique inside one project and never
reused; the numbers come from the project key counters, which live in the
application, not here. The domain only owns the format.
"""

from __future__ import annotations

# The key prefix of every item kind of workflow definition version 2. The
# prefix table itself belongs to the definition (worksheets may change it);
# this constant serves the version-2 keys the product writes today.
KEY_PREFIXES: dict[str, str] = {
    "section": "SEC",
    "source_document": "SRC",
    "stakeholder_observation": "OBS",
    "persona": "PER",
    "interview_message": "PER",  # <persona key>#<position>, see interview_message_key
    "raw_requirement": "RAW",
    "analyzed_requirement": "AR",
    "latent_need": "LN",
    "assumption": "ASM",
    "ambiguity_issue": "AMB",
    "conflict": "CONF",
    "spec_requirement": "REQ",
    # A backlog item is an epic (EP) or a user story (US).
    "backlog_item": "US",
    "validation_issue": "VAL",
}

EPIC_PREFIX = "EP"
STORY_PREFIX = "US"


def key(prefix: str, number: int) -> str:
    """The readable key of one item: prefix, hyphen, zero-padded number."""
    return f"{prefix}-{number:03d}"


def backlog_key(number: int, *, epic: bool) -> str:
    """The key of a backlog item by its type: EP for an epic, US for a story."""
    return key(EPIC_PREFIX if epic else STORY_PREFIX, number)


def interview_message_key(persona_key: str, position: int) -> str:
    """The key of one interview message: its persona's key, #, transcript position."""
    return f"{persona_key}#{position}"
