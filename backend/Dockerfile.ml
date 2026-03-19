# Dockerfile.ml
# Lightweight container image for the Nightly ML Risk Scorer Lambda function.
# Uses the official AWS Lambda Python runtime base image for compatibility.

FROM public.ecr.aws/lambda/python:3.11

# Install system dependencies for psycopg2 (Postgres driver)
RUN yum install -y gcc postgresql-devel && yum clean all

# Upgrade pip first to avoid build errors, then install ML dependencies
COPY requirements-ml.txt .
RUN pip install --upgrade pip && pip install --no-cache-dir -r requirements-ml.txt

# Copy the application source code
COPY src/ ${LAMBDA_TASK_ROOT}/src/
COPY jobs/ ${LAMBDA_TASK_ROOT}/jobs/

# Set the Lambda handler to point to our nightly scorer
CMD ["jobs.lambda_nightly_scorer.handler"]
