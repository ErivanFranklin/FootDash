#!/bin/bash
# FootDash ML Model Training Script
# Usage: ./train_model.sh [OPTIONS]

set -e

# Default values
API_URL="http://localhost:4000"
OUTPUT_DIR="../prediction-model/models"
MIN_MATCHES=10
MODEL_VERSION="1.0.0"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to show usage
show_usage() {
    cat << EOF
FootDash ML Model Training Script

Usage: $0 [OPTIONS]

Options:
  --api-url URL           FootDash API base URL (default: http://localhost:4000)
  --auth-token TOKEN      JWT authentication token for API access
  --data-file FILE        Path to local training data JSON file
  --output-dir DIR        Output directory for trained model (default: ../prediction-model/models)
  --model-version VER     Model version string (default: 1.0.0)
  --seasons SEASONS       Comma-separated list of seasons (e.g., "2023,2024")
  --leagues LEAGUES       Comma-separated list of league IDs (e.g., "39,140,78")
  --min-matches NUM       Minimum matches per team (default: 10)
  --help                  Show this help message

Examples:
  # Train with API data (requires authentication)
  $0 --auth-token "your-jwt-token" --seasons "2023,2024" --leagues "39,140,78"
  
  # Train with local data file
  $0 --data-file "training_data.json"
  
  # Train with specific parameters
  $0 --auth-token "token" --min-matches 15 --model-version "1.1.0"

Note: Either --auth-token or --data-file must be provided.
EOF
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --api-url)
            API_URL="$2"
            shift 2
            ;;
        --auth-token)
            AUTH_TOKEN="$2"
            shift 2
            ;;
        --data-file)
            DATA_FILE="$2"
            shift 2
            ;;
        --output-dir)
            OUTPUT_DIR="$2"
            shift 2
            ;;
        --model-version)
            MODEL_VERSION="$2"
            shift 2
            ;;
        --seasons)
            SEASONS="$2"
            shift 2
            ;;
        --leagues)
            LEAGUES="$2"
            shift 2
            ;;
        --min-matches)
            MIN_MATCHES="$2"
            shift 2
            ;;
        --help)
            show_usage
            exit 0
            ;;
        *)
            log_error "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Validate required arguments
if [[ -z "${AUTH_TOKEN}" && -z "${DATA_FILE}" ]]; then
    log_error "Either --auth-token or --data-file must be provided"
    show_usage
    exit 1
fi

# Check if Python and required packages are available
log_info "Checking Python environment..."

if ! command -v python3 &> /dev/null; then
    log_error "python3 is not installed or not in PATH"
    exit 1
fi

# Check for required packages
python3 -c "
import sys
required_packages = ['pandas', 'numpy', 'xgboost', 'scikit-learn', 'joblib', 'requests']
missing_packages = []

for package in required_packages:
    try:
        __import__(package)
    except ImportError:
        missing_packages.append(package)

if missing_packages:
    print(f'Missing packages: {missing_packages}')
    print('Please install them with: pip install pandas numpy xgboost scikit-learn joblib requests')
    sys.exit(1)
else:
    print('All required packages are installed')
" || {
    log_error "Required Python packages are missing"
    exit 1
}

log_success "Python environment check passed"

# Create output directory if it doesn't exist
mkdir -p "${OUTPUT_DIR}"

# Prepare Python command
PYTHON_ARGS=(
    "--api-url" "${API_URL}"
    "--output-dir" "${OUTPUT_DIR}"
    "--model-version" "${MODEL_VERSION}"
    "--min-matches" "${MIN_MATCHES}"
)

if [[ -n "${AUTH_TOKEN}" ]]; then
    PYTHON_ARGS+=("--auth-token" "${AUTH_TOKEN}")
fi

if [[ -n "${DATA_FILE}" ]]; then
    PYTHON_ARGS+=("--data-file" "${DATA_FILE}")
fi

if [[ -n "${SEASONS}" ]]; then
    # Convert comma-separated string to space-separated for Python
    SEASONS_ARRAY=(${SEASONS//,/ })
    PYTHON_ARGS+=("--seasons" "${SEASONS_ARRAY[@]}")
fi

if [[ -n "${LEAGUES}" ]]; then
    # Convert comma-separated string to space-separated for Python
    LEAGUES_ARRAY=(${LEAGUES//,/ })
    PYTHON_ARGS+=("--leagues" "${LEAGUES_ARRAY[@]}")
fi

# Run training
log_info "Starting model training..."
log_info "API URL: ${API_URL}"
log_info "Output directory: ${OUTPUT_DIR}"
log_info "Model version: ${MODEL_VERSION}"
log_info "Minimum matches per team: ${MIN_MATCHES}"

if [[ -n "${SEASONS}" ]]; then
    log_info "Seasons: ${SEASONS}"
fi

if [[ -n "${LEAGUES}" ]]; then
    log_info "Leagues: ${LEAGUES}"
fi

# Change to script directory
cd "$(dirname "$0")"

# Run Python training script
python3 train_model.py "${PYTHON_ARGS[@]}" || {
    log_error "Model training failed"
    exit 1
}

log_success "Model training completed successfully!"
log_info "Check ${OUTPUT_DIR} for the trained model and training report"

# List output files
if [[ -f "${OUTPUT_DIR}/match_predictor.joblib" ]]; then
    log_success "Model file: ${OUTPUT_DIR}/match_predictor.joblib"
fi

# Find the most recent training report
LATEST_REPORT=$(ls -t "${OUTPUT_DIR}"/training_report_*.json 2>/dev/null | head -n1)
if [[ -n "${LATEST_REPORT}" ]]; then
    log_success "Training report: ${LATEST_REPORT}"
fi

log_info "To use the new model, restart the ML prediction service"