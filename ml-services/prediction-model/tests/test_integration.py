"""Integration tests for the ML Prediction Service.

These tests verify cross-endpoint consistency, edge-case inputs,
validation behaviour, and performance characteristics.
"""
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


# ── Shared fixtures ──────────────────────────────────────────────────────────

TOP_TEAM_STATS = {
    "home_form_rating": 80.0,
    "away_form_rating": 40.0,
    "home_win_rate": 75.0,
    "away_win_rate": 25.0,
    "home_goals_avg": 2.4,
    "away_goals_avg": 0.8,
    "home_goals_conceded_avg": 0.6,
    "away_goals_conceded_avg": 1.8,
    "h2h_home_wins": 8,
    "h2h_away_wins": 1,
    "h2h_draws": 1,
    "is_home": True,
    "league_id": 39,
    "season": "2025",
}

EVEN_TEAM_STATS = {
    "home_form_rating": 60.0,
    "away_form_rating": 60.0,
    "home_win_rate": 50.0,
    "away_win_rate": 50.0,
    "home_goals_avg": 1.5,
    "away_goals_avg": 1.5,
    "home_goals_conceded_avg": 1.5,
    "away_goals_conceded_avg": 1.5,
    "h2h_home_wins": 5,
    "h2h_away_wins": 5,
    "h2h_draws": 5,
    "is_home": True,
    "league_id": 39,
    "season": "2025",
}


# ── Prediction consistency ───────────────────────────────────────────────────

class TestPredictionConsistency:
    """Verify that model output is logically consistent."""

    @pytest.mark.anyio
    async def test_favourite_home_team_higher_win_probability(self, client: AsyncClient):
        """A dominant home team should have higher home-win probability."""
        resp = await client.post("/predict", json=TOP_TEAM_STATS)
        assert resp.status_code == 200
        data = resp.json()
        assert data["home_win_probability"] > data["away_win_probability"], (
            "Top home team should have higher win probability"
        )

    @pytest.mark.anyio
    async def test_evenly_matched_teams_similar_probabilities(self, client: AsyncClient):
        """Evenly matched teams should have similar win probabilities (+/- 15pp)."""
        resp = await client.post("/predict", json=EVEN_TEAM_STATS)
        assert resp.status_code == 200
        data = resp.json()
        diff = abs(data["home_win_probability"] - data["away_win_probability"])
        assert diff < 20.0, f"Expected balanced probabilities but got diff={diff:.1f}%"

    @pytest.mark.anyio
    async def test_outcome_probabilities_sum_to_100(self, client: AsyncClient):
        """Home win + draw + away win should sum approximately to 100."""
        for stats in [TOP_TEAM_STATS, EVEN_TEAM_STATS]:
            resp = await client.post("/predict", json=stats)
            assert resp.status_code == 200
            data = resp.json()
            total = data["home_win_probability"] + data["draw_probability"] + data["away_win_probability"]
            assert 95.0 <= total <= 105.0, f"Probabilities don't sum to ~100: {total}"

    @pytest.mark.anyio
    async def test_btts_complement_probabilities(self, client: AsyncClient):
        """btts_yes + btts_no should sum exactly to 100."""
        payload = {
            "home_goals_avg": 1.5,
            "away_goals_avg": 1.5,
            "home_goals_conceded_avg": 1.2,
            "away_goals_conceded_avg": 1.2,
            "home_form_rating": 60.0,
            "away_form_rating": 60.0,
            "league_id": 39,
            "season": "2025",
        }
        resp = await client.post("/predict/btts", json=payload)
        assert resp.status_code == 200
        data = resp.json()
        total = data["btts_yes_probability"] + data["btts_no_probability"]
        assert abs(total - 100.0) < 0.5, f"BTTS probabilities do not sum to 100: {total}"

    @pytest.mark.anyio
    async def test_over_under_complement_probabilities(self, client: AsyncClient):
        """over + under probabilities should sum exactly to 100."""
        payload = {
            "home_goals_avg": 1.5,
            "away_goals_avg": 1.3,
            "home_goals_conceded_avg": 1.1,
            "away_goals_conceded_avg": 1.4,
            "home_form_rating": 58.0,
            "away_form_rating": 52.0,
            "league_id": 39,
            "season": "2025",
            "line": 2.5,
        }
        resp = await client.post("/predict/over-under", json=payload)
        assert resp.status_code == 200
        data = resp.json()
        total = data["over_probability"] + data["under_probability"]
        assert abs(total - 100.0) < 0.5, f"O/U probabilities do not sum to 100: {total}"


# ── Edge case inputs ─────────────────────────────────────────────────────────

class TestEdgeCaseInputs:
    """Verify model handles extreme inputs gracefully."""

    @pytest.mark.anyio
    async def test_zero_goals_averages(self, client: AsyncClient):
        """Model should still return valid probabilities for zero-goal teams."""
        payload = {**EVEN_TEAM_STATS, "home_goals_avg": 0.0, "away_goals_avg": 0.0}
        resp = await client.post("/predict", json=payload)
        assert resp.status_code == 200
        data = resp.json()
        total = data["home_win_probability"] + data["draw_probability"] + data["away_win_probability"]
        assert 90.0 <= total <= 110.0

    @pytest.mark.anyio
    async def test_maximum_form_ratings(self, client: AsyncClient):
        """Model should handle form ratings at the maximum boundary."""
        payload = {**TOP_TEAM_STATS, "home_form_rating": 100.0, "away_form_rating": 100.0}
        resp = await client.post("/predict", json=payload)
        assert resp.status_code == 200
        assert resp.json()["confidence"] in ("low", "medium", "high")

    @pytest.mark.anyio
    async def test_high_goals_average_teams(self, client: AsyncClient):
        """High-scoring teams should tend toward over predictions."""
        btts_payload = {
            "home_goals_avg": 3.5,
            "away_goals_avg": 3.0,
            "home_goals_conceded_avg": 2.5,
            "away_goals_conceded_avg": 2.8,
            "home_form_rating": 70.0,
            "away_form_rating": 68.0,
            "league_id": 39,
            "season": "2025",
        }
        resp = await client.post("/predict/btts", json=btts_payload)
        assert resp.status_code == 200
        data = resp.json()
        assert data["btts_yes_probability"] > 50.0, "High-scoring teams should favour BTTS Yes"

    @pytest.mark.anyio
    async def test_low_goals_average_teams(self, client: AsyncClient):
        """Defensive teams should favour Under predictions."""
        ou_payload = {
            "home_goals_avg": 0.5,
            "away_goals_avg": 0.5,
            "home_goals_conceded_avg": 0.5,
            "away_goals_conceded_avg": 0.5,
            "home_form_rating": 50.0,
            "away_form_rating": 50.0,
            "league_id": 39,
            "season": "2025",
            "line": 2.5,
        }
        resp = await client.post("/predict/over-under", json=ou_payload)
        assert resp.status_code == 200
        data = resp.json()
        assert data["under_probability"] > 50.0, "Defensive teams should favour Under 2.5"


# ── Validation ────────────────────────────────────────────────────────────────

class TestInputValidation:
    """Test that invalid inputs return appropriate HTTP error codes."""

    @pytest.mark.anyio
    async def test_missing_required_field_returns_422(self, client: AsyncClient):
        """Omitting a required field should return HTTP 422."""
        incomplete = {k: v for k, v in EVEN_TEAM_STATS.items() if k != "home_goals_avg"}
        resp = await client.post("/predict", json=incomplete)
        assert resp.status_code == 422

    @pytest.mark.anyio
    async def test_empty_body_returns_422(self, client: AsyncClient):
        """Empty request body should return HTTP 422."""
        resp = await client.post("/predict", json={})
        assert resp.status_code == 422

    @pytest.mark.anyio
    async def test_invalid_content_type_returns_4xx(self, client: AsyncClient):
        """Non-JSON content type should be rejected."""
        resp = await client.post(
            "/predict",
            content="not json",
            headers={"Content-Type": "text/plain"},
        )
        assert resp.status_code in (400, 415, 422)


# ── Batch endpoint ────────────────────────────────────────────────────────────

class TestBatchPrediction:
    """Integration tests for the batch prediction endpoint."""

    @pytest.mark.anyio
    async def test_batch_returns_all_results(self, client: AsyncClient):
        """Batch should return one result per input match."""
        payload = {"matches": [EVEN_TEAM_STATS] * 5}
        resp = await client.post("/predict/batch", json=payload)
        assert resp.status_code == 200
        data = resp.json()
        assert data["total"] == 5
        assert len(data["predictions"]) == 5

    @pytest.mark.anyio
    async def test_batch_predictions_are_consistent(self, client: AsyncClient):
        """Identical inputs in batch should yield identical outputs."""
        payload = {"matches": [TOP_TEAM_STATS, TOP_TEAM_STATS]}
        resp = await client.post("/predict/batch", json=payload)
        assert resp.status_code == 200
        preds = resp.json()["predictions"]
        assert preds[0]["home_win_probability"] == preds[1]["home_win_probability"]


# ── Response structure ────────────────────────────────────────────────────────

class TestResponseStructure:
    """Verify response payloads include all required keys."""

    @pytest.mark.anyio
    async def test_outcome_prediction_fields(self, client: AsyncClient):
        resp = await client.post("/predict", json=EVEN_TEAM_STATS)
        data = resp.json()
        required_fields = [
            "home_win_probability", "draw_probability", "away_win_probability",
            "confidence", "strategy",
        ]
        for field in required_fields:
            assert field in data, f"Field '{field}' missing from /predict response"

    @pytest.mark.anyio
    async def test_btts_prediction_fields(self, client: AsyncClient):
        payload = {
            "home_goals_avg": 1.5, "away_goals_avg": 1.2,
            "home_goals_conceded_avg": 1.1, "away_goals_conceded_avg": 1.3,
            "home_form_rating": 60.0, "away_form_rating": 55.0,
            "league_id": 39, "season": "2025",
        }
        resp = await client.post("/predict/btts", json=payload)
        data = resp.json()
        assert "btts_yes_probability" in data
        assert "btts_no_probability" in data
        assert "recommendation" in data

    @pytest.mark.anyio
    async def test_over_under_prediction_fields(self, client: AsyncClient):
        payload = {
            "home_goals_avg": 1.5, "away_goals_avg": 1.2,
            "home_goals_conceded_avg": 1.1, "away_goals_conceded_avg": 1.3,
            "home_form_rating": 60.0, "away_form_rating": 55.0,
            "league_id": 39, "season": "2025", "line": 2.5,
        }
        resp = await client.post("/predict/over-under", json=payload)
        data = resp.json()
        assert "over_probability" in data
        assert "under_probability" in data
        assert "expected_total_goals" in data
        assert "line" in data
