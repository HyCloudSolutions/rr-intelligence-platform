# Onboarding a New Jurisdiction 🏙️

Follow this guide to onboard a new city or tenant onto the RestaurantRisk Intelligence Platform.

## Phase 1: Infrastructure & Authentication (AWS Cognito)

1. **Create User Pool Groups**:
   Each tenant requires two scoped groups in the Cognito User Pool:
   - `Tenant_{TENANT_ID}_Director`
   - `Tenant_{TENANT_ID}_Inspector`
   *(Replace `{TENANT_ID}` with the UUID you will generate in Phase 2)*.

2. **Provision Users**:
   - Create users in AWS Cognito.
   - Assign them to one of the groups above.
   - **Crucial**: Set the `custom:tenant_id` attribute for the user to the matching `{TENANT_ID}` UUID. This is how the backend enforces data isolation.

---

## Phase 2: Database Provisioning (PostgreSQL)

Run the following SQL to register the new tenant in the backend:

```sql
INSERT INTO tenants (id, name, contact_email, tier, created_at, updated_at)
VALUES (
    '{TENANT_ID}', 
    'City of New York', 
    'admin@nyc.gov', 
    'Enterprise', 
    NOW(), 
    NOW()
);
```

---

## Phase 3: Data Ingestion

1. **Acquire Source Data**:
   Obtain a CSV of restaurant inspections for the new jurisdiction.
   
2. **Handle Schema Variations**:
   If the CSV columns differ from the Standard/SF format, update the parser in:
   `backend/src/api/routes/ingestion.py`

3. **Upload Data**:
   Log in as the new **Director** and use the **Data Ingestion** tab to upload the CSV.

4. **Trigger AI Training**:
   Run the batch scoring process to generate risk scores for the new entities:
   ```bash
   cd backend
   python scripts/batch_score.py --tenant-id {TENANT_ID}
   ```

---

## Phase 4: Verification

1. **Dashboard Check**: Log in as the new Director and verify that KPIs (Active Establishments, High Risk Today) are populated.
2. **Isolation Test**: Ensure that searching for an establishment in City A does not return results when logged in as City B.
3. **Identity Check**: Confirm the city name appears in the sidebar (Desktop) and header (Mobile).

---

## 🚀 Next Steps for Platform Maturity

To move from MVP to a production-ready SaaS, we recommend the following:
1. **Automated Onboarding SDK**: Replace manual SQL/AWS steps with a `SuperAdmin` dashboard or CLI tool.
2. **Data Connector Library**: Pre-build connectors for common Open Data portals (Socrata, Accela).
3. **Enhanced History Tab**: Finalize the "My Recent Inspections" logic to pull from the live database.
4. **CI/CD Pipeline**: Deploy automated unit tests for tenant isolation logic to prevent regressions during future onboarding.
