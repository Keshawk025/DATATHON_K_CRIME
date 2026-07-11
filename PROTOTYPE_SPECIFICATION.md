# AI-Driven Crime Analytics & Visualization Platform
## Prototype Scope (Datathon 2026)

---

# Goal

Build an AI-powered crime analytics platform that transforms fragmented crime records into actionable intelligence for Karnataka State Police.

The prototype should demonstrate:

- AI-powered insights
- Interactive dashboards
- Crime hotspot visualization
- Criminal network analysis
- Repeat offender tracking
- Predictive analytics
- Natural language querying

---

# Tech Stack

## Frontend

- React
- TypeScript
- TailwindCSS
- ShadCN UI
- Leaflet.js (Maps)
- Recharts (Charts)
- Cytoscape.js (Network Graph)

---

## Backend

- FastAPI
- SQLAlchemy
- PostgreSQL
- Pandas
- NumPy

---

## AI

- Gemini API
- Scikit-learn
- NetworkX

---

# Pages

## 1. Login

Simple authentication screen.

---

## 2. Dashboard

Contains

- Total Crimes
- Total FIRs
- Active Cases
- Solved Cases
- Repeat Offenders
- Hotspot Districts

Charts

- Crimes by Month
- Crimes by District
- Crime Category Distribution
- Arrest Trends
- Crime Growth Rate

Filters

- Date
- District
- Crime Type
- Status

---

## 3. Crime Heatmap

Interactive Karnataka Map

Features

- Crime Density
- Cluster Visualization
- Heat Layers
- District Boundaries
- Click District

Popup

- Crime Count
- Top Crimes
- Risk Score
- Trend

---

## 4. Criminal Network Analysis

Interactive graph showing

Nodes

- Criminal
- Victim
- Vehicle
- Mobile Number
- Address
- Gang

Edges

- Associate
- Family
- Vehicle Shared
- Phone Shared
- FIR Shared

Capabilities

- Zoom
- Search Criminal
- Expand Network
- Highlight Connections

---

## 5. Repeat Offender Tracking

Search

Results

- Criminal Profile
- Previous FIRs
- Arrest History
- Timeline
- Known Associates
- Risk Score

---

## 6. Predictive Analytics

Cards

- High Risk Districts
- Predicted Hotspots
- Weekly Forecast
- Crime Trend Prediction

Charts

- Forecast Graph
- Risk Score Distribution

---

## 7. AI Investigation Assistant

Chat Interface

Example Queries

Show cyber crimes in Mysuru

Which district has highest robbery?

Show repeat offenders in Bengaluru.

Explain hotspot around Whitefield.

Generate district crime summary.

Compare crime trends between Mysuru and Bengaluru.

Generate investigation insights.

---

## 8. AI Insights Dashboard

Automatically generated

Examples

Burglary increased 18%.

Cybercrime rising in Bengaluru Urban.

Vehicle theft shifted towards eastern districts.

Three repeat offenders connected across six FIRs.

---

## 9. FIR Explorer

Search FIR

Filters

- District
- Crime Type
- Date
- FIR Number

View

- FIR Details
- Persons
- Vehicles
- Evidence
- AI Summary

---

## 10. Alerts

Live Cards

High Risk Area

New Crime Pattern

Crime Spike

Repeat Offender Detected

Gang Activity

---

# AI Modules

---

## Module 1

Crime Summary Generator

Input

FIR

Output

Summary

Important entities

Investigation suggestions

---

## Module 2

Natural Language Search

User asks

Show all burglary cases in Mysuru.

System converts to structured query.

---

## Module 3

Crime Pattern Detection

Detect

Seasonal Crimes

Daily Trends

Location Patterns

Crime Clusters

---

## Module 4

Hotspot Detection

Input

Historical Crimes

Output

Hotspots

Risk Score

---

## Module 5

Risk Prediction

Predict

High Risk Areas

Crime Probability

Severity

Confidence Score

---

## Module 6

Repeat Offender Detection

Calculate

Offence Frequency

Crime Interval

Severity

Overall Risk

---

## Module 7

Criminal Network Builder

Automatically connect

Shared Phones

Shared Vehicles

Shared Addresses

Common FIR

Known Associates

---

# Machine Learning

Train only lightweight models

## Hotspot Prediction

Random Forest

or

XGBoost

---

## Crime Forecast

Linear Regression

or

Prophet

---

## Risk Classification

Random Forest

---

## Crime Clustering

DBSCAN

KMeans

---

## Network Analysis

NetworkX

---

# Database Tables

## FIR

- id
- fir_number
- district
- crime_type
- date
- latitude
- longitude
- description

---

## Criminal

- id
- name
- age
- gender
- risk_score

---

## Victim

- id
- name

---

## Vehicle

- id
- vehicle_number

---

## Address

- id
- location

---

## Phone

- id
- phone_number

---

## CrimeRelation

Stores graph connections

---

# Dashboard Widgets

✔ Total Crimes

✔ Crime Trend

✔ Heatmap

✔ Crime Distribution

✔ Top Crime Types

✔ District Ranking

✔ Active Alerts

✔ Repeat Offenders

✔ High Risk Districts

✔ Investigation Queue

✔ AI Insights

---

# APIs

GET /dashboard

GET /heatmap

GET /crime-trends

GET /districts

GET /criminal/{id}

GET /repeat-offenders

GET /hotspots

GET /alerts

POST /chat

POST /predict

POST /network-analysis

POST /fir-summary

---

# Visualizations

Bar Chart

Pie Chart

Area Chart

Line Chart

Heat Map

Cluster Map

Network Graph

Timeline

Risk Gauge

Forecast Graph

---

# Demo Flow

1.

Login

↓

2.

Dashboard

↓

3.

District Filter

↓

4.

Heatmap

↓

5.

Open Hotspot

↓

6.

View Criminal Network

↓

7.

Search Repeat Offender

↓

8.

Ask AI

↓

9.

View Predictions

↓

10.

Generate Investigation Report

---

# Stretch Features

- Kannada support
- Voice search
- FIR PDF upload
- AI-generated investigation reports
- Explainable AI (Why this hotspot?)
- Real-time alert simulation
- Export reports (PDF)
- Role-based dashboards (Officer, Inspector, Admin)

---

# Sample Demo Dataset

Include approximately:

- 10,000 FIR records
- 1,500 criminals
- 500 repeat offenders
- 30 districts
- 15 crime categories
- 2 years of historical data
- Latitude/Longitude for mapping
- Relationship data for network graph

---

# Prototype Deliverables

- ✅ Responsive web application
- ✅ AI-powered dashboard
- ✅ Interactive crime heatmap
- ✅ Criminal relationship graph
- ✅ Repeat offender analysis
- ✅ Predictive hotspot detection
- ✅ AI investigation assistant
- ✅ Trend & anomaly detection
- ✅ District-level drill-downs
- ✅ Investigation report generation
- ✅ Clean UI suitable for live demonstration

---

# Success Criteria

The prototype should clearly demonstrate all capabilities expected in the challenge:

- Interactive dashboards & geospatial maps
- Crime hotspot detection
- District-level drilldowns
- Trend alerts & anomaly detection
- Network & link analysis of criminals
- Repeat offender tracking
- Socio-economic crime correlation (can be simulated)
- Predictive risk scoring
- AI/ML-based pattern detection
- Natural language interaction powered by an LLM

The focus should be on an end-to-end, polished prototype with working AI-assisted analytics rather than production-scale infrastructure.
