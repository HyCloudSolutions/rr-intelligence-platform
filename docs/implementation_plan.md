# Production ML Batch Job Architecture Plan

## Goal Description
Currently, the predictive [DailyRiskScore](file:///Users/simonadediran/Library/CloudStorage/OneDrive-Personal/aiprojects/rr-intelligence-platform/backend/src/models/core.py#106-125) values in the Director Dashboard are either seeded locally or generated instantaneously during CSV ingestion as a static placeholder. To transition to a fully mature production environment, we need a robust, automated nightly process that recalculates risk scores for *all* active establishments based on the latest inspection data, temporal risk decay, and neighborhood density factors.

This document outlines the architectural plan to implement this nightly ML batch job using **AWS Lambda** to minimize MVP costs, while strictly separating the business logic to ensure a completely trivial migration to AWS ECS Fargate if dataset sizes grow beyond Lambda's 15-minute execution limit.

## User Review Required
Please review the proposed architecture below. The primary advantage of this approach is that AWS Lambda charges purely by the millisecond of execution time, which keeps our baseline cloud compute costs near $0 while we scale the userbase, without sacrificing the enterprise "nightly recalculation" workflow.

## Proposed Changes

### 1. New Core ML Service Layer
We will introduce a dedicated ML processing module to the backend to recreate the **City of Chicago's open-source GLMNet predictive model** in Python (Scikit-Learn). 

### 1. Model Training & Evaluation (Local Jupyter Notebook)
Before updating the backend, we will develop and evaluate the models locally to find the best performer.

#### [NEW] `notebooks/train_global_model.ipynb`
- Download and preprocess the Chicago open dataset.
- Extract "Universal Features" (temporal decay, historical violations, facility type) to ensure portability to other jurisdictions.
- Train and compare **XGBoost** and **Random Forest** (via Scikit-Learn).
- Evaluate accuracy, precision, recall, and F1-score to select the best model.
- Export the winning model as a serialized file (e.g., `model.pkl` or `model.xgb`).

### 2. New Core ML Service Layer
We will introduce a dedicated ML module to the backend to execute predictions using the trained model.

#### [NEW] `backend/src/services/ml_pipeline.py`
- Loads the pre-trained `model.pkl` (produced by the Jupyter Notebook).
- Accepts a list of establishments and their historical data.
- Formats the data into the exact feature array expected by the model.
- Calculates dynamic risk probabilities (High/Medium/Low Risk Bands).
- **Explainability:** Extracts feature importances directly from the trained model to explain *why* an establishment received its score.

### 3. Lambda Entrypoint & Database Integration
We need a cloud-specific execution wrapper that fetches the data, triggers the ML pipeline, and saves the results back to the RDS database.

#### [NEW] `backend/jobs/lambda_nightly_scorer.py`
- Exposes a standard AWS Lambda `handler(event, context)` function.
- Connects to the AWS RDS production database via `SessionLocal`.
- Queries all active establishments across all tenants.
- Iterates through the establishments, passing their historical data to `ml_pipeline.py`.
- Performs a bulk upsert (insert or update) of [DailyRiskScore](file:///Users/simonadediran/Library/CloudStorage/OneDrive-Personal/aiprojects/rr-intelligence-platform/backend/src/models/core.py#106-125) records for the current date.
- Includes error handling and summary logging to AWS CloudWatch.

### 3. Serverless Deployment Infrastructure
To automate the deployment and execution, we will use the Serverless Application Model (SAM) or a dedicated deployment script for the Lambda function.

#### [NEW] `backend/scripts/deploy_lambda.sh`
- Zips the required Python dependencies and the `src/` directory.
- Creates or updates an AWS Lambda function (`restaurantrisk-nightly-ml-scorer`).
- Configures the Lambda function with necessary VPC settings to access the private RDS instance.
- Creates an AWS EventBridge Rule that triggers the Lambda function daily (e.g., `cron(0 6 * * ? *)` for 1:00 AM CST).

## Verification Plan

### Automated Tests
- Write a new unit test in `backend/tests/test_ml_pipeline.py` to ensure the risk scoring algorithm deterministically outputs expected scores and Risk Bands (High, Medium, Low) given mock establishment data.

### Manual Verification
1. Execute the `deploy_lambda.sh` script to push the code to AWS.
2. Open the AWS Console, navigate to the Lambda function, and manually invoke it via the "Test" button.
3. Review the CloudWatch logs to confirm it successfully processed the establishments and hit the database.
4. Verify via the Director Dashboard (`/director/queue`) that the queue successfully displays newly generated scores for the current date, overriding any older placeholder scores.
