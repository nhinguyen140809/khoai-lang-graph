"""Bringing the documents of a project back to the point a retry starts from.

The steps after the chosen one changed documents that the state saved before it knows nothing
about. Before the new run starts, each live artifact of the project is set back to the last
version that none of those steps wrote (as a new version with the change reason `restored`, which
also removes the items the steps added), and each artifact that one of those steps created is
deleted with its items. Nothing is lost: every version stays in the revisions.
"""

from __future__ import annotations

from datetime import UTC, datetime
from typing import TYPE_CHECKING

from sqlalchemy import select

from khoailanggraph.features.artifacts import editing
from khoailanggraph.features.artifacts.models import (
    ArtifactItemRow,
    ArtifactRevisionRow,
    ArtifactRow,
)
from khoailanggraph.features.artifacts.service import bump_artifact, item_revision_row
from khoailanggraph.features.runs.models import RunStepRow

if TYPE_CHECKING:
    from uuid import UUID

    from sqlalchemy.orm import Session

    from khoailanggraph.platform.origin import Origin


def bring_back(session: Session, project_id: UUID, from_step: RunStepRow, by: Origin) -> None:
    """Set the documents of the project back to how they were before `from_step` ran."""
    later = {
        step_id
        for step_id in session.scalars(
            select(RunStepRow.id).where(
                RunStepRow.run_id == from_step.run_id,
                RunStepRow.sequence >= from_step.sequence,
            )
        )
    }
    artifacts = session.scalars(
        select(ArtifactRow).where(
            ArtifactRow.project_id == project_id, ArtifactRow.deleted_at.is_(None)
        )
    ).all()
    for artifact in artifacts:
        if artifact.created_step_id in later:
            _delete_with_items(session, artifact, by)
            continue
        revisions = session.scalars(
            select(ArtifactRevisionRow)
            .where(ArtifactRevisionRow.artifact_id == artifact.id)
            .order_by(ArtifactRevisionRow.version.desc())
        ).all()
        target = next((rev for rev in revisions if rev.changed_step_id not in later), None)
        if target is not None and target.version != artifact.version:
            editing.restore_artifact(session, artifact.id, target.version, by)


def _delete_with_items(session: Session, artifact: ArtifactRow, by: Origin) -> None:
    now = datetime.now(UTC)
    for item in session.scalars(
        select(ArtifactItemRow).where(
            ArtifactItemRow.artifact_id == artifact.id, ArtifactItemRow.deleted_at.is_(None)
        )
    ).all():
        item.deleted_at = now
        item.version += 1
        session.add(item_revision_row(item, "deleted", by))
    artifact.deleted_at = now
    bump_artifact(session, artifact, "deleted", by)


__all__ = ["bring_back"]
