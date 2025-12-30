import numpy as np
import pandas as pd
from typing import Dict, List, Any, Tuple
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class FeatureEngineer:
    """Feature engineering for football match predictions."""
    
    def __init__(self):
        self.feature_names = [
            'home_form_rating',
            'away_form_rating',
            'home_win_rate',
            'away_win_rate',
            'home_goals_avg',
            'away_goals_avg',
            'home_goals_conceded_avg',
            'away_goals_conceded_avg',
            'h2h_home_wins',
            'h2h_away_wins',
            'h2h_draws',
            'form_difference',
            'goal_difference',
            'defensive_strength_difference',
            'h2h_advantage',
            'momentum_score',
            'league_strength',
            'season_stage'
        ]
    
    def engineer_features(self, request) -> np.ndarray:
        """
        Engineer features from prediction request.
        
        Args:
            request: PredictionRequest object
            
        Returns:
            np.ndarray: Feature vector for model prediction
        """
        try:
            # Basic features from request
            features = {}
            
            # Direct features
            features['home_form_rating'] = request.home_form_rating
            features['away_form_rating'] = request.away_form_rating
            features['home_win_rate'] = request.home_win_rate
            features['away_win_rate'] = request.away_win_rate
            features['home_goals_avg'] = request.home_goals_avg
            features['away_goals_avg'] = request.away_goals_avg
            features['home_goals_conceded_avg'] = request.home_goals_conceded_avg
            features['away_goals_conceded_avg'] = request.away_goals_conceded_avg
            features['h2h_home_wins'] = request.h2h_home_wins
            features['h2h_away_wins'] = request.h2h_away_wins
            features['h2h_draws'] = request.h2h_draws
            
            # Engineered features
            features['form_difference'] = request.home_form_rating - request.away_form_rating
            features['goal_difference'] = request.home_goals_avg - request.away_goals_avg
            features['defensive_strength_difference'] = (
                request.away_goals_conceded_avg - request.home_goals_conceded_avg
            )
            
            # Head-to-head advantage
            total_h2h = request.h2h_home_wins + request.h2h_away_wins + request.h2h_draws
            if total_h2h > 0:
                features['h2h_advantage'] = (
                    (request.h2h_home_wins - request.h2h_away_wins) / total_h2h
                )
            else:
                features['h2h_advantage'] = 0.0
            
            # Momentum score (form-based)
            features['momentum_score'] = self._calculate_momentum_score(request)
            
            # League strength (simplified mapping)
            features['league_strength'] = self._get_league_strength(request.league_id)
            
            # Season stage (early, mid, late)
            features['season_stage'] = self._get_season_stage(request.season)
            
            # Convert to numpy array in the correct order
            feature_vector = np.array([features[name] for name in self.feature_names])
            
            logger.info(f"Engineered {len(feature_vector)} features for prediction")
            return feature_vector
            
        except Exception as e:
            logger.error(f"Feature engineering failed: {e}")
            raise
    
    def _calculate_momentum_score(self, request) -> float:
        """Calculate momentum score based on recent form."""
        if hasattr(request, 'home_recent_form') and request.home_recent_form:
            home_momentum = self._form_to_momentum(request.home_recent_form)
        else:
            # Fallback to form rating
            home_momentum = (request.home_form_rating - 50) / 50  # Normalize to [-1, 1]
        
        if hasattr(request, 'away_recent_form') and request.away_recent_form:
            away_momentum = self._form_to_momentum(request.away_recent_form)
        else:
            # Fallback to form rating
            away_momentum = (request.away_form_rating - 50) / 50  # Normalize to [-1, 1]
        
        return home_momentum - away_momentum
    
    def _form_to_momentum(self, recent_form: List[str]) -> float:
        """Convert recent form ['W', 'L', 'D'] to momentum score."""
        if not recent_form:
            return 0.0
        
        # Weight recent matches more heavily
        weights = [0.4, 0.3, 0.2, 0.1, 0.05][:len(recent_form)]
        scores = []
        
        for result in recent_form:
            if result == 'W':
                scores.append(1.0)
            elif result == 'D':
                scores.append(0.0)
            else:  # 'L'
                scores.append(-1.0)
        
        if len(scores) != len(weights):
            weights = weights[:len(scores)]
            weights = [w / sum(weights) for w in weights]  # Normalize
        
        return sum(score * weight for score, weight in zip(scores, weights))
    
    def _get_league_strength(self, league_id: int) -> float:
        """Get league strength rating."""
        # Simplified league strength mapping
        league_strengths = {
            39: 1.0,    # Premier League
            140: 0.95,  # La Liga
            78: 0.95,   # Bundesliga
            135: 0.9,   # Serie A
            61: 0.85,   # Ligue 1
            94: 0.8,    # Liga NOS
            88: 0.75,   # Eredivisie
        }
        
        return league_strengths.get(league_id, 0.7)  # Default for unknown leagues
    
    def _get_season_stage(self, season: str) -> float:
        """Get season stage as a feature."""
        try:
            # Extract year from season (e.g., "2023" from "2023-24")
            current_year = datetime.now().year
            current_month = datetime.now().month
            
            # Football seasons typically run August to May
            if current_month >= 8:  # August onwards = early season
                if current_month <= 10:
                    return 0.0  # Early season
                elif current_month <= 2:
                    return 0.5  # Mid season
                else:
                    return 1.0  # Late season
            else:  # January to July
                if current_month <= 2:
                    return 0.5  # Mid season
                else:
                    return 1.0  # Late season / end of season
        except:
            return 0.5  # Default to mid-season
    
    def get_feature_names(self) -> List[str]:
        """Get list of feature names."""
        return self.feature_names.copy()
    
    def validate_features(self, features: np.ndarray) -> bool:
        """Validate engineered features."""
        if len(features) != len(self.feature_names):
            return False
        
        # Check for NaN or infinite values
        if np.any(np.isnan(features)) or np.any(np.isinf(features)):
            return False
        
        return True