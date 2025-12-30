from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ValidationError
import logging
from typing import Dict, List, Optional
import os
import sys

# Add app directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from models.match_predictor import MatchPredictor
from models.feature_engineer import FeatureEngineer
from utils.model_loader import ModelLoader

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="FootDash ML Prediction Service",
    description="Machine Learning prediction service for football match outcomes",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:4200"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables for model and feature engineer
model_loader = ModelLoader()
predictor: Optional[MatchPredictor] = None
feature_engineer: Optional[FeatureEngineer] = None

@app.on_event("startup")
async def startup_event():
    """Load model and feature engineer on startup."""
    global predictor, feature_engineer
    try:
        predictor = model_loader.load_model()
        feature_engineer = FeatureEngineer()
        logger.info("ML prediction service started successfully")
    except Exception as e:
        logger.error(f"Failed to load model: {e}")
        predictor = None
        feature_engineer = None

class PredictionRequest(BaseModel):
    """Request model for match prediction."""
    home_form_rating: float
    away_form_rating: float
    home_win_rate: float
    away_win_rate: float
    home_goals_avg: float
    away_goals_avg: float
    home_goals_conceded_avg: float
    away_goals_conceded_avg: float
    h2h_home_wins: int
    h2h_away_wins: int
    h2h_draws: int
    is_home: bool = True
    league_id: int
    season: str
    days_since_last_match: Optional[int] = None
    home_recent_form: Optional[List[str]] = None  # ['W', 'L', 'D', 'W', 'W']
    away_recent_form: Optional[List[str]] = None

class PredictionResponse(BaseModel):
    """Response model for match prediction."""
    home_win_probability: float
    draw_probability: float
    away_win_probability: float
    confidence: str
    model_version: str
    features_used: List[str]
    feature_importance: Optional[Dict[str, float]] = None

class HealthResponse(BaseModel):
    """Response model for health check."""
    status: str
    model_loaded: bool
    model_version: Optional[str] = None
    timestamp: str

@app.get("/", tags=["Root"])
async def root():
    """Root endpoint."""
    return {
        "message": "FootDash ML Prediction Service",
        "version": "1.0.0",
        "status": "running"
    }

@app.get("/health", response_model=HealthResponse, tags=["Health"])
async def health_check():
    """Health check endpoint."""
    from datetime import datetime
    
    return HealthResponse(
        status="healthy" if predictor is not None else "degraded",
        model_loaded=predictor is not None,
        model_version=predictor.version if predictor else None,
        timestamp=datetime.utcnow().isoformat()
    )

@app.post("/predict", response_model=PredictionResponse, tags=["Predictions"])
async def predict_match(request: PredictionRequest):
    """Generate match prediction using ML model."""
    if predictor is None or feature_engineer is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="ML model not available. Service may be starting up or model failed to load."
        )
    
    try:
        # Engineer features from request
        features = feature_engineer.engineer_features(request)
        
        # Generate prediction
        prediction_result = predictor.predict(features)
        
        # Determine confidence level
        confidence = _determine_confidence(prediction_result['probabilities'])
        
        return PredictionResponse(
            home_win_probability=round(prediction_result['probabilities'][0] * 100, 2),
            draw_probability=round(prediction_result['probabilities'][1] * 100, 2),
            away_win_probability=round(prediction_result['probabilities'][2] * 100, 2),
            confidence=confidence,
            model_version=predictor.version,
            features_used=prediction_result['features_used'],
            feature_importance=prediction_result.get('feature_importance')
        )
        
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Feature engineering failed: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Prediction failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Prediction generation failed: {str(e)}"
        )

@app.get("/model/info", tags=["Model"])
async def get_model_info():
    """Get information about the loaded model."""
    if predictor is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="ML model not available"
        )
    
    return {
        "version": predictor.version,
        "algorithm": predictor.algorithm,
        "features": predictor.feature_names,
        "accuracy": predictor.accuracy,
        "trained_on": predictor.training_info
    }

@app.post("/model/reload", tags=["Model"])
async def reload_model():
    """Reload the ML model (for updates)."""
    global predictor, feature_engineer
    try:
        predictor = model_loader.load_model()
        feature_engineer = FeatureEngineer()
        logger.info("Model reloaded successfully")
        return {"status": "success", "message": "Model reloaded successfully"}
    except Exception as e:
        logger.error(f"Model reload failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Model reload failed: {str(e)}"
        )

def _determine_confidence(probabilities: List[float]) -> str:
    """Determine confidence level based on prediction probabilities."""
    max_prob = max(probabilities)
    
    if max_prob >= 0.7:
        return "high"
    elif max_prob >= 0.5:
        return "medium"
    else:
        return "low"

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)