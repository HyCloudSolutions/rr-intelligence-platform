# B2B SaaS Architecture & Scalability

The RestaurantRisk Intelligence Platform has been purposefully engineered from day one with a **multi-tenant B2B SaaS architecture** in mind. Designing it to be "sellable" to different municipalities, counties, or states was a core architectural decision, outlined in our project constitution.

Here is how the current setup seamlessly flows into a commercial SaaS application:

### 1. Built-In Multi-Tenancy (Row-Level Security)
Every core database model (`Establishment`, `InspectionResult`, `DailyRiskScore`) requires a **`tenant_id`** UUID. 
*   **How it works**: When a city (e.g., Chicago) signs up, they become a single "Tenant." Every piece of data they upload or generate is strictly tagged with their `tenant_id`. 
*   **The Result**: When a user logs in, the backend middleware extracts their `tenant_id` from their authentication token and mathematically prevents them from viewing another city's data. This strict isolation is a mandatory requirement for selling software to government entities.

### 2. Role-Based Access Control (RBAC) via AWS Cognito
Our setup delegates identity to AWS Cognito, sorting users into distinct roles (`inspector`, `director`).
*   **How it works**: A new municipality buys a license. You create an Admin account for that municipality. That Admin can then invite their staff, assigning them to the `director` group (sees the dashboard) or `inspector` group (sees the queue). 
*   **The Result**: You are selling "seats" or structured workflows. You can price the software based on the number of Inspector seats a county needs.

### 3. Localized Machine Learning Models
Rather than a global, one-size-fits-all model, the architecture supports tenant-specific training.
*   **How it works**: The current `batch_score.py` pipeline iterates per `tenant_id`.
*   **The Result**: What causes a critical health violation in snowy Chicago might be different from humid Miami. As a SaaS provider, you can sell "Localized AI." The system learns the specific operational patterns of the purchasing health department and generates predictive scores tailored specifically to their jurisdiction.

### 4. Cloud-Native Scalability (AWS Fargate + Vercel)
The chosen tech stack (Next.js frontend, FastAPI backend, PostgreSQL) is strictly stateless and cloud-native.
*   **How it works**: If you sign 10 new counties next month, you don't need to manually configure new servers. AWS ECS Fargate automatically spins up more Python containers to handle the nightly ML scoring batches in parallel. Vercel automatically scales the React frontend globally at the edge.
*   **The Result**: Very low operational overhead. As your MRR (Monthly Recurring Revenue) scales, your infrastructure scales elastically to meet it without manual intervention.

### 5. Automated Onboarding (The Ingestion Pipeline)
The foundational data ingestion pipeline maps directly to the CSV upload API (`/director/ingestion`).
*   **How it works**: A new county buys the software. They upload a messy CSV of their last 3 years of inspections to the ingestion portal. The backend parses it, standardizes it, and seeds their specific tenant database.
*   **The Result**: "Time-to-Value" is rapid. Within 24-hours of signing a contract, a new health department can see their historical data mapped into the predictive dashboard.

## Summary: The SaaS Business Model
Because of these architectural choices, the platform is perfectly positioned to sell as a tiered enterprise product:

*   **Tier 1 (Small City)**: Basic inspector queue, manual CSV uploads.
*   **Tier 2 (Large County)**: Director analytics dashboards, automated nightly API integrations with their legacy systems.
*   **Tier 3 (State / Enterprise)**: Cross-jurisdiction reporting, dedicated machine learning model training per sub-county. 

Essentially, the foundation is completely ready to support a commercial scale-out.
