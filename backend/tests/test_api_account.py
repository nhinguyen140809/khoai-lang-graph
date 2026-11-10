"""The account routes: password, sessions, model settings and usage."""

from __future__ import annotations

from httpx import AsyncClient

from support.api_helpers import REGISTER, TASK

API = "/api/v1"


async def _signed_in(file_client: AsyncClient) -> None:
    await file_client.post(f"{API}/auth/register", json=REGISTER)
    await file_client.post(
        f"{API}/auth/login", json={"email": REGISTER["email"], "password": "secret"}
    )


async def test_the_password_changes_and_other_sessions_are_revoked(
    file_client: AsyncClient,
) -> None:
    await _signed_in(file_client)
    await file_client.post(
        f"{API}/auth/login", json={"email": REGISTER["email"], "password": "secret"}
    )
    assert len((await file_client.get(f"{API}/me/sessions")).json()["items"]) == 2

    wrong = await file_client.post(
        f"{API}/me/password", json={"current_password": "no", "new_password": "longenough1"}
    )
    short = await file_client.post(
        f"{API}/me/password", json={"current_password": "secret", "new_password": "short"}
    )
    same = await file_client.post(
        f"{API}/me/password", json={"current_password": "secret", "new_password": "secret"}
    )
    assert [r.json()["errors"][0]["field"] for r in (wrong, short, same)] == [
        "current_password",
        "new_password",
        "new_password",
    ]

    done = await file_client.post(
        f"{API}/me/password", json={"current_password": "secret", "new_password": "longenough1"}
    )

    assert done.status_code == 204
    sessions = (await file_client.get(f"{API}/me/sessions")).json()["items"]
    assert len(sessions) == 1
    assert sessions[0]["current"] is True


async def test_a_session_is_revoked_and_a_second_try_is_404(file_client: AsyncClient) -> None:
    await _signed_in(file_client)
    other = AsyncClient(transport=file_client._transport, base_url="http://testserver")
    other.headers["Origin"] = "http://localhost:3000"
    await other.post(f"{API}/auth/login", json={"email": REGISTER["email"], "password": "secret"})
    sessions = (await file_client.get(f"{API}/me/sessions")).json()["items"]
    assert len(sessions) == 2
    other_id = next(s["id"] for s in sessions if not s["current"])

    assert (await file_client.delete(f"{API}/me/sessions/{other_id}")).status_code == 204
    assert (await file_client.delete(f"{API}/me/sessions/{other_id}")).status_code == 404
    assert (await other.get(f"{API}/me")).status_code == 401
    await other.aclose()


async def test_model_settings_are_replaced_and_checked(file_client: AsyncClient) -> None:
    await _signed_in(file_client)
    assert (await file_client.get(f"{API}/me/model-settings")).json() == {
        "items": [],
        "next_cursor": None,
    }

    bad = await file_client.put(
        f"{API}/me/model-settings",
        json={
            "items": [
                {"agent_role": "nobody", "model_id": "openai:gpt-4.1"},
                {"agent_role": "analyst", "model_id": "openai:unknown"},
                {"agent_role": "planner", "model_id": "openai:gpt-4.1", "temperature": 3},
            ]
        },
    )
    assert bad.status_code == 422
    assert [e["field"] for e in bad.json()["errors"]] == [
        "items.0.agent_role",
        "items.1.model_id",
        "items.2.temperature",
    ]

    good = await file_client.put(
        f"{API}/me/model-settings",
        json={"items": [{"agent_role": "analyst", "model_id": "openai:gpt-4.1-mini"}]},
    )
    assert good.status_code == 200
    assert good.json()["items"] == [
        {"agent_role": "analyst", "model_id": "openai:gpt-4.1-mini", "temperature": None}
    ]


async def test_usage_adds_up_the_steps_of_the_month(file_client: AsyncClient) -> None:
    await _signed_in(file_client)
    project = await file_client.post(f"{API}/projects", json={"name": "Mentors"})
    thread = await file_client.post(f"{API}/projects/{project.json()['id']}/threads")
    await file_client.post(f"{API}/threads/{thread.json()['id']}/messages", json={"content": TASK})

    plain = (await file_client.get(f"{API}/me/usage")).json()
    by_role = (await file_client.get(f"{API}/me/usage", params={"group_by": "agent_role"})).json()

    assert plain["groups"] == []
    assert plain["budget_usd"] == 20.0
    assert plain["total"]["output_tokens"] > 0
    assert by_role["groups"]
    assert (
        sum(g["usage"]["output_tokens"] for g in by_role["groups"])
        == (plain["total"]["output_tokens"])
    )
    assert (await file_client.get(f"{API}/me/usage", params={"month": "2020-01"})).json()["total"][
        "output_tokens"
    ] == 0
    assert (await file_client.get(f"{API}/me/usage", params={"month": "bad"})).status_code == 400
    assert (await file_client.get(f"{API}/me/usage", params={"group_by": "x"})).status_code == 400
