import os
import logging
from typing import Optional
from models.match_predictor import MatchPredictor

logger = logging.getLogger(__name__)

class ModelLoader:
    """Utility class for loading ML models."""
    
    def __init__(self, models_dir: str = "models"):
        self.models_dir = models_dir
        self.default_model_path = os.path.join(models_dir, "match_predictor.joblib")
    
    def load_model(self, model_path: Optional[str] = None) -> MatchPredictor:
        """
        Load ML model with fallback support.
        
        Args:
            model_path: Path to model file. If None, uses default path.
            
        Returns:
            MatchPredictor instance
        """
        if model_path is None:
            model_path = self.default_model_path
        
        predictor = MatchPredictor()
        
        try:
            if os.path.exists(model_path):
                predictor.load_model(model_path)
                logger.info(f"Successfully loaded ML model from {model_path}")
            else:
                logger.warning(f"Model file not found at {model_path}, using fallback")
                # Predictor will initialize with statistical fallback
        except Exception as e:
            logger.error(f"Failed to load model: {e}, using fallback")
            # Predictor will use statistical fallback
        
        return predictor
    
    def list_available_models(self) -> list:
        """List all available model files."""
        if not os.path.exists(self.models_dir):
            return []
        
        model_files = []
        for file in os.listdir(self.models_dir):
            if file.endswith(('.joblib', '.pkl', '.pickle')):
                model_files.append(os.path.join(self.models_dir, file))
        
        return model_files
    
    def get_model_info(self, model_path: str) -> dict:
        """Get information about a model file."""
        try:
            import joblib
            model_data = joblib.load(model_path)
            
            if isinstance(model_data, dict):
                return {
                    'path': model_path,
                    'version': model_data.get('version', 'unknown'),
                    'algorithm': model_data.get('algorithm', 'unknown'),
                    'accuracy': model_data.get('accuracy'),
                    'training_info': model_data.get('training_info', {}),
                    'created_at': model_data.get('created_at'),
                    'file_size': os.path.getsize(model_path)
                }
            else:
                return {
                    'path': model_path,
                    'version': 'unknown',
                    'algorithm': 'unknown',
                    'file_size': os.path.getsize(model_path)
                }
        except Exception as e:
            logger.error(f"Failed to get model info: {e}")
            return {
                'path': model_path,
                'error': str(e)
            }