import numpy as np
import pandas as pd
from typing import Dict, List, Any, Optional, Tuple
import logging
import os
import joblib
from datetime import datetime

logger = logging.getLogger(__name__)

class MatchPredictor:
    """Machine learning model for football match prediction."""
    
    def __init__(self, model_path: Optional[str] = None):
        self.model = None
        self.feature_names = []
        self.version = "1.0.0"
        self.algorithm = "XGBoost"
        self.accuracy = None
        self.training_info = {}
        
        if model_path and os.path.exists(model_path):
            self.load_model(model_path)
        else:
            # Initialize with fallback statistical model
            self._init_fallback_model()
    
    def _init_fallback_model(self):
        """Initialize a simple fallback model when ML model isn't available."""
        logger.warning("ML model not found, initializing fallback statistical model")
        self.algorithm = "Statistical Fallback"
        self.version = "fallback-1.0.0"
        self.accuracy = 0.62  # Approximate accuracy of statistical model
        self.feature_names = [
            'home_form_rating', 'away_form_rating', 'home_win_rate', 'away_win_rate',
            'home_goals_avg', 'away_goals_avg', 'home_goals_conceded_avg', 'away_goals_conceded_avg',
            'h2h_home_wins', 'h2h_away_wins', 'h2h_draws', 'form_difference',
            'goal_difference', 'defensive_strength_difference', 'h2h_advantage',
            'momentum_score', 'league_strength', 'season_stage'
        ]
        self.training_info = {
            "model_type": "statistical_fallback",
            "created_at": datetime.now().isoformat()
        }
    
    def predict(self, features: np.ndarray) -> Dict[str, Any]:
        """
        Generate match prediction.
        
        Args:
            features: Feature vector
            
        Returns:
            Dict containing probabilities and metadata
        """
        try:
            if self.model is not None:
                return self._predict_ml(features)
            else:
                return self._predict_statistical(features)
        except Exception as e:
            logger.error(f"Prediction failed: {e}")
            # Fallback to basic statistical prediction
            return self._predict_statistical(features)
    
    def _predict_ml(self, features: np.ndarray) -> Dict[str, Any]:
        """ML model prediction."""
        try:
            # Reshape for single prediction
            if features.ndim == 1:
                features = features.reshape(1, -1)
            
            # Get prediction probabilities
            probabilities = self.model.predict_proba(features)[0]
            
            # Get feature importance if available
            feature_importance = None
            if hasattr(self.model, 'feature_importances_'):
                feature_importance = dict(zip(
                    self.feature_names,
                    self.model.feature_importances_
                ))
            
            return {
                'probabilities': probabilities.tolist(),
                'features_used': self.feature_names,
                'feature_importance': feature_importance,
                'model_type': 'ml',
                'confidence_raw': float(np.max(probabilities))
            }
            
        except Exception as e:
            logger.error(f"ML prediction failed: {e}")
            raise
    
    def _predict_statistical(self, features: np.ndarray) -> Dict[str, Any]:
        """Fallback statistical prediction using the current FootDash algorithm."""
        try:
            # Map features to expected positions
            feature_dict = dict(zip(self.feature_names, features))
            
            # Extract key features for statistical calculation
            home_form = feature_dict.get('home_form_rating', 50)
            away_form = feature_dict.get('away_form_rating', 50)
            home_win_rate = feature_dict.get('home_win_rate', 50)
            away_win_rate = feature_dict.get('away_win_rate', 50)
            h2h_home_wins = feature_dict.get('h2h_home_wins', 0)
            h2h_away_wins = feature_dict.get('h2h_away_wins', 0)
            h2h_draws = feature_dict.get('h2h_draws', 0)
            
            # Apply FootDash statistical algorithm
            home_advantage = 10  # 10% boost for home team
            
            # Calculate base scores
            home_score = home_form * 0.4 + home_win_rate * 0.4 + home_advantage
            away_score = away_form * 0.4 + away_win_rate * 0.4
            
            # Head-to-head adjustment
            total_h2h = h2h_home_wins + h2h_away_wins + h2h_draws
            if total_h2h > 0:
                h2h_home_percent = (h2h_home_wins / total_h2h) * 100
                h2h_away_percent = (h2h_away_wins / total_h2h) * 100
                home_score += h2h_home_percent * 0.2
                away_score += h2h_away_percent * 0.2
            
            # Normalize and calculate probabilities
            total = home_score + away_score
            win_probability_space = 75  # Reserve 25% for draw
            
            home_win = (home_score / total) * win_probability_space
            away_win = (away_score / total) * win_probability_space
            draw = 100 - (home_win + away_win)
            
            # Ensure draw probability is between 15-30%
            if draw < 15:
                adjustment = (15 - draw) / 2
                home_win -= adjustment
                away_win -= adjustment
                draw = 15
            elif draw > 30:
                adjustment = (draw - 30) / 2
                home_win += adjustment
                away_win += adjustment
                draw = 30
            
            # Convert to probabilities (0-1)
            probabilities = [home_win / 100, draw / 100, away_win / 100]
            
            return {
                'probabilities': probabilities,
                'features_used': self.feature_names,
                'feature_importance': None,
                'model_type': 'statistical',
                'confidence_raw': float(max(probabilities))
            }
            
        except Exception as e:
            logger.error(f"Statistical prediction failed: {e}")
            # Ultimate fallback - equal probabilities
            return {
                'probabilities': [0.33, 0.34, 0.33],
                'features_used': self.feature_names,
                'feature_importance': None,
                'model_type': 'fallback',
                'confidence_raw': 0.34
            }
    
    def load_model(self, model_path: str):
        """Load trained ML model from file."""
        try:
            model_data = joblib.load(model_path)
            
            if isinstance(model_data, dict):
                self.model = model_data.get('model')
                self.feature_names = model_data.get('feature_names', [])
                self.version = model_data.get('version', '1.0.0')
                self.accuracy = model_data.get('accuracy')
                self.training_info = model_data.get('training_info', {})
            else:
                # Assume it's just the model
                self.model = model_data
                logger.warning("Loaded model without metadata")
            
            logger.info(f"Loaded ML model: {self.algorithm} v{self.version}")
            
        except Exception as e:
            logger.error(f"Failed to load model from {model_path}: {e}")
            self._init_fallback_model()
    
    def save_model(self, model_path: str):
        """Save trained model to file."""
        try:
            model_data = {
                'model': self.model,
                'feature_names': self.feature_names,
                'version': self.version,
                'algorithm': self.algorithm,
                'accuracy': self.accuracy,
                'training_info': self.training_info,
                'created_at': datetime.now().isoformat()
            }
            
            os.makedirs(os.path.dirname(model_path), exist_ok=True)
            joblib.dump(model_data, model_path)
            logger.info(f"Model saved to {model_path}")
            
        except Exception as e:
            logger.error(f"Failed to save model: {e}")
            raise
    
    def get_feature_importance(self) -> Optional[Dict[str, float]]:
        """Get feature importance from the model."""
        if self.model and hasattr(self.model, 'feature_importances_'):
            return dict(zip(self.feature_names, self.model.feature_importances_))
        return None
    
    def validate_features(self, features: np.ndarray) -> bool:
        """Validate input features."""
        if len(features) != len(self.feature_names):
            logger.error(f"Expected {len(self.feature_names)} features, got {len(features)}")
            return False
        
        if np.any(np.isnan(features)) or np.any(np.isinf(features)):
            logger.error("Features contain NaN or infinite values")
            return False
        
        return True