import fastapi
import fastapi.middleware.cors
from pydantic import BaseModel
from typing import Literal
import numpy as np
from sklearn.ensemble import IsolationForest
import joblib
import os
from pathlib import Path
from collections import deque

app = fastapi.FastAPI()

app.add_middleware(
    fastapi.middleware.cors.CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Directory for storing user models
MODELS_DIR = Path("/tmp/models")
MODELS_DIR.mkdir(exist_ok=True)

# In-memory storage for user behavior samples
user_behavior_samples: dict[str, list[list[float]]] = {}

# Rolling buffer for anomaly scores (false positive reduction)
user_anomaly_buffers: dict[str, deque[float]] = {}
ANOMALY_BUFFER_SIZE = 5

# Minimum samples required before training a model
MIN_SAMPLES_FOR_TRAINING = 5


class BehaviorData(BaseModel):
    """User behavior data collected from frontend"""
    user_id: str
    typing_speed: float  # avg ms between keystrokes
    typing_speed_variance: float  # variance in typing rhythm
    avg_click_interval: float  # average time between clicks
    session_duration: float  # seconds since session start
    mouse_distance: float  # total mouse movement distance in pixels
    avg_scroll_velocity: float  # average scroll velocity


class PredictionResponse(BaseModel):
    """Response from the prediction endpoint"""
    anomaly_score: float
    risk_level: Literal["LOW", "MEDIUM", "HIGH"]
    action: Literal["ALLOW", "OTP_REQUIRED", "BIOMETRIC_REQUIRED"]
    status: Literal["learning", "active"]
    samples_collected: int
    model_trained: bool
    buffer_avg: float  # Average of rolling buffer scores


def extract_features(data: BehaviorData) -> list[float]:
    """Extract normalized feature vector from behavior data"""
    return [
        data.typing_speed,
        data.typing_speed_variance,
        data.avg_click_interval,
        data.session_duration,
        data.mouse_distance,
        data.avg_scroll_velocity,
    ]


def normalize_features(features: list[float]) -> np.ndarray:
    """Normalize features to [0, 1] range using reasonable bounds"""
    # Define reasonable bounds for each feature
    bounds = [
        (50, 500),      # typing_speed: 50-500ms
        (0, 50000),     # typing_speed_variance: 0-50000ms^2
        (100, 5000),    # avg_click_interval: 100-5000ms
        (1, 600),       # session_duration: 1-600 seconds (increased for continuous monitoring)
        (0, 100000),    # mouse_distance: 0-100000 pixels (increased for continuous monitoring)
        (0, 2000),      # avg_scroll_velocity: 0-2000 pixels/sec
    ]
    
    normalized = []
    for i, (value, (min_val, max_val)) in enumerate(zip(features, bounds)):
        # Clip and normalize
        clipped = max(min_val, min(max_val, value))
        normalized.append((clipped - min_val) / (max_val - min_val))
    
    return np.array(normalized)


def get_model_path(user_id: str) -> Path:
    """Get the path for a user's model file"""
    return MODELS_DIR / f"{user_id}.joblib"


def load_or_create_model(user_id: str) -> IsolationForest | None:
    """Load existing model or return None if not trained"""
    model_path = get_model_path(user_id)
    if model_path.exists():
        return joblib.load(model_path)
    return None


def train_model(user_id: str, samples: list[list[float]]) -> IsolationForest:
    """Train an Isolation Forest model on user behavior samples"""
    X = np.array([normalize_features(s) for s in samples])
    
    model = IsolationForest(
        n_estimators=100,
        contamination=0.1,
        random_state=42,
        max_samples='auto'
    )
    model.fit(X)
    
    # Save the model
    model_path = get_model_path(user_id)
    joblib.dump(model, model_path)
    
    return model


def compute_anomaly_score(model: IsolationForest, features: list[float]) -> float:
    """
    Compute anomaly score from Isolation Forest.
    Returns a score between 0 and 1, where higher = more anomalous.
    """
    normalized = normalize_features(features).reshape(1, -1)
    
    # decision_function returns negative scores for anomalies
    raw_score = model.decision_function(normalized)[0]
    
    # Convert to 0-1 range (typical decision_function range is roughly -0.5 to 0.5)
    # More negative = more anomalous
    anomaly_score = 1 - (raw_score + 0.5)  # Map [-0.5, 0.5] to [1, 0]
    anomaly_score = max(0, min(1, anomaly_score))  # Clip to [0, 1]
    
    return anomaly_score


def get_rolling_average(user_id: str, new_score: float) -> float:
    """
    Maintain rolling buffer of anomaly scores and return average.
    This reduces false positives by smoothing out single anomalous readings.
    """
    if user_id not in user_anomaly_buffers:
        user_anomaly_buffers[user_id] = deque(maxlen=ANOMALY_BUFFER_SIZE)
    
    buffer = user_anomaly_buffers[user_id]
    buffer.append(new_score)
    
    # Return average of buffer
    return sum(buffer) / len(buffer)


def determine_risk_level(
    anomaly_score: float
) -> tuple[Literal["LOW", "MEDIUM", "HIGH"], Literal["ALLOW", "OTP_REQUIRED", "BIOMETRIC_REQUIRED"]]:
    """Determine risk level and action based on anomaly score"""
    # Using specified thresholds: <0.4 LOW, 0.4-0.7 MEDIUM, >0.7 HIGH
    if anomaly_score < 0.4:
        return "LOW", "ALLOW"
    elif anomaly_score < 0.7:
        return "MEDIUM", "OTP_REQUIRED"
    else:
        return "HIGH", "BIOMETRIC_REQUIRED"


@app.get("/health")
async def health() -> dict[str, str]:
    """Health check endpoint"""
    return {"status": "ok"}


@app.post("/predict", response_model=PredictionResponse)
async def predict(data: BehaviorData) -> PredictionResponse:
    """
    Analyze user behavior and return risk assessment.
    
    For new users or users with few samples, we use conservative scoring (learning mode).
    Once enough samples are collected, we train an Isolation Forest model.
    Uses rolling buffer of last 5 scores to reduce false positives.
    """
    user_id = data.user_id
    features = extract_features(data)
    
    # Initialize user sample storage if needed
    if user_id not in user_behavior_samples:
        user_behavior_samples[user_id] = []
    
    # Add current behavior to samples
    user_behavior_samples[user_id].append(features)
    samples_collected = len(user_behavior_samples[user_id])
    
    # Try to load existing model
    model = load_or_create_model(user_id)
    
    # Train model if we have enough samples and no model exists
    if samples_collected >= MIN_SAMPLES_FOR_TRAINING and model is None:
        model = train_model(user_id, user_behavior_samples[user_id])
    
    # Retrain periodically with new data (every 10 new samples after initial training)
    if model is not None and samples_collected > MIN_SAMPLES_FOR_TRAINING:
        if (samples_collected - MIN_SAMPLES_FOR_TRAINING) % 10 == 0:
            # Use last 50 samples for retraining to adapt to user behavior changes
            recent_samples = user_behavior_samples[user_id][-50:]
            model = train_model(user_id, recent_samples)
    
    # If we still don't have a model, use learning mode (allow with low score)
    if model is None:
        return PredictionResponse(
            anomaly_score=0.1,
            risk_level="LOW",
            action="ALLOW",
            status="learning",
            samples_collected=samples_collected,
            model_trained=False,
            buffer_avg=0.1
        )
    
    # Compute anomaly score using the trained model
    raw_anomaly_score = compute_anomaly_score(model, features)
    
    # Get rolling average to reduce false positives
    buffer_avg = get_rolling_average(user_id, raw_anomaly_score)
    
    # Use buffer average for risk determination
    risk_level, action = determine_risk_level(buffer_avg)
    
    return PredictionResponse(
        anomaly_score=round(raw_anomaly_score, 3),
        risk_level=risk_level,
        action=action,
        status="active",
        samples_collected=samples_collected,
        model_trained=True,
        buffer_avg=round(buffer_avg, 3)
    )


@app.post("/reset/{user_id}")
async def reset_user(user_id: str) -> dict[str, str]:
    """Reset user behavior data and model (for testing)"""
    # Clear in-memory samples
    if user_id in user_behavior_samples:
        del user_behavior_samples[user_id]
    
    # Clear anomaly buffer
    if user_id in user_anomaly_buffers:
        del user_anomaly_buffers[user_id]
    
    # Delete model file
    model_path = get_model_path(user_id)
    if model_path.exists():
        os.remove(model_path)
    
    return {"status": "reset", "user_id": user_id}
