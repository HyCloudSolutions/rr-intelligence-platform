import pytest
from src.services.ml_pipeline import generate_predictions

def test_generate_predictions():
    # Mock some data for prediction testing
    test_data = [
        {
            "id": "mock_1",
            "is_restaurant": 1,
            "is_grocery": 0,
            "is_mobile": 0,
            "risk_level": 3,
            "days_since_last_inspection": 100,
            "historical_failures": 5
        },
        {
            "id": "mock_2",
            "is_restaurant": 0,
            "is_grocery": 1,
            "is_mobile": 0,
            "risk_level": 1,
            "days_since_last_inspection": 10,
            "historical_failures": 0
        }
    ]

    results = generate_predictions(test_data)
    
    assert len(results) == 2
    assert results[0]["establishment_id"] == "mock_1"
    assert "failure_probability" in results[0]
    assert "risk_band" in results[0]
    assert "top_risk_factor" in results[0]
    
    assert results[1]["establishment_id"] == "mock_2"
    assert isinstance(results[1]["failure_probability"], float)

    # Mock 1 has many failures and is high risk, Mock 2 has none
    # Ideally mock_1 failure_probability > mock_2
    assert results[0]["failure_probability"] > results[1]["failure_probability"]
