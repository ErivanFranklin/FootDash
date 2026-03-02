"""Tests for the FootDash ML Prediction Service API endpoints."""
import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app


@pytest.fixture
def anyio_backend():
    return "asyncio"


@pytest.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


# ── Health & Info ────────────────────────────────────────────────────────────

@pytest.mark.anyio
async def test_root(client: AsyncClient):
    resp = await client.get("/")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "running"


@pytest.mark.anyio
async def test_health(client: AsyncClient):
    resp = await client.get("/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] in ("healthy", "degraded")
    assert "model_loaded" in data


@pytest.mark.anyio
async def test_model_info(client: AsyncClient):
    resp = await client.get("/model/info")
    assert resp.status_code == 200
    data = resp.json()
    assert "version" in data
    assert "features" in data


@pytest.mark.anyio
async def test_model_metrics(client: AsyncClient):
    resp = await client.get("/model/metrics")
    assert resp.status_code == 200
    data = resp.json()
    assert "markets" in data
    assert "outcome" in data["markets"]
    assert "btts" in data["markets"]
    assert "over_under" in data["markets"]


# ── Outcome Prediction ───────────────────────────────────────────────────────

SAMPLE_PREDICTION = {
    "home_form_rating": 65.0,
    "away_form_rating": 55.0,
    "home_win_rate": 60.0,
    "away_win_rate": 45.0,
    "home_goals_avg": 1.8,
    "away_goals_avg": 1.2,
    "home_goals_conceded_avg": 0.9,
    "away_goals_conceded_avg": 1.4,
    "h2h_home_wins": 5,
    "h2h_away_wins": 3,
    "h2h_draws": 2,
    "is_home": True,
    "league_id": 39,
    "season": "2025",
}


@pytest.mark.anyio
async def test_predict_outcome(client: AsyncClient):
    resp = await client.post("/predict", json=SAMPLE_PREDICTION)
    assert resp.status_code == 200
    data = resp.json()
    assert "home_win_probability" in data
    assert "draw_probability" in data
    assert "away_win_probability" in data
    assert data["confidence"] in ("low", "medium", "high")
    # Probabilities should roughly sum to 100
    total = data["home_win_probability"] + data["draw_probability"] + data["away_win_probability"]
    assert 95 <= total <= 105


# ── BTTS Prediction ──────────────────────────────────────────────────────────

SAMPLE_BTTS = {
    "home_goals_avg": 1.8,
    "away_goals_avg": 1.2,
    "home_goals_conceded_avg": 0.9,
    "away_goals_conceded_avg": 1.4,
    "home_form_rating": 65.0,
    "away_form_rating": 55.0,
    "league_id": 39,
    "season": "2025",
}


@pytest.mark.anyio
async def test_predict_btts(client: AsyncClient):
    resp = await client.post("/predict/btts", json=SAMPLE_BTTS)
    assert resp.status_code == 200
    data = resp.json()
    assert "btts_yes_probability" in data
    assert "btts_no_probability" in data
    assert 0 <= data["btts_yes_probability"] <= 100
    assert 0 <= data["btts_no_probability"] <= 100
    assert abs(data["btts_yes_probability"] + data["btts_no_probability"] - 100) < 0.1


# ── Over/Under Prediction ────────────────────────────────────────────────────

SAMPLE_OU = {
    "home_goals_avg": 1.8,
    "away_goals_avg": 1.2,
    "home_goals_conceded_avg": 0.9,
    "away_goals_conceded_avg": 1.4,
    "home_form_rating": 65.0,
    "away_form_rating": 55.0,
    "league_id": 39,
    "season": "2025",
    "line": 2.5,
}


@pytest.mark.anyio
async def test_predict_over_under(client: AsyncClient):
    resp = await client.post("/predict/over-under", json=SAMPLE_OU)
    assert resp.status_code == 200
    data = resp.json()
    assert "over_probability" in data
    assert "under_probability" in data
    assert "expected_total_goals" in data
    assert data["line"] == 2.5
    assert abs(data["over_probability"] + data["under_probability"] - 100) < 0.1


@pytest.mark.anyio
async def test_predict_over_under_custom_line(client: AsyncClient):
    payload = {**SAMPLE_OU, "line": 1.5}
    resp = await client.post("/predict/over-under", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["line"] == 1.5
    # Over 1.5 should be higher probability than Over 2.5
    resp2 = await client.post("/predict/over-under", json=SAMPLE_OU)
    data2 = resp2.json()
    assert data["over_probability"] >= data2["over_probability"]


# ── Batch Prediction ─────────────────────────────────────────────────────────

@pytest.mark.anyio
async def test_predict_batch(client: AsyncClient):
    payload = {"matches": [SAMPLE_PREDICTION, SAMPLE_PREDICTION]}
    resp = await client.post("/predict/batch", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] == 2
    assert len(data["predictions"]) == 2
    for pred in data["predictions"]:
        assert pred["status"] == "success"
        assert "home_win_probability" in pred


@pytest.mark.anyio
async def test_predict_batch_empty(client: AsyncClient):
    resp = await client.post("/predict/batch", json={"matches": []})
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] == 0


# ── Model Reload ─────────────────────────────────────────────────────────────

@pytest.mark.anyio
async def test_model_reload(client: AsyncClient):
    resp = await client.post("/model/reload")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "success"
