"""What a user changes in the documents of a project, and the rule that lets them."""

from __future__ import annotations

from pathlib import Path
from tempfile import gettempdir
from typing import TYPE_CHECKING, Any
from uuid import uuid4

import pytest
from httpx import ASGITransport, AsyncClient

from khoailanggraph.main import create_app
from khoailanggraph.platform.db import (
    ensure_schema,
    make_async_engine,
    make_session_factory,
    make_sync_engine,
)
from khoailanggraph.settings import Settings
from support.api_helpers import open_review, seeded_run

if TYPE_CHECKING:
    from collections.abc import AsyncIterator

    from fastapi import FastAPI

TEST_DB = Path(gettempdir()) / "khoailang-white-box-editing.db"
API = "/api/v1"


@pytest.fixture
async def app() -> AsyncIterator[FastAPI]:
    TEST_DB.unlink(missing_ok=True)
    settings = Settings(
        app_env="test",
        database_url=f"sqlite+aiosqlite:///{TEST_DB}",
        log_level="WARNING",
        log_format="json",
    )
    application = create_app(settings)
    engine = make_async_engine(settings)
    await ensure_schema(engine)
    application.state.session_factory = make_session_factory(engine)
    application.state.sync_engine = make_sync_engine(settings)
    try:
        yield application
    finally:
        await engine.dispose()
        application.state.sync_engine.dispose()
        TEST_DB.unlink(missing_ok=True)


@pytest.fixture
async def client(app: FastAPI) -> AsyncIterator[AsyncClient]:
    transport = ASGITransport(app=app)
    async with AsyncClient(
        transport=transport,
        base_url="http://testserver",
        headers={"Origin": "http://localhost:3000"},
    ) as http:
        yield http


async def _spec(client: AsyncClient, project_id: str) -> dict[str, Any]:
    artifacts = (await client.get(f"{API}/projects/{project_id}/artifacts")).json()["items"]
    return next(a for a in artifacts if a["kind"] == "requirement_specification")


async def _items(client: AsyncClient, artifact_id: str, **params: object) -> list[dict[str, Any]]:
    response = await client.get(f"{API}/artifacts/{artifact_id}/items", params=params)  # type: ignore[arg-type]
    return list(response.json()["items"])


async def _edited_project(app: FastAPI, client: AsyncClient) -> tuple[str, dict[str, Any]]:
    """A project whose run waits at a review that takes changes, and its specification."""
    project_id, _thread_id = await seeded_run(client)
    await open_review(app, project_id)
    return project_id, await _spec(client, project_id)


async def _two_new_requirements(
    client: AsyncClient, spec: dict[str, Any]
) -> tuple[dict[str, Any], dict[str, Any]]:
    """Two requirements made by hand, so that no link of the agents is in the way."""
    template = dict((await _items(client, spec["id"]))[0]["content"])
    made = [
        (
            await client.post(
                f"{API}/artifacts/{spec['id']}/items",
                json={"kind": "spec_requirement", "content": template},
            )
        ).json()
        for _ in range(2)
    ]
    return made[0], made[1]


# - the rule -


async def _changes(client: AsyncClient, project_id: str, spec: dict[str, Any]) -> dict[str, Any]:
    """Every change a user may make, as a method, a path and a body."""
    items = await _items(client, spec["id"])
    links = (await client.get(f"{API}/projects/{project_id}/trace-links")).json()["items"]
    return {
        "patch item": ("PATCH", f"{API}/items/{items[0]['id']}", {"review_status": "approved"}),
        "patch artifact": ("PATCH", f"{API}/artifacts/{spec['id']}", {"summary": "New"}),
        "create item": (
            "POST",
            f"{API}/artifacts/{spec['id']}/items",
            {"kind": "section", "content": {"title": "S", "introduction": None}},
        ),
        "reorder": (
            "POST",
            f"{API}/artifacts/{spec['id']}/items/reorder",
            {"parent_item_id": None, "ids": [item["id"] for item in reversed(items)]},
        ),
        "delete item": ("DELETE", f"{API}/items/{items[0]['id']}", None),
        "move item": (
            "POST",
            f"{API}/items/{items[0]['id']}/move",
            {"parent_item_id": None, "position": 2},
        ),
        "restore item": ("POST", f"{API}/items/{items[0]['id']}/restore", {"version": 1}),
        "restore artifact": ("POST", f"{API}/artifacts/{spec['id']}/restore", {"version": 1}),
        "create link": (
            "POST",
            f"{API}/projects/{project_id}/trace-links",
            {
                "source_item_id": items[0]["id"],
                "target_item_id": items[1]["id"],
                "link_type": "depends_on",
            },
        ),
        "delete link": ("DELETE", f"{API}/trace-links/{links[0]['id']}", None),
    }


CHANGES = [
    "patch item",
    "patch artifact",
    "create item",
    "reorder",
    "delete item",
    "move item",
    "restore item",
    "restore artifact",
    "create link",
    "delete link",
]


@pytest.mark.parametrize("change", CHANGES)
async def test_a_document_is_refused_when_no_review_waits_for_the_user(
    client: AsyncClient, change: str
) -> None:
    project_id, _thread_id = await seeded_run(client)
    spec = await _spec(client, project_id)
    method, path, body = (await _changes(client, project_id, spec))[change]

    response = await client.request(method, path, json=body)

    assert response.status_code == 409, response.text
    assert response.json()["code"] == "invalid_state"


@pytest.mark.parametrize("change", CHANGES)
async def test_a_review_that_takes_no_edits_refuses_the_changes_too(
    app: FastAPI, client: AsyncClient, change: str
) -> None:
    project_id, _thread_id = await seeded_run(client)
    spec = await _spec(client, project_id)
    method, path, body = (await _changes(client, project_id, spec))[change]
    await open_review(app, project_id, allow_edits=False)

    response = await client.request(method, path, json=body)

    assert response.status_code == 409


async def test_only_the_artifacts_that_a_review_lists_take_changes(
    app: FastAPI, client: AsyncClient
) -> None:
    project_id, _thread_id = await seeded_run(client)
    spec = await _spec(client, project_id)
    artifacts = (await client.get(f"{API}/projects/{project_id}/artifacts")).json()["items"]
    other = next(a for a in artifacts if a["id"] != spec["id"])
    await open_review(app, project_id, artifact_ids=[other["id"]])

    refused = await client.patch(f"{API}/artifacts/{spec['id']}", json={"summary": "x"})
    allowed = await client.patch(f"{API}/artifacts/{other['id']}", json={"summary": "x"})

    assert refused.status_code == 409
    assert allowed.status_code == 200


async def test_a_run_that_is_not_waiting_does_not_take_changes_even_with_an_old_review(
    app: FastAPI, client: AsyncClient
) -> None:
    project_id, _thread_id = await seeded_run(client)
    spec = await _spec(client, project_id)
    await open_review(app, project_id, status="succeeded")

    response = await client.patch(f"{API}/artifacts/{spec['id']}", json={"summary": "x"})

    assert response.status_code == 409


# - an artifact -


async def test_an_artifact_can_be_changed_and_its_history_shows_who_did(
    app: FastAPI, client: AsyncClient
) -> None:
    project_id, spec = await _edited_project(app, client)

    response = await client.patch(
        f"{API}/artifacts/{spec['id']}",
        headers={"If-Match": str(spec["version"])},
        json={
            "title": "  The specification ",
            "summary": "What students and mentors need.",
            "content": {"purpose": "A new purpose."},
        },
    )

    body = response.json()
    assert response.status_code == 200
    assert body["title"] == "The specification"
    assert body["summary"] == "What students and mentors need."
    assert body["content"]["purpose"] == "A new purpose."
    assert body["content"]["scope"] == spec["content"]["scope"], "a field left out keeps its value"
    assert body["version"] == spec["version"] + 1
    assert body["updated_by"]["actor"] == "user"
    history = (await client.get(f"{API}/artifacts/{spec['id']}/revisions")).json()["items"]
    assert history[0]["version"] == body["version"]
    assert [entry["version"] for entry in history] == sorted(
        (entry["version"] for entry in history), reverse=True
    )
    assert set(history[0]) == {"version", "change_reason", "changed_by", "created_at", "content"}
    assert history[0]["change_reason"] == "user_edit"
    assert history[0]["changed_by"]["actor"] == "user"
    assert history[0]["content"]["purpose"] == "A new purpose."
    assert history[-1]["version"] == 1
    assert history[-1]["changed_by"]["actor"] == "agent"
    assert project_id


async def test_an_artifact_is_changed_from_the_version_it_was_read_at(
    app: FastAPI, client: AsyncClient
) -> None:
    _project_id, spec = await _edited_project(app, client)

    stale = await client.patch(
        f"{API}/artifacts/{spec['id']}",
        headers={"If-Match": str(spec["version"] - 1)},
        json={"summary": "x"},
    )

    assert stale.status_code == 409
    assert stale.json()["code"] == "version_conflict"


async def test_a_change_of_an_artifact_that_breaks_a_rule_is_refused_at_its_field(
    app: FastAPI, client: AsyncClient
) -> None:
    _project_id, spec = await _edited_project(app, client)

    response = await client.patch(
        f"{API}/artifacts/{spec['id']}",
        json={"title": "  ", "review_status": "done", "content": {"purpose": 3}},
    )

    assert response.status_code == 422
    fields = {error["field"] for error in response.json()["errors"]}
    assert {"title", "review_status"} <= fields
    unchanged = (await client.get(f"{API}/artifacts/{spec['id']}")).json()
    assert unchanged == spec


async def test_an_artifact_that_does_not_exist_answers_404(client: AsyncClient) -> None:
    await seeded_run(client)

    assert (
        await client.patch(f"{API}/artifacts/{uuid4()}", json={"summary": "x"})
    ).status_code == 404
    assert (await client.get(f"{API}/artifacts/{uuid4()}/revisions")).status_code == 404
    assert (
        await client.post(f"{API}/artifacts/{uuid4()}/restore", json={"version": 1})
    ).status_code == 404


# - the items of an artifact -


async def test_an_item_created_by_hand_gets_a_key_and_the_last_place(
    app: FastAPI, client: AsyncClient
) -> None:
    _project_id, spec = await _edited_project(app, client)
    before = await _items(client, spec["id"])
    template = dict(before[0]["content"])

    response = await client.post(
        f"{API}/artifacts/{spec['id']}/items",
        json={"kind": "spec_requirement", "content": template},
    )

    item = response.json()
    assert response.status_code == 201
    assert response.headers["location"] == f"{API}/items/{item['id']}"
    assert item["kind"] == "spec_requirement"
    assert item["key"] not in {entry["key"] for entry in before}
    assert item["created_by"]["actor"] == "user"
    after = await _items(client, spec["id"])
    assert [entry["id"] for entry in after][-1] == item["id"]
    assert item["outline_number"] == str(len(before) + 1)
    grown = (await client.get(f"{API}/artifacts/{spec['id']}")).json()
    assert grown["item_count"] == len(before) + 1
    assert grown["version"] > spec["version"]


async def test_an_item_that_breaks_a_rule_is_refused(app: FastAPI, client: AsyncClient) -> None:
    _project_id, spec = await _edited_project(app, client)
    items = await _items(client, spec["id"])
    section = (
        await client.post(
            f"{API}/artifacts/{spec['id']}/items",
            json={"kind": "section", "content": {"title": "Booking", "introduction": None}},
        )
    ).json()
    content = dict(items[0]["content"])

    wrong_kind = await client.post(
        f"{API}/artifacts/{spec['id']}/items", json={"kind": "persona", "content": {}}
    )
    wrong_content = await client.post(
        f"{API}/artifacts/{spec['id']}/items",
        json={"kind": "spec_requirement", "content": {"title": "x"}},
    )
    wrong_parent = await client.post(
        f"{API}/artifacts/{spec['id']}/items",
        json={"kind": "spec_requirement", "content": content, "parent_item_id": items[0]["id"]},
    )
    missing_parent = await client.post(
        f"{API}/artifacts/{spec['id']}/items",
        json={"kind": "spec_requirement", "content": content, "parent_item_id": str(uuid4())},
    )
    inside_section = await client.post(
        f"{API}/artifacts/{spec['id']}/items",
        json={"kind": "spec_requirement", "content": content, "parent_item_id": section["id"]},
    )

    assert section["key"].startswith("SEC-")
    assert wrong_kind.status_code == 422
    assert wrong_content.status_code == 422
    assert wrong_parent.status_code == 422
    assert missing_parent.status_code == 422
    assert inside_section.status_code == 201
    assert inside_section.json()["outline_number"] == f"{section['outline_number']}.1"


async def test_the_items_under_a_parent_can_be_put_in_another_order(
    app: FastAPI, client: AsyncClient
) -> None:
    _project_id, spec = await _edited_project(app, client)
    before = await _items(client, spec["id"])
    reversed_ids = [item["id"] for item in reversed(before)]

    response = await client.post(
        f"{API}/artifacts/{spec['id']}/items/reorder",
        json={"parent_item_id": None, "ids": reversed_ids},
    )

    assert response.status_code == 204
    after = await _items(client, spec["id"])
    assert [item["id"] for item in after] == reversed_ids
    assert [item["outline_number"] for item in after] == [str(n) for n in range(1, len(after) + 1)]
    revisions = (await client.get(f"{API}/items/{after[0]['id']}/revisions")).json()["items"]
    assert revisions[0]["change_reason"] == "user_edit"
    refused = await client.post(
        f"{API}/artifacts/{spec['id']}/items/reorder",
        json={"parent_item_id": None, "ids": reversed_ids[:-1]},
    )
    assert refused.status_code == 422
    assert refused.json()["errors"][0]["field"] == "ids"


async def test_an_item_moves_into_a_section_and_out_again(
    app: FastAPI, client: AsyncClient
) -> None:
    _project_id, spec = await _edited_project(app, client)
    items = await _items(client, spec["id"])
    section = (
        await client.post(
            f"{API}/artifacts/{spec['id']}/items",
            json={"kind": "section", "content": {"title": "Booking", "introduction": None}},
        )
    ).json()
    mover = items[0]

    inside = await client.post(
        f"{API}/items/{mover['id']}/move", json={"parent_item_id": section["id"], "position": 1}
    )

    assert inside.status_code == 200
    assert inside.json()["parent_item_id"] == section["id"]
    outline = await _items(client, spec["id"])
    moved_section = next(item for item in outline if item["id"] == section["id"])
    assert [item["outline_number"] for item in outline if item["id"] == mover["id"]] == [
        f"{moved_section['outline_number']}.1"
    ]
    assert all(item["depth"] == 1 for item in outline if item["parent_item_id"] is None)
    again = await client.post(
        f"{API}/items/{mover['id']}/move", json={"parent_item_id": None, "position": 1}
    )
    assert again.json()["parent_item_id"] is None
    assert again.json()["position"] == 1
    top = [item for item in await _items(client, spec["id"]) if item["parent_item_id"] is None]
    assert [item["position"] for item in top] == list(range(1, len(top) + 1))


async def test_a_move_that_breaks_a_tree_rule_is_refused(app: FastAPI, client: AsyncClient) -> None:
    _project_id, spec = await _edited_project(app, client)
    items = await _items(client, spec["id"])
    section = (
        await client.post(
            f"{API}/artifacts/{spec['id']}/items",
            json={"kind": "section", "content": {"title": "A", "introduction": None}},
        )
    ).json()
    nested = (
        await client.post(
            f"{API}/artifacts/{spec['id']}/items",
            json={
                "kind": "section",
                "content": {"title": "B", "introduction": None},
                "parent_item_id": section["id"],
            },
        )
    ).json()

    into_itself = await client.post(
        f"{API}/items/{section['id']}/move", json={"parent_item_id": section["id"], "position": 1}
    )
    into_a_descendant = await client.post(
        f"{API}/items/{section['id']}/move", json={"parent_item_id": nested["id"], "position": 1}
    )
    under_a_requirement = await client.post(
        f"{API}/items/{nested['id']}/move", json={"parent_item_id": items[0]["id"], "position": 1}
    )
    into_another_artifact = await client.post(
        f"{API}/items/{items[0]['id']}/move", json={"parent_item_id": str(uuid4()), "position": 1}
    )

    assert into_itself.status_code == 422
    assert into_a_descendant.status_code == 422
    assert under_a_requirement.status_code == 422
    assert into_another_artifact.status_code == 422


async def test_a_deleted_item_leaves_the_lists_and_its_versions_stay_readable(
    app: FastAPI, client: AsyncClient
) -> None:
    _project_id, spec = await _edited_project(app, client)
    items = await _items(client, spec["id"])
    gone = items[0]

    response = await client.delete(f"{API}/items/{gone['id']}")

    assert response.status_code == 204
    assert (await client.get(f"{API}/items/{gone['id']}")).status_code == 404
    assert gone["id"] not in {item["id"] for item in await _items(client, spec["id"])}
    shrunk = (await client.get(f"{API}/artifacts/{spec['id']}")).json()
    assert shrunk["item_count"] == len(items) - 1
    last = await client.get(f"{API}/items/{gone['id']}", params={"version": gone["version"] + 1})
    assert last.status_code == 200
    assert (
        await client.get(f"{API}/items/{gone['id']}", params={"version": gone["version"]})
    ).json()["content"] == gone["content"]
    assert (await client.delete(f"{API}/items/{gone['id']}")).status_code == 404
    revisions = (await client.get(f"{API}/items/{gone['id']}/revisions")).json()["items"]
    assert revisions[0]["change_reason"] == "deleted"
    assert revisions[0]["changed_by"]["actor"] == "user"


async def test_a_section_that_still_holds_items_is_not_deleted(
    app: FastAPI, client: AsyncClient
) -> None:
    _project_id, spec = await _edited_project(app, client)
    items = await _items(client, spec["id"])
    section = (
        await client.post(
            f"{API}/artifacts/{spec['id']}/items",
            json={"kind": "section", "content": {"title": "S", "introduction": None}},
        )
    ).json()
    await client.post(
        f"{API}/items/{items[0]['id']}/move", json={"parent_item_id": section["id"], "position": 1}
    )

    refused = await client.delete(f"{API}/items/{section['id']}")
    await client.post(
        f"{API}/items/{items[0]['id']}/move", json={"parent_item_id": None, "position": 1}
    )
    allowed = await client.delete(f"{API}/items/{section['id']}")

    assert refused.status_code == 409
    assert refused.json()["code"] == "invalid_state"
    assert allowed.status_code == 204


async def test_a_deleted_item_comes_back_with_a_restore(app: FastAPI, client: AsyncClient) -> None:
    _project_id, spec = await _edited_project(app, client)
    gone = (await _items(client, spec["id"]))[0]
    await client.delete(f"{API}/items/{gone['id']}")

    response = await client.post(
        f"{API}/items/{gone['id']}/restore", json={"version": gone["version"]}
    )

    item = response.json()
    assert response.status_code == 200
    assert item["content"] == gone["content"]
    assert item["version"] == gone["version"] + 2, "a delete and a restore are two new versions"
    assert item["id"] in {entry["id"] for entry in await _items(client, spec["id"])}
    history = (await client.get(f"{API}/items/{gone['id']}/revisions")).json()["items"]
    assert [entry["change_reason"] for entry in history][:2] == ["restored", "deleted"]
    assert (
        await client.post(f"{API}/items/{gone['id']}/restore", json={"version": 99})
    ).status_code == 404


async def test_an_item_goes_back_to_what_an_earlier_version_said(
    app: FastAPI, client: AsyncClient
) -> None:
    _project_id, spec = await _edited_project(app, client)
    first = (await _items(client, spec["id"]))[0]
    await client.patch(
        f"{API}/items/{first['id']}",
        headers={"If-Match": str(first["version"])},
        json={"content": {"title": "A title I wrote"}},
    )

    response = await client.post(
        f"{API}/items/{first['id']}/restore", json={"version": first["version"]}
    )

    assert response.json()["content"]["title"] == first["content"]["title"]
    assert response.json()["version"] == first["version"] + 2
    assert response.json()["updated_by"]["actor"] == "user"


async def test_an_artifact_goes_back_to_an_earlier_version_with_its_items(
    app: FastAPI, client: AsyncClient
) -> None:
    _project_id, spec = await _edited_project(app, client)
    items = await _items(client, spec["id"])
    await client.patch(f"{API}/artifacts/{spec['id']}", json={"summary": "Changed"})
    await client.patch(f"{API}/items/{items[0]['id']}", json={"content": {"title": "Changed too"}})
    await client.delete(f"{API}/items/{items[1]['id']}")
    added = (
        await client.post(
            f"{API}/artifacts/{spec['id']}/items",
            json={"kind": "spec_requirement", "content": items[0]["content"]},
        )
    ).json()

    response = await client.post(
        f"{API}/artifacts/{spec['id']}/restore", json={"version": spec["version"]}
    )

    restored = response.json()
    assert response.status_code == 200
    assert restored["summary"] == spec["summary"]
    assert restored["version"] > spec["version"] + 4
    assert restored["item_count"] == len(items)
    back = await _items(client, spec["id"])
    assert [item["id"] for item in back] == [item["id"] for item in items]
    assert back[0]["content"]["title"] == items[0]["content"]["title"]
    assert added["id"] not in {item["id"] for item in back}
    history = (await client.get(f"{API}/artifacts/{spec['id']}/revisions")).json()["items"]
    assert history[0]["change_reason"] == "restored"
    assert (
        await client.post(f"{API}/artifacts/{spec['id']}/restore", json={"version": 999})
    ).status_code == 404


# - trace links -


async def test_a_link_can_be_made_by_hand_and_removed(app: FastAPI, client: AsyncClient) -> None:
    project_id, spec = await _edited_project(app, client)
    first, second = await _two_new_requirements(client, spec)
    items = [first, second]
    body = {
        "source_item_id": items[0]["id"],
        "target_item_id": items[1]["id"],
        "link_type": "depends_on",
        "note": "Book before pay",
    }

    created = await client.post(f"{API}/projects/{project_id}/trace-links", json=body)

    link = created.json()
    assert created.status_code == 201
    assert created.headers["location"] == f"{API}/trace-links/{link['id']}"
    assert (link["source_item_id"], link["target_item_id"]) == (items[0]["id"], items[1]["id"])
    assert link["target_version"] == items[1]["version"]
    assert link["note"] == "Book before pay"
    path = f"{API}/projects/{project_id}/trace-links"
    listed = (await client.get(path, params={"source_item_id": first["id"]})).json()["items"]
    assert [entry["id"] for entry in listed] == [link["id"]]
    removed = await client.delete(f"{API}/trace-links/{link['id']}")
    assert removed.status_code == 204
    assert (await client.get(path, params={"source_item_id": first["id"]})).json()["items"] == []
    assert (await client.delete(f"{API}/trace-links/{link['id']}")).status_code == 404


async def test_a_link_that_breaks_a_rule_is_refused(app: FastAPI, client: AsyncClient) -> None:
    project_id, spec = await _edited_project(app, client)
    first, second = await _two_new_requirements(client, spec)

    def make(**changes: object) -> dict[str, object]:
        return {
            "source_item_id": first["id"],
            "target_item_id": second["id"],
            "link_type": "depends_on",
            **changes,
        }

    path = f"{API}/projects/{project_id}/trace-links"
    agents_only = await client.post(path, json=make(link_type="supersedes"))
    unknown_type = await client.post(path, json=make(link_type="likes"))
    wrong_pair = await client.post(path, json=make(link_type="derived_from"))
    to_itself = await client.post(path, json=make(target_item_id=first["id"]))
    missing = await client.post(path, json=make(target_item_id=str(uuid4())))
    quote_not_allowed = await client.post(path, json=make(target_quote="anything"))
    assert (await client.post(path, json=make())).status_code == 201
    again = await client.post(path, json=make())
    loops_back = await client.post(
        path, json=make(source_item_id=second["id"], target_item_id=first["id"])
    )

    assert agents_only.status_code == 422
    assert agents_only.json()["errors"][0]["field"] == "link_type"
    assert unknown_type.status_code == 422
    assert wrong_pair.status_code == 422
    assert to_itself.status_code == 422
    assert missing.status_code == 404
    assert quote_not_allowed.status_code == 422
    assert quote_not_allowed.json()["errors"][0]["field"] == "target_quote"
    assert again.status_code == 409
    assert loops_back.status_code == 422


async def test_a_link_can_quote_words_of_both_items(app: FastAPI, client: AsyncClient) -> None:
    project_id, _spec_artifact = await _edited_project(app, client)
    links = (
        await client.get(
            f"{API}/projects/{project_id}/trace-links", params={"link_type": "derived_from"}
        )
    ).json()["items"]
    spec_to_analysis = None
    for link in links:
        source = (await client.get(f"{API}/items/{link['source_item_id']}")).json()
        if source["kind"] == "spec_requirement":
            spec_to_analysis = (
                link,
                source,
                (await client.get(f"{API}/items/{link['target_item_id']}")).json(),
            )
            break
    assert spec_to_analysis is not None
    link, source, target = spec_to_analysis
    await client.delete(f"{API}/trace-links/{link['id']}")
    words_of_source = str(source["content"]["statement"])[:20]
    words_of_target = str(target["content"]["statement"])[:20]

    created = await client.post(
        f"{API}/projects/{project_id}/trace-links",
        json={
            "source_item_id": source["id"],
            "target_item_id": target["id"],
            "link_type": "derived_from",
            "source_quote": words_of_source,
            "target_quote": words_of_target,
        },
    )
    invented = await client.post(
        f"{API}/projects/{project_id}/trace-links",
        json={
            "source_item_id": source["id"],
            "target_item_id": target["id"],
            "link_type": "derived_from",
            "source_quote": "words that are nowhere",
        },
    )

    assert created.status_code == 201
    assert created.json()["source_quote"] == words_of_source
    assert created.json()["target_quote"] == words_of_target
    assert invented.status_code in {409, 422}
