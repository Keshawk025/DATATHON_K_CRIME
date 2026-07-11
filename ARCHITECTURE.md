# SYSTEM_ARCHITECTURE.md

# AI-Driven Crime Analytics & Visualization Platform

## System Architecture

**Hackathon:** Datathon 2026

**Challenge:** AI-Driven Crime Analytics & Visualization Platform

Version 1.0

---

# 1. Architecture Overview

The platform follows a modular client-server architecture consisting of:

- React Frontend
- FastAPI Backend
- PostgreSQL Database
- AI Service Layer
- Machine Learning Layer
- Analytics Engine

The system is designed for scalability, modularity, and rapid prototyping.

---

# 2. High-Level Architecture

```
                        +----------------------+
                        |      End Users       |
                        | Police / Analysts    |
                        +----------+-----------+
                                   |
                                   |
                      HTTPS Requests
                                   |
                +------------------v------------------+
                |         React Frontend              |
                | Dashboard • Maps • AI Chat • Graphs|
                +------------------+------------------+
                                   |
                           REST API Calls
                                   |
                +------------------v------------------+
                |          FastAPI Backend            |
                +------------------+------------------+
                                   |
      +-------------+--------------+--------------+-------------+
      |             |                             |             |
      |             |                             |             |
+-----v-----+ +-----v------+              +-------v------+ +----v-----+
| PostgreSQL| | AI Service |              | ML Service   | | File Store|
| Database  | | Gemini API |              | Scikit-learn | | Reports    |
+-----------+ +------------+              +--------------+ +-----------+
```

---

# 3. Technology Stack

## Frontend

- React
- TypeScript
- Tailwind CSS
- ShadCN UI
- React Router
- Axios
- React Query
- Recharts
- Leaflet
- Cytoscape.js

---

## Backend

- FastAPI
- SQLAlchemy
- Alembic
- Pydantic

---

## Database

- PostgreSQL

---

## AI Layer

- Gemini API

Functions

- FIR Summarization
- AI Chat
- Investigation Suggestions
- Insight Generation
- Report Generation

---

## ML Layer

Libraries

- Pandas
- NumPy
- Scikit-learn
- NetworkX

Models

- Random Forest
- Linear Regression
- DBSCAN
- KMeans

---

# 4. Frontend Architecture

```
src/

pages/
components/
layouts/
hooks/
services/
utils/
types/
assets/
```

Pages

- Login
- Dashboard
- Heatmap
- FIR Explorer
- Criminal Network
- Repeat Offenders
- AI Assistant
- Predictions
- Reports
- Settings

---

# 5. Backend Architecture

```
backend/

app/

api/
models/
schemas/
services/
database/
ml/
ai/
utils/
core/
```

---

# 6. Database Layer

Primary tables

- FIR
- Criminal
- Victim
- Vehicle
- Address
- Phone
- CrimeRelation
- Alerts
- CrimePrediction

---

# 7. AI Layer

Responsibilities

- Natural language understanding
- FIR summarization
- Investigation recommendations
- AI insights
- Report generation

Input

Crime records

↓

Prompt Builder

↓

Gemini

↓

Formatted JSON

↓

Frontend

---

# 8. Machine Learning Layer

Responsibilities

- Hotspot prediction
- Risk scoring
- Crime forecasting
- Crime clustering
- Pattern detection

Workflow

Historical Data

↓

Cleaning

↓

Feature Engineering

↓

Model Training

↓

Saved Model

↓

Prediction API

---

# 9. Analytics Engine

Responsible for

- Crime aggregation
- Trend calculations
- District statistics
- Repeat offender scoring
- Dashboard metrics

---

# 10. Criminal Network Engine

Uses NetworkX.

Builds graph using

- Shared FIR
- Shared Address
- Shared Vehicle
- Shared Phone
- Known Associates

Returns graph JSON.

---

# 11. Heatmap Engine

Input

Crime Locations

↓

Aggregation

↓

Density Calculation

↓

Risk Score

↓

Heatmap JSON

↓

Leaflet Map

---

# 12. Dashboard Flow

User

↓

Dashboard

↓

API

↓

Analytics Engine

↓

Database

↓

JSON

↓

Dashboard Widgets

---

# 13. AI Chat Flow

User Question

↓

Frontend

↓

FastAPI

↓

Prompt Builder

↓

Gemini

↓

Formatted Response

↓

Frontend

---

# 14. Prediction Flow

Historical Data

↓

Feature Engineering

↓

ML Model

↓

Prediction

↓

Risk Score

↓

Frontend

---

# 15. Report Generation Flow

Dashboard Data

+

AI Insights

+

Predictions

↓

Report Generator

↓

PDF

↓

Download

---

# 16. Authentication

Prototype Authentication

- Login Screen
- Mock User Session
- JWT-ready architecture
- Role placeholder

Roles

- Admin
- Officer
- Analyst

---

# 17. API Communication

Frontend

↓

REST API

↓

FastAPI

↓

Business Logic

↓

Database

↓

JSON Response

---

# 18. Error Handling

- Validation errors
- Missing data
- AI service unavailable
- Database failures
- Network timeout

Return standardized JSON errors.

---

# 19. Security (Prototype)

- Input validation
- SQL injection protection (ORM)
- Environment variables
- API key protection
- CORS configuration

---

# 20. Deployment Architecture

Frontend

↓

Vercel

Backend

↓

Render / Railway

Database

↓

PostgreSQL

AI

↓

Gemini API

---

# 21. Scalability

Future enhancements

- Redis caching
- Background workers
- WebSockets
- Microservices
- Vector database
- Streaming analytics
- Multi-region deployment

---

# 22. System Components

Frontend

- Dashboard
- Maps
- Charts
- Graphs
- AI Chat

Backend

- REST APIs
- Analytics Engine
- AI Engine
- ML Engine
- Report Generator

Database

- Crime Records
- FIRs
- Criminals
- Relationships

External Services

- Gemini API

---

# 23. Data Flow Summary

Crime Dataset

↓

PostgreSQL

↓

Analytics Engine

↓

REST APIs

↓

Frontend Dashboard

↓

User Interaction

↓

AI & ML Services

↓

Insights, Predictions, Reports

---

# 24. Architecture Goals

- Modular
- Maintainable
- Scalable
- AI-first
- Fast API responses
- Interactive visualizations
- Production-like prototype
- Easy to extend after the hackathon
