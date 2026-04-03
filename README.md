# cuOPT Route Optimizer

**OCI AI Accelerator Pack** | Enterprise Route Optimization powered by NVIDIA cuOPT & Oracle Cloud Infrastructure

A production-ready Vehicle Routing Problem (VRP) solution combining GPU-accelerated optimization with AI-powered insights, real-time traffic integration, and weather-aware routing.

---

## Overview

cuOPT Route Optimizer is an enterprise-grade field service optimization platform designed for logistics, delivery, and mobile workforce management. Built on **NVIDIA cuOPT NIM** running on **Oracle Kubernetes Engine (OKE)**, it delivers millisecond-level route optimization for thousands of stops.

### Key Benefits

| Benefit | Impact |
|---------|--------|
| Travel Distance Reduction | 10-25% |
| Optimization Speed | 1000+ stops in seconds |
| Jobs/Technician/Day | 3.2 to 4.0+ improvement |
| Annual Savings Potential | Up to £7.7M (fleet-wide) |

---

## Features

### Route Optimization Engine
- **NVIDIA cuOPT** GPU-accelerated VRP solver
- Capacitated Vehicle Routing Problem (CVRP) support
- Time window constraints
- Home-start / Return-to-depot routing modes
- Parallel cluster processing for large datasets
- Revenue-based job prioritization

### Interactive Dashboard
- Real-time route visualization on **Google Maps**
- Fleet configuration with job type mix
- Benchmark scenario loading (50 to 5000 stops)
- CSV import/export support
- Dark/Light map themes

### Field Service Metrics
- **Jobs per Technician per Day** tracking with baseline comparison
- **Productive Time %** calculation (job time vs drive time)
- **Daily/Annual Savings** projections
- Drive Time vs Job Time breakdown visualization
- Industry-specific KPI dashboards (Belron configuration)

### AI Chat Assistant
- Natural language route optimization via **OCI Generative AI**
- Example: *"Optimize 50 stops with 5 vehicles in London"*
- Weather-aware recommendations
- Business impact analysis in responses

### Weather Integration
- **OpenWeatherMap** current conditions overlay
- 5-day forecast display
- Route impact scoring (delays, visibility factors)
- Severe weather alerts

### Configuration Management
- Multi-country support (UK, US, Germany, France, Australia)
- City-specific map centering and localization
- Currency, date format, and timezone settings
- Scenario presets (Generic, Belron Field Service)
- Job type customization with revenue values

---

## Technology Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18, TypeScript, Vite |
| **Styling** | Tailwind CSS |
| **State Management** | Zustand |
| **Maps** | Google Maps API, Leaflet/OpenStreetMap |
| **Backend** | Express.js (Node.js 20) |
| **Optimization** | NVIDIA cuOPT NIM |
| **AI/GenAI** | OCI Generative AI (Cohere Command) |
| **Weather** | OpenWeatherMap API |
| **Container** | Docker (multi-stage Alpine build) |
| **Orchestration** | Oracle Kubernetes Engine (OKE) |
| **Registry** | Oracle Cloud Infrastructure Registry (OCIR) |

---

## Quick Start

### Prerequisites

- Node.js 20+
- Docker
- OCI CLI configured (`~/.oci/config`)
- kubectl with OKE cluster access
- API Keys:
  - Google Maps API Key
  - OpenWeatherMap API Key
  - OCI GenAI compartment access

### Local Development

```bash
# Clone the repository
git clone <repository-url>
cd CuOPT-front-end-deploy-v2

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your API keys

# Start development server
npm run dev
```

**Open in browser:** http://localhost:5173

### Docker Build

```bash
# Build the image
docker build -f appdeploy/Dockerfile -t cuopt-frontend:latest .

# Run locally
docker run -p 80:80 -p 3001:3001 cuopt-frontend:latest
```

### OKE Deployment

```bash
# Tag for OCIR
docker tag cuopt-frontend:latest phx.ocir.io/<namespace>/cuoptpoc:cuopt-frontend-v2

# Push to OCIR
docker push phx.ocir.io/<namespace>/cuoptpoc:cuopt-frontend-v2

# Update deployment
kubectl set image deployment/cuopt-frontend \
  cuopt-frontend=phx.ocir.io/<namespace>/cuoptpoc:cuopt-frontend-v2 \
  -n cuopt

# Verify rollout
kubectl rollout status deployment/cuopt-frontend -n cuopt
```

---

## Environment Configuration

Create a `.env` file with the following variables:

```env
# cuOPT API
VITE_CUOPT_API_URL=https://cuopt-2-cuopt.137-131-27-21.nip.io

# Google Maps
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_key

# OpenWeatherMap
VITE_WEATHER_API_KEY=your_openweather_key

# OCI GenAI
VITE_OCI_GENAI_ENDPOINT=https://inference.generativeai.us-phoenix-1.oci.oraclecloud.com
VITE_OCI_COMPARTMENT_ID=your_compartment_id
VITE_OCI_GENAI_MODEL_ID=your_model_ocid
```

---

## Project Structure

```
CuOPT-front-end-deploy-v2/
├── src/
│   ├── api/                 # API clients (cuOPT, GenAI, Weather)
│   ├── components/
│   │   ├── Admin/           # Configuration settings page
│   │   ├── Auth/            # Login screen
│   │   ├── Chat/            # AI assistant interface
│   │   ├── Dashboard/       # Main dashboard (Input, Results panels)
│   │   ├── Map/             # Google Maps & Leaflet components
│   │   ├── Metrics/         # Performance & Impact charts
│   │   ├── Weather/         # Weather panel
│   │   └── shared/          # Reusable UI components
│   ├── data/                # Benchmark scenarios & location data
│   ├── store/               # Zustand state management
│   ├── types/               # TypeScript definitions
│   └── utils/               # Helper functions & formatters
├── server/                  # Express API proxy server
├── appdeploy/               # Docker & Nginx configuration
├── public/                  # Static assets
├── .env                     # Environment configuration
└── package.json
```

---

## API Endpoints

### Express Proxy Server (Port 3001)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/api/cuopt/solve` | POST | Submit optimization request |
| `/api/cuopt-health` | GET | cuOPT health check |
| `/api/weather/:lat/:lng` | GET | Get weather data |
| `/api/genai/chat` | POST | AI chat completion |
| `/api/genai/health` | GET | GenAI health check |

### cuOPT Request Format

```json
{
  "cost_matrix_data": { "data": { "0": [[...]] } },
  "travel_time_matrix_data": { "data": { "0": [[...]] } },
  "task_data": {
    "task_locations": [0, 1, 2, ...],
    "demand": [[1], [1], [1], ...],
    "service_times": [0, 15, 20, ...]
  },
  "fleet_data": {
    "vehicle_locations": [[0, 0], [0, 0], ...],
    "capacities": [[100], [100], ...]
  },
  "solver_config": {
    "time_limit": 5
  }
}
```

---

## Performance Benchmarks

### cuOPT Solve Times (A10G GPU)

| Stops | Vehicles | Payload Size | Solve Time |
|-------|----------|--------------|------------|
| 50 | 5 | 0.1 MB | <1s |
| 200 | 10 | 1.5 MB | 2-3s |
| 1,000 | 20 | 37 MB | 5-10s |
| 2,500 | 50 | 230 MB | 15-30s |
| 5,000 | 100 | 922 MB | 60-120s |

---

## Belron Field Service Configuration

Pre-configured metrics for glass repair/replacement scenarios:

### Baseline Metrics

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Jobs/Tech/Day | 3.2 | 4.0+ | +25% |
| Productive Time | 65% | 75%+ | +15% |
| Daily Cost Savings | - | £500+ | - |
| Annual Savings | - | £7.7M | - |

### Job Types

| Type | Duration | Revenue | Color |
|------|----------|---------|-------|
| Chip Repair | 45 min | £85 | Green |
| Windshield Replacement | 90 min | £350 | Orange |
| ADAS Recalibration | 75 min | £180 | Purple |
| Maintenance | 60 min | £150 | Pink |
| Installation | 120 min | £450 | Cyan |

---

## Deployment Architecture

```
                    ┌─────────────────────────────────────┐
                    │         OCI Load Balancer           │
                    └─────────────────┬───────────────────┘
                                      │
                    ┌─────────────────▼───────────────────┐
                    │       Nginx Ingress Controller      │
                    └─────────────────┬───────────────────┘
                                      │
           ┌──────────────────────────┼──────────────────────────┐
           │                          │                          │
   ┌───────▼───────┐         ┌───────▼───────┐         ┌───────▼───────┐
   │ cuopt-frontend│         │ cuopt-frontend│         │  cuOPT NIM    │
   │   Pod (x2)    │         │   Pod (x2)    │         │ (GPU Worker)  │
   └───────────────┘         └───────────────┘         └───────────────┘
           │                          │                          │
           └──────────────────────────┼──────────────────────────┘
                                      │
                    ┌─────────────────▼───────────────────┐
                    │        External Services            │
                    │  • Google Maps API                  │
                    │  • OpenWeatherMap API               │
                    │  • OCI Generative AI                │
                    └─────────────────────────────────────┘
```

---

## Usage Guide

### 1. Login
Access the application URL and enter credentials. Sessions persist for 24 hours.

### 2. Configure Region (Configuration Tab)
- Select Country and City
- Set working hours and fleet defaults
- Choose scenario preset (Generic or Belron)

### 3. Load Stops (Route Optimizer Dashboard)
- **Benchmark Scenarios**: Pre-configured test cases
- **Generate Random**: Create stops within service radius
- **CSV Import**: Upload custom stop data

### 4. Configure Fleet
- Number of vehicles/technicians
- Capacity per vehicle
- Job type distribution sliders
- Service time defaults

### 5. Run Optimization
- **Run Optimization**: Single-cluster solving
- **Run Parallel**: Geographic clustering for large datasets

### 6. Analyze Results
- **Map**: Interactive route visualization with traffic
- **Routes Panel**: Vehicle assignments and stop sequences
- **Weather Tab**: Conditions impact on routes
- **Impact Tab**: Business metrics and savings projections
- **Performance Tab**: Solve time benchmarks

### 7. AI Assistant
Natural language queries:
- *"Optimize 100 delivery stops with 8 vans"*
- *"What's the weather impact on today's routes?"*
- *"How many jobs can each technician complete?"*

---

## Regional Support

| Country | Currency | Units | Default City | Timezone |
|---------|----------|-------|--------------|----------|
| UK | GBP (£) | Kilometers | London | Europe/London |
| US | USD ($) | Miles | New York | America/New_York |
| Germany | EUR (€) | Kilometers | Berlin | Europe/Berlin |
| France | EUR (€) | Kilometers | Paris | Europe/Paris |
| Australia | AUD ($) | Kilometers | Sydney | Australia/Sydney |

---

## Troubleshooting

### OCI Client Not Initialized
```bash
# Verify OCI config exists
cat ~/.oci/config

# Reconfigure if needed
oci setup config
```

### cuOPT Connection Failed
```bash
# Test endpoint connectivity
curl https://cuopt-2-cuopt.137-131-27-21.nip.io/cuopt/health
```

### Port Already in Use
```bash
lsof -ti:5173 | xargs kill -9
lsof -ti:3001 | xargs kill -9
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| v2.1 | Mar 24, 2026 | Configuration tab, Operational Impact panel, AI metrics integration |
| v2.0 | Mar 20, 2026 | Belron job types, revenue tracking, home-start routing |
| v1.0 | Mar 15, 2026 | Initial release with core optimization features |

---

## Support

**Team:** Oracle AI Center of Excellence (CoE)

For technical support, feature requests, or bug reports, contact the AI CoE team.

---

## License

Copyright (c) 2026 Oracle Corporation. All rights reserved.

This software is provided as part of the **OCI AI Accelerator** program.

---

<p align="center">
  <strong>Built with NVIDIA cuOPT | Powered by Oracle Cloud Infrastructure</strong>
</p>
