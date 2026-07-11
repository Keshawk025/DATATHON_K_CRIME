# DATABASE_SCHEMA.md

# AI-Driven Crime Analytics & Visualization Platform

## Database Schema

**Hackathon:** Datathon 2026

**Challenge:** AI-Driven Crime Analytics & Visualization Platform

Version 1.0

---

# 1. Database Overview

The prototype uses **PostgreSQL** as the primary relational database.

The schema is designed to support:

- Crime Analytics
- FIR Management
- Criminal Profiles
- Relationship Analysis
- Crime Hotspots
- AI Insights
- Predictive Analytics
- Investigation Reports

---

# 2. Entity Relationship Diagram (ERD)

```text
District
    │
    │ 1
    │
    │ N
FIR ------------------ CrimeType
 │
 │
 │ N
 │
CrimePerson
 │
 ├──────── Criminal
 │
 ├──────── Victim
 │
 ├──────── Address
 │
 ├──────── Vehicle
 │
 └──────── Phone

Criminal
    │
    │
CrimeRelation
    │
    │
Related Criminal

FIR
 │
 ├── Alerts
 ├── AI_Insights
 ├── Predictions
 └── Reports
```

---

# 3. Tables

## District

| Column | Type |
|----------|------|
| id | UUID |
| name | VARCHAR |
| state | VARCHAR |
| latitude | DECIMAL |
| longitude | DECIMAL |
| population | INTEGER |

Primary Key

- id

---

## CrimeType

| Column | Type |
|----------|------|
| id | UUID |
| name | VARCHAR |
| description | TEXT |

Primary Key

- id

---

## FIR

| Column | Type |
|----------|------|
| id | UUID |
| fir_number | VARCHAR |
| district_id | UUID |
| crime_type_id | UUID |
| occurrence_date | DATE |
| reported_date | DATE |
| latitude | DECIMAL |
| longitude | DECIMAL |
| location | TEXT |
| description | TEXT |
| status | VARCHAR |
| severity | INTEGER |
| created_at | TIMESTAMP |

Primary Key

- id

Foreign Keys

- district_id
- crime_type_id

---

## Criminal

| Column | Type |
|----------|------|
| id | UUID |
| full_name | VARCHAR |
| gender | VARCHAR |
| age | INTEGER |
| aliases | TEXT |
| risk_score | FLOAT |
| repeat_offender | BOOLEAN |
| created_at | TIMESTAMP |

Primary Key

- id

---

## Victim

| Column | Type |
|----------|------|
| id | UUID |
| full_name | VARCHAR |
| gender | VARCHAR |
| age | INTEGER |

Primary Key

- id

---

## CrimePerson

Bridge table connecting FIRs with individuals.

| Column | Type |
|----------|------|
| id | UUID |
| fir_id | UUID |
| criminal_id | UUID |
| victim_id | UUID |
| role | VARCHAR |

Primary Key

- id

Foreign Keys

- fir_id
- criminal_id
- victim_id

---

## Vehicle

| Column | Type |
|----------|------|
| id | UUID |
| registration_number | VARCHAR |
| vehicle_type | VARCHAR |
| model | VARCHAR |
| color | VARCHAR |

Primary Key

- id

---

## Phone

| Column | Type |
|----------|------|
| id | UUID |
| phone_number | VARCHAR |
| owner_name | VARCHAR |

Primary Key

- id

---

## Address

| Column | Type |
|----------|------|
| id | UUID |
| street | TEXT |
| city | VARCHAR |
| district | VARCHAR |
| state | VARCHAR |
| postal_code | VARCHAR |
| latitude | DECIMAL |
| longitude | DECIMAL |

Primary Key

- id

---

## CrimeRelation

Stores links between criminals.

| Column | Type |
|----------|------|
| id | UUID |
| source_criminal_id | UUID |
| target_criminal_id | UUID |
| relation_type | VARCHAR |
| confidence_score | FLOAT |

Primary Key

- id

Foreign Keys

- source_criminal_id
- target_criminal_id

---

## Alert

| Column | Type |
|----------|------|
| id | UUID |
| title | VARCHAR |
| alert_type | VARCHAR |
| district_id | UUID |
| severity | VARCHAR |
| description | TEXT |
| created_at | TIMESTAMP |

---

## Prediction

| Column | Type |
|----------|------|
| id | UUID |
| district_id | UUID |
| prediction_type | VARCHAR |
| predicted_value | FLOAT |
| confidence | FLOAT |
| prediction_date | DATE |

---

## AIInsight

| Column | Type |
|----------|------|
| id | UUID |
| fir_id | UUID |
| insight_type | VARCHAR |
| summary | TEXT |
| recommendation | TEXT |
| generated_at | TIMESTAMP |

---

## Report

| Column | Type |
|----------|------|
| id | UUID |
| report_name | VARCHAR |
| report_type | VARCHAR |
| generated_by | VARCHAR |
| generated_at | TIMESTAMP |
| file_path | TEXT |

---

# 4. Relationships

| Parent | Child | Relationship |
|---------|-------|--------------|
| District | FIR | One-to-Many |
| CrimeType | FIR | One-to-Many |
| FIR | CrimePerson | One-to-Many |
| Criminal | CrimePerson | One-to-Many |
| Victim | CrimePerson | One-to-Many |
| Criminal | CrimeRelation | One-to-Many |
| District | Alert | One-to-Many |
| District | Prediction | One-to-Many |
| FIR | AIInsight | One-to-Many |

---

# 5. Indexes

Create indexes on:

- fir_number
- occurrence_date
- district_id
- crime_type_id
- repeat_offender
- risk_score
- latitude
- longitude
- prediction_date

Composite indexes

- district_id + occurrence_date
- district_id + crime_type_id
- occurrence_date + crime_type_id

---

# 6. Constraints

- FIR number must be unique
- Registration number must be unique
- Phone number must be unique
- Risk score between 0 and 100
- Severity between 1 and 5
- Confidence between 0 and 1

---

# 7. Sample Record Counts (Prototype)

| Table | Records |
|--------|---------|
| District | 31 |
| CrimeType | 15 |
| FIR | 10,000 |
| Criminal | 1,500 |
| Victim | 5,000 |
| CrimeRelation | 4,000 |
| Vehicle | 2,500 |
| Phone | 3,500 |
| Alert | 200 |
| Prediction | 500 |
| AIInsight | 10,000 |

---

# 8. Database Design Goals

- Normalized relational schema
- Fast analytical queries
- Efficient joins
- Optimized for dashboard aggregation
- Easy integration with AI and ML services
- Scalable for future enhancements
