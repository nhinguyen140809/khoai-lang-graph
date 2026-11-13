"""Upload pipeline: store bytes, extract plain text, append one version."""

from __future__ import annotations

import contextlib
import json
from typing import TYPE_CHECKING, Any
from uuid import uuid4

from anyio import to_thread
from sqlalchemy import select
from sqlalchemy.orm import Session

from khoailanggraph.api.errors import ApiError
from khoailanggraph.features.documents.models import (
    DocumentVersionRow,
    SourceDocumentRow,
    utcnow,
)
from khoailanggraph.features.documents.schemas import (
    Document,
    DocumentDetail,
    DocumentVersion,
    DocumentVersionWithText,
)
from khoailanggraph.tools.research import extract_page_text

if TYPE_CHECKING:
    from pathlib import Path
    from uuid import UUID

    from sqlalchemy.ext.asyncio import AsyncSession

ALLOWED_FORMATS = ("txt", "md", "html", "json")
TEXT_LIMIT = 20_000


def extract_text(payload: bytes, fmt: str) -> str:
    """The plain text of one upload: markdown and text as they come, HTML
    reduced to its readable words, JSON kept verbatim; capped so a run's
    mining stage never chokes on a book."""
    raw = payload.decode("utf-8", errors="replace")
    if fmt == "html":
        raw = extract_page_text(raw)
    elif fmt == "json":
        with contextlib.suppress(ValueError):
            raw = json.dumps(json.loads(raw), ensure_ascii=False, indent=2)
    return " ".join(raw.split())[:TEXT_LIMIT]


async def save_document(
    session: AsyncSession,
    *,
    store: Path,
    project_id: UUID,
    filename: str,
    title: str | None,
    payload: bytes,
    first_version_id: UUID | None,
) -> DocumentDetail:
    """Store one upload and append its version; versions never change.

    A new `first_version_id` bumps the latest version of that document; the
    previously stored bytes and text stay readable under their version.
    """
    suffix = filename.rsplit(".", 1)[-1].casefold() if "." in filename else ""
    if suffix not in ALLOWED_FORMATS:
        raise ApiError(
            422,
            "unsupported_format",
            "Unsupported format",
            f"'{suffix or filename}' is not one of {list(ALLOWED_FORMATS)}.",
        )
    text = extract_text(payload, suffix)

    document_id: UUID
    version_number: int
    if first_version_id is None:
        document = SourceDocumentRow(
            project_id=project_id,
            title=title or filename,
            filename=filename,
            format=suffix,
            latest_version=1,
        )
        session.add(document)
        await session.flush()
        document_id = document.id
        version_number = 1
    else:
        found = await session.get(SourceDocumentRow, first_version_id)
        if found is None or found.deleted_at is not None or found.project_id != project_id:
            raise ApiError(404, "not_found", "Not found", "The document does not exist.")
        document = found
        version_number = document.latest_version + 1
        document.latest_version = version_number
        document.updated_at = utcnow()
        if title is not None:
            document.title = title
        document_id = document.id

    storage_key = f"{uuid4()}.bin"

    def _store_bytes() -> None:
        store.mkdir(parents=True, exist_ok=True)
        (store / storage_key).write_bytes(payload)

    await to_thread.run_sync(_store_bytes)
    row = DocumentVersionRow(
        document_id=document_id,
        version=version_number,
        size_bytes=len(payload),
        text_extract=text,
        storage_key=storage_key,
    )
    session.add(row)
    await session.flush()
    return await document_detail(session, document_id, version_requested=version_number)


async def document_detail(
    session: AsyncSession,
    document_id: UUID,
    *,
    version_requested: int | None = None,
) -> DocumentDetail:
    """One live document with its versions and the text of the read version."""
    document = await session.get(SourceDocumentRow, document_id)
    if document is None or document.deleted_at is not None:
        raise ApiError(404, "not_found", "Not found", "The document does not exist.")
    versions = list(
        (
            await session.scalars(
                select(DocumentVersionRow)
                .where(DocumentVersionRow.document_id == document_id)
                .order_by(DocumentVersionRow.version)
            )
        ).all()
    )
    if not versions:
        raise ApiError(404, "not_found", "Not found", "The document does not exist.")
    wanted = version_requested or versions[-1].version
    chosen = next((row for row in versions if row.version == wanted), None)
    if chosen is None:
        raise ApiError(404, "not_found", "Not found", f"Version {wanted} does not exist.")
    return DocumentDetail(
        id=document.id,
        project_id=document.project_id,
        title=document.title,
        filename=document.filename,
        format=document.format,
        latest_version=document.latest_version,
        created_at=document.created_at,
        updated_at=document.updated_at,
        versions=[
            DocumentVersion(
                id=row.id,
                document_id=row.document_id,
                version=row.version,
                size_bytes=row.size_bytes,
                created_at=row.created_at,
            )
            for row in versions
        ],
        text=DocumentVersionWithText.model_validate(
            {
                "id": chosen.id,
                "document_id": chosen.document_id,
                "version": chosen.version,
                "size_bytes": chosen.size_bytes,
                "created_at": chosen.created_at,
                "text": chosen.text_extract,
            }
        ).text,
    )


async def list_documents(
    session: AsyncSession,
    project_id: UUID,
    *,
    limit: int,
    cursor: int,
) -> tuple[list[Document], int | None]:
    """The live documents of one project, newest first (API.md envelope)."""
    rows = list(
        (
            await session.scalars(
                select(SourceDocumentRow)
                .where(
                    SourceDocumentRow.project_id == project_id,
                    SourceDocumentRow.deleted_at.is_(None),
                )
                .order_by(SourceDocumentRow.created_at.desc())
            )
        ).all()
    )
    views: list[Document] = [
        Document(
            id=row.id,
            project_id=row.project_id,
            title=row.title,
            filename=row.filename,
            format=row.format,
            latest_version=row.latest_version,
            created_at=row.created_at,
            updated_at=row.updated_at,
        )
        for row in rows
    ]
    window = views[cursor : cursor + limit]
    next_cursor = cursor + len(window) if cursor + len(window) < len(views) else None
    return window, next_cursor


async def delete_document(session: AsyncSession, document_id: UUID) -> None:
    """Soft delete: lists leave it out, its versions stay readable."""
    document = await session.get(SourceDocumentRow, document_id)
    if document is None or document.deleted_at is not None:
        raise ApiError(404, "not_found", "Not found", "The document does not exist.")
    document.deleted_at = utcnow()


def sync_latest_texts(engine: Any, project_id: UUID) -> list[dict[str, str]]:
    """The upload half of the corpus hits, for the sync run executor.

    Renders every live document's latest extracted text as a search hit with
    an `upload://` url — the corpus builder treats uploads as given hits,
    never as invented documents.
    """
    seeds: list[dict[str, str]] = []
    with Session(engine) as session:
        documents = list(
            session.scalars(
                select(SourceDocumentRow)
                .where(
                    SourceDocumentRow.project_id == project_id,
                    SourceDocumentRow.deleted_at.is_(None),
                )
                .order_by(SourceDocumentRow.created_at.desc())
            ).all()
        )
        for document in documents:
            version = session.scalar(
                select(DocumentVersionRow).where(
                    DocumentVersionRow.document_id == document.id,
                    DocumentVersionRow.version == document.latest_version,
                )
            )
            if version is None:  # pragma: no cover - every document has one
                continue
            seeds.append(
                {
                    "title": document.title,
                    "url": f"upload://{document.filename}",
                    "publisher": "upload",
                    "year": "",
                    "text": version.text_extract,
                }
            )
    return seeds


async def project_documents_text(session: AsyncSession, project_id: UUID) -> list[dict[str, str]]:
    """The latest text of every live document — the seed the research stage
    draws on alongside live-search hits."""
    documents = list(
        (
            await session.scalars(
                select(SourceDocumentRow)
                .where(
                    SourceDocumentRow.project_id == project_id,
                    SourceDocumentRow.deleted_at.is_(None),
                )
                .order_by(SourceDocumentRow.created_at.desc())
            )
        ).all()
    )
    seeds: list[dict[str, str]] = []
    for document in documents:
        version = await session.scalar(
            select(DocumentVersionRow).where(
                DocumentVersionRow.document_id == document.id,
                DocumentVersionRow.version == document.latest_version,
            )
        )
        if version is not None:
            seeds.append(
                {
                    "title": document.title,
                    "filename": document.filename,
                    "format": document.format,
                    "text": version.text_extract,
                }
            )
    return seeds
