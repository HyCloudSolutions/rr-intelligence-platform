# Technical Research: 001-predictive-inspection-queue

**Feature**: [spec.md](../../specs/001-predictive-inspection-queue/spec.md)
**Status**: Completed
**Date**: 2026-03-05

## 1. Machine Learning Explainability (Captum)

**Decision**: Use Captum's Feature Ablation or Integrated Gradients to extract the top 3 risk factors for the Daily Risk Score.
**Rationale**: The MVP and Constitution strictly mandate "plain-language explainability (no black boxes)". Captum integrates seamlessly with PyTorch (the mandated ML framework) to attribute importance to input features.
**Alternatives considered**: SHAP (good but less native to PyTorch than Captum); LIME (can be unstable for certain tabular datasets).

## 2. Nightly ETL and Scoring Pipeline

**Decision**: Use AWS EventBridge cron to trigger an AWS ECS Fargate task that runs the PyTorch batch scoring job, pulling from RDS and writing predictions back to RDS.
**Rationale**: The Constitution mandates avoiding custom infrastructure and favors stateless, managed services (Fargate). Batch scoring is explicitly preferred over real-time inference in the Constitution.
**Alternatives considered**: AWS Lambda (may hit the 15-minute timeout for a large batch scoring job with heavy PyTorch dependencies); AWS SageMaker Pipelines (more complex/expensive for a simple nightly batch MVP).

## 3. Mobile-Responsive Inspector Interface

**Decision**: Build the queue and outcome logging screens using Next.js 14 Server Actions with standard HTML forms progressively enhanced by React.
**Rationale**: The MVP mandates Next.js 14 and specifically calls out that Inspectors might face "zero cellular connectivity in the field." While true offline support (PWA/Service Workers) is complex for MVP, using standard forms with local state caching provides the highest resilience in low-connectivity environments over heavy client-side API fetching.
**Alternatives considered**: React Single Page App (requires heavy initial load, worse for spotty connections); React Native (out of scope for web MVP).

## 4. Local End-to-End Testing

**Decision**: Provide a `docker-compose.yml` for local development that spins up PostgreSQL, a local mock AWS environment (LocalStack for S3/Cognito mocking if needed), the FastAPI backend, and the Next.js frontend.
**Rationale**: The user explicitly requested: "Keep in mind that I should be a able to run app local e2e on my machine first". Docker Compose is the industry standard for this.
**Alternatives considered**: Running bare metal (prone to "works on my machine" issues); fully remote dev environments.
