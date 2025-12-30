#!/usr/bin/env python3
"""
FootDash ML Model Training Script

This script fetches training data from the FootDash API and trains
an XGBoost classification model for match outcome prediction.

Usage:
    python train_model.py --api-url http://localhost:4000 --auth-token <JWT_TOKEN>
    python train_model.py --data-file training_data.json
"""

import os
import sys
import argparse
import requests
import json
import pandas as pd
import numpy as np
from datetime import datetime
from typing import Dict, List, Tuple, Optional
import logging
from pathlib import Path

# ML imports
import xgboost as xgb
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
from sklearn.preprocessing import LabelEncoder
import joblib

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class FootDashModelTrainer:
    """Trains ML models for FootDash match prediction."""
    
    def __init__(self):
        self.model = None
        self.label_encoder = LabelEncoder()
        self.feature_names = []
        self.training_info = {}
        
    def fetch_training_data(self, api_url: str, auth_token: str, 
                          export_params: Optional[Dict] = None) -> Dict:
        """Fetch training data from FootDash API."""
        logger.info(f"Fetching training data from {api_url}")
        
        headers = {
            'Authorization': f'Bearer {auth_token}',
            'Content-Type': 'application/json'
        }
        
        # Default export parameters
        default_params = {
            'includeOngoing': False,
            'minMatchesPerTeam': 10,
            'format': 'json'
        }
        
        if export_params:
            default_params.update(export_params)
        
        try:
            response = requests.post(
                f"{api_url}/analytics/export/training-data",
                headers=headers,
                json=default_params,
                timeout=300  # 5 minute timeout for large exports
            )
            response.raise_for_status()
            
            data = response.json()
            logger.info(f"Fetched {len(data['data'])} training samples")
            logger.info(f"Date range: {data['metadata']['date_range']}")
            logger.info(f"Leagues: {data['metadata']['leagues']}")
            
            return data
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to fetch training data: {e}")
            raise
            
    def load_training_data(self, file_path: str) -> Dict:
        """Load training data from local file."""
        logger.info(f"Loading training data from {file_path}")
        
        with open(file_path, 'r') as f:
            data = json.load(f)
            
        logger.info(f"Loaded {len(data['data'])} training samples")
        return data
        
    def prepare_features(self, training_data: List[Dict]) -> Tuple[np.ndarray, np.ndarray]:
        """Prepare features and labels for training."""
        logger.info("Preparing features and labels...")
        
        df = pd.DataFrame(training_data)
        
        # Define feature columns (exclude identifiers and target)
        exclude_columns = [
            'match_id', 'home_team_id', 'away_team_id', 'league_id', 
            'season', 'match_date', 'outcome', 'home_recent_form', 'away_recent_form'
        ]
        
        feature_columns = [col for col in df.columns if col not in exclude_columns]
        self.feature_names = feature_columns
        
        # Prepare features
        X = df[feature_columns].values
        
        # Prepare labels
        y = self.label_encoder.fit_transform(df['outcome'])
        
        logger.info(f"Features shape: {X.shape}")
        logger.info(f"Labels shape: {y.shape}")
        logger.info(f"Classes: {self.label_encoder.classes_}")
        logger.info(f"Feature columns: {feature_columns}")
        
        # Handle any missing values
        X = np.nan_to_num(X, nan=0.0, posinf=0.0, neginf=0.0)
        
        return X, y
        
    def train_model(self, X: np.ndarray, y: np.ndarray, 
                   model_params: Optional[Dict] = None) -> Dict:
        """Train XGBoost model."""
        logger.info("Training XGBoost model...")
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )
        
        # Default model parameters
        default_params = {
            'objective': 'multi:softprob',
            'num_class': len(self.label_encoder.classes_),
            'n_estimators': 100,
            'max_depth': 6,
            'learning_rate': 0.1,
            'subsample': 0.8,
            'colsample_bytree': 0.8,
            'random_state': 42,
            'n_jobs': -1
        }
        
        if model_params:
            default_params.update(model_params)
            
        # Train model
        self.model = xgb.XGBClassifier(**default_params)
        self.model.fit(X_train, y_train)
        
        # Evaluate model
        train_pred = self.model.predict(X_train)
        test_pred = self.model.predict(X_test)
        
        train_accuracy = accuracy_score(y_train, train_pred)
        test_accuracy = accuracy_score(y_test, test_pred)
        
        # Cross-validation
        cv_scores = cross_val_score(self.model, X_train, y_train, cv=5)
        
        logger.info(f"Training accuracy: {train_accuracy:.4f}")
        logger.info(f"Test accuracy: {test_accuracy:.4f}")
        logger.info(f"CV accuracy: {cv_scores.mean():.4f} (+/- {cv_scores.std() * 2:.4f})")
        
        # Classification report
        class_names = self.label_encoder.classes_
        report = classification_report(y_test, test_pred, target_names=class_names)
        logger.info(f"Classification Report:\n{report}")
        
        # Feature importance
        feature_importance = dict(zip(self.feature_names, self.model.feature_importances_))
        top_features = sorted(feature_importance.items(), key=lambda x: x[1], reverse=True)[:10]
        
        logger.info("Top 10 most important features:")
        for feature, importance in top_features:
            logger.info(f"  {feature}: {importance:.4f}")
            
        # Store training information
        self.training_info = {
            'train_accuracy': train_accuracy,
            'test_accuracy': test_accuracy,
            'cv_accuracy_mean': cv_scores.mean(),
            'cv_accuracy_std': cv_scores.std(),
            'model_params': default_params,
            'feature_importance': feature_importance,
            'class_names': class_names.tolist(),
            'training_samples': len(X_train),
            'test_samples': len(X_test),
            'trained_at': datetime.now().isoformat(),
            'algorithm': 'XGBoost'
        }
        
        return {
            'train_accuracy': train_accuracy,
            'test_accuracy': test_accuracy,
            'cv_scores': cv_scores.tolist(),
            'feature_importance': feature_importance,
            'classification_report': report
        }
        
    def save_model(self, model_path: str, version: str = "1.0.0"):
        """Save trained model to file."""
        logger.info(f"Saving model to {model_path}")
        
        if self.model is None:
            raise ValueError("No trained model to save")
            
        # Prepare model data for saving
        model_data = {
            'model': self.model,
            'feature_names': self.feature_names,
            'label_encoder': self.label_encoder,
            'version': version,
            'algorithm': 'XGBoost',
            'accuracy': self.training_info.get('test_accuracy', 0.0),
            'training_info': self.training_info,
            'created_at': datetime.now().isoformat()
        }
        
        # Create directory if it doesn't exist
        os.makedirs(os.path.dirname(model_path), exist_ok=True)
        
        # Save model
        joblib.dump(model_data, model_path)
        logger.info(f"Model saved successfully")
        
    def generate_model_report(self, output_path: str):
        """Generate detailed training report."""
        if not self.training_info:
            raise ValueError("No training information available")
            
        report = {
            'model_summary': {
                'algorithm': 'XGBoost Multi-class Classifier',
                'version': '1.0.0',
                'trained_at': self.training_info['trained_at'],
                'training_samples': self.training_info['training_samples'],
                'test_samples': self.training_info['test_samples']
            },
            'performance_metrics': {
                'training_accuracy': self.training_info['train_accuracy'],
                'test_accuracy': self.training_info['test_accuracy'],
                'cross_validation_mean': self.training_info['cv_accuracy_mean'],
                'cross_validation_std': self.training_info['cv_accuracy_std']
            },
            'model_configuration': self.training_info['model_params'],
            'feature_importance': self.training_info['feature_importance'],
            'target_classes': self.training_info['class_names'],
            'feature_names': self.feature_names
        }
        
        with open(output_path, 'w') as f:
            json.dump(report, f, indent=2)
            
        logger.info(f"Model report saved to {output_path}")

def main():
    parser = argparse.ArgumentParser(description='Train FootDash ML prediction model')
    parser.add_argument('--api-url', default='http://localhost:4000', 
                       help='FootDash API base URL')
    parser.add_argument('--auth-token', help='JWT authentication token')
    parser.add_argument('--data-file', help='Path to local training data file')
    parser.add_argument('--output-dir', default='../prediction-model/models',
                       help='Output directory for trained model')
    parser.add_argument('--model-version', default='1.0.0',
                       help='Model version string')
    parser.add_argument('--seasons', nargs='+', help='Seasons to include (e.g., 2023 2024)')
    parser.add_argument('--leagues', nargs='+', type=int, help='League IDs to include')
    parser.add_argument('--min-matches', type=int, default=10,
                       help='Minimum matches per team')
    
    args = parser.parse_args()
    
    # Validate arguments
    if not args.auth_token and not args.data_file:
        logger.error("Either --auth-token or --data-file must be provided")
        sys.exit(1)
        
    # Initialize trainer
    trainer = FootDashModelTrainer()
    
    try:
        # Load training data
        if args.data_file:
            data = trainer.load_training_data(args.data_file)
        else:
            export_params = {
                'includeOngoing': False,
                'minMatchesPerTeam': args.min_matches
            }
            
            if args.seasons:
                export_params['seasons'] = args.seasons
            if args.leagues:
                export_params['leagues'] = args.leagues
                
            data = trainer.fetch_training_data(args.api_url, args.auth_token, export_params)
            
            # Save fetched data for future use
            data_file = os.path.join(args.output_dir, f'training_data_{datetime.now().strftime("%Y%m%d_%H%M%S")}.json')
            os.makedirs(os.path.dirname(data_file), exist_ok=True)
            with open(data_file, 'w') as f:
                json.dump(data, f, indent=2)
            logger.info(f"Training data saved to {data_file}")
        
        # Prepare features
        X, y = trainer.prepare_features(data['data'])
        
        # Train model
        results = trainer.train_model(X, y)
        
        # Save model
        model_file = os.path.join(args.output_dir, 'match_predictor.joblib')
        trainer.save_model(model_file, args.model_version)
        
        # Generate report
        report_file = os.path.join(args.output_dir, f'training_report_{datetime.now().strftime("%Y%m%d_%H%M%S")}.json')
        trainer.generate_model_report(report_file)
        
        logger.info("Training completed successfully!")
        logger.info(f"Model saved to: {model_file}")
        logger.info(f"Report saved to: {report_file}")
        logger.info(f"Test accuracy: {results['test_accuracy']:.4f}")
        
    except Exception as e:
        logger.error(f"Training failed: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()