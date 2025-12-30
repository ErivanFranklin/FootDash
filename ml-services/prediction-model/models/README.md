# ML Prediction Service Models Directory

This directory contains trained machine learning models for FootDash predictions.

## Model Files

- `match_predictor.joblib` - Main XGBoost model for match outcome predictions
- `model_metadata.json` - Model version and training information

## Model Versioning

Models are versioned using semantic versioning (MAJOR.MINOR.PATCH):
- MAJOR: Breaking changes in features or architecture
- MINOR: New features or significant improvements
- PATCH: Bug fixes and minor improvements

## Training Data

Models are trained on historical match data including:
- Team form and performance metrics
- Head-to-head statistics
- Goals scored/conceded averages
- League and venue information
- Match outcomes (win/draw/loss)

## Model Updates

To update the model:
1. Train new model with updated data
2. Save with appropriate version number
3. Test against validation dataset
4. Update model path in service configuration
5. Restart ML service to load new model

## Fallback Strategy

If no ML model is available, the service automatically falls back to the statistical algorithm used in the main FootDash backend.