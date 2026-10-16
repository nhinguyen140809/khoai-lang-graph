"""Content of a stakeholder observation item, mirroring its v1 schema."""

from __future__ import annotations

from pydantic import BaseModel, ConfigDict


class StakeholderObservationContent(BaseModel):
    """One evaluative dimension of one stakeholder group, mined from one
    source document with verbatim evidence (the MAJ-EVAL mined tuple).

    `evidence` is the exact sentence from the source document's `text`; the
    miner node rejects an observation whose evidence is not a substring of
    that text. `source` holds the key of the source document (SRC-xxx) and
    the system wires the `evidenced_by` link to it.
    """

    model_config = ConfigDict(extra="forbid")

    stakeholder_name: str
    description: str
    dimension: str
    evidence: str
    source: str
