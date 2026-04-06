# cuOPT EV Routing Frontend

**OCI AI Accelerator Pack** | Enterprise Route Optimization powered by NVIDIA cuOPT & Oracle Cloud Infrastructure

A production-ready Vehicle Routing Problem (VRP) solution combining GPU-accelerated optimization with AI-powered insights, real-time traffic integration, and weather-aware routing.

---

## Overview

cuOPT EV Routing Frontend is an enterprise-grade field service optimization platform designed for logistics, delivery, and mobile workforce management. Built on **NVIDIA cuOPT NIM** running on **Oracle Kubernetes Engine (OKE)**, it delivers millisecond-level route optimization for thousands of stops.

### Key Benefits

| Benefit | Impact |
|---------|--------|
| Travel Distance Reduction | 10-25% |
| Optimization Speed | 1000+ stops in seconds |
| Jobs/Technician/Day | 3.2 to 4.0+ improvement |
| Annual Savings Potential | Up to $7.7M (fleet-wide) |

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
- Real-time route visualization on **Google Maps** and **Leaflet/OpenStreetMap**
- Fleet configuration with job type mix
- Benchmark scenario loading (50 to 5000 stops)
- CSV import/export support
- Dark/Light map themes

### Field Service Metrics
- **Jobs per Technician per Day** tracking with baseline comparison
- **Productive Time %** calculation (job time vs drive time)
- **Daily/Annual Savings** projections
- Drive Time vs Job Time breakdown visualization

### AI Chat Assistant
- Natural language route optimization via **LlamaStack** (OpenAI-compatible)
- Example: *"Optimize 50 stops with 5 vehicles in London"*
- Weather-aware recommendations
- Business impact analysis in responses

### Weather Integration
- **OpenWeatherMap** current conditions overlay
- 5-day forecast display
- Route impact scoring (delays, visibility factors)
- Severe weather alerts
- Mock data fallback when no API key is configured

### Configuration Management
- Multi-country support (UK, US, Germany, France, Australia)
- City-specific map centering and localization
- Currency, date format, and timezone settings
- Scenario presets and job type customization

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
| **AI/GenAI** | LlamaStack (OpenAI-compatible `/v1/responses`) |
| **Weather** | OpenWeatherMap API |
| **Testing** | Vitest, Testing Library, Supertest |
| **Linting** | ESLint (TypeScript + flat config) |
| **Pre-commit** | Husky |
| **Container** | Docker (multi-stage Alpine build, Nginx + Node) |
| **Orchestration** | Oracle Kubernetes Engine (OKE) |
| **Registry** | OCI Container Registry (OCIR) |
| **CI/CD** | GitHub Actions |

---

## Quick Start

### Prerequisites

- Node.js 20+
- npm 10+

### Local Development

```bash
# Clone the repository
git clone git@github.com:oci-ai-incubations/cuopt-ev-routing-frontend.git
cd cuopt-ev-routing-frontend

# Install dependencies (also sets up Husky pre-commit hooks)
npm install

# Configure environment
cp .env.example .env
# Edit .env with your API keys (see Environment Configuration below)

# Start development server (frontend + backend concurrently)
npm start
```

**Frontend:** http://localhost:5173 | **Backend API:** http://localhost:3001

### Docker Build

```bash
# Build the image
docker build -f appdeploy/Dockerfile -t cuopt-frontend:latest .

# Run locally
docker run -p 80:80 -p 3001:3001 \
  -e CUOPT_ENDPOINT=https://your-cuopt-endpoint \
  cuopt-frontend:latest
```

### OKE Deployment

See [OKE_DEPLOYMENT_GUIDE.md](./OKE_DEPLOYMENT_GUIDE.md) for full Kubernetes deployment instructions. The Kubernetes manifests are in [`appdeploy/k8s/`](./appdeploy/k8s/).

```bash
# Tag and push to OCIR
docker tag cuopt-frontend:latest \
  iad.ocir.io/<namespace>/corrino-devops-repository:cuopt-interactive-frontend-latest
docker push iad.ocir.io/<namespace>/corrino-devops-repository:cuopt-interactive-frontend-latest

# Deploy to OKE
kubectl apply -f appdeploy/k8s/
```

---

## Environment Configuration

Create a `.env` file in the project root. The Express backend reads these at startup:

```env
# cuOPT endpoint
CUOPT_ENDPOINT=https://cuopt-2-cuopt.137-131-27-21.nip.io

# LlamaStack endpoint (OpenAI-compatible)
LLAMASTACK_ENDPOINT=http://localhost:8321
LLAMASTACK_MODEL=                          # optional default model

# Google Maps (served to frontend via /api/config)
GOOGLE_MAPS_API_KEY=your_google_maps_key

# OpenWeatherMap (omit for mock data)
OPENWEATHERMAP_API_KEY=your_openweather_key

# Authentication (defaults to admin/admin)
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin

# Server port (default 3001)
PORT=3001
```

---

## Project Structure

```
cuopt-ev-routing-frontend/
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
│   │   └── shared/          # Reusable UI components (Button, Card, Modal, etc.)
│   ├── data/                # Benchmark scenarios & location data
│   ├── store/               # Zustand state management
│   ├── types/               # TypeScript type definitions
│   └── utils/               # Helper functions & formatters
├── server/
│   ├── app.js               # Express application (exported for testing)
│   ├── index.js              # Server entrypoint (listen)
│   └── __tests__/            # Backend unit tests (Supertest)
├── appdeploy/
│   ├── Dockerfile            # Multi-stage production build
│   ├── docker-compose.yml    # Local Docker Compose
│   ├── docker-entrypoint.sh  # Container startup script
│   ├── nginx.conf            # Nginx reverse proxy config
│   └── k8s/                  # Kubernetes manifests for OKE
├── .github/
│   ├── workflows/ci.yml      # GitHub Actions CI/CD pipeline
│   ├── pull_request_template.md
│   └── ISSUE_TEMPLATE/       # Bug report & feature request templates
├── .husky/pre-commit         # Pre-commit hook (lint, test, audit)
├── eslint.config.js          # ESLint flat config (TS frontend + JS backend)
├── vitest.config.ts          # Frontend test config (jsdom)
├── server/vitest.config.js   # Backend test config (node)
├── vite.config.ts            # Vite bundler config
├── tsconfig.json             # TypeScript config
├── tailwind.config.js        # Tailwind CSS config
└── package.json
```

---

## API Reference

The Express backend (port 3001) proxies requests to external services. See [docs/API.md](./docs/API.md) for full request/response examples.

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Server health check |
| `/api/auth/login` | POST | Authenticate user |
| `/api/config` | GET | Runtime configuration (Maps API key) |
| `/api/cuopt/health` | GET | cuOPT service health |
| `/api/cuopt/request` | POST | Submit optimization request |
| `/api/cuopt/solution/:reqId` | GET | Fetch optimization solution |
| `/api/cuopt-health` | GET | cuOPT connectivity check |
| `/api/models` | GET | List available LLM models |
| `/api/genai/chat` | POST | AI chat completion |
| `/api/genai/health` | GET | LlamaStack connectivity check |
| `/api/weather/current` | GET | Current weather conditions |
| `/api/weather/forecast` | GET | 5-day weather forecast |
| `/api/weather/alerts` | GET | Weather alerts |
| `/api/weather/health` | GET | Weather service status |

---

## Development

### Available Scripts

| Script | Description |
|--------|-------------|
| `npm start` | Start frontend + backend concurrently |
| `npm run dev` | Start Vite dev server only |
| `npm run server` | Start Express backend only |
| `npm run build` | TypeScript check + Vite production build |
| `npm run lint` | ESLint (frontend + backend) |
| `npm run lint:fix` | ESLint with auto-fix |
| `npm run test:frontend` | Run frontend tests |
| `npm run test:backend` | Run backend tests |
| `npm run test:coverage` | Frontend tests with coverage report |
| `npm run test:backend:coverage` | Backend tests with 80% coverage gate |
| `npm run audit:security` | npm audit (high severity) |
| `npm run ci` | Run all checks (lint, tests, audit) |

### CI Pipeline

The CI runs automatically on PRs and merges to `main` via GitHub Actions:

1. **lint-frontend** — ESLint + TypeScript build check
2. **lint-backend** — ESLint on server code
3. **test-frontend** — Vitest with coverage report
4. **test-backend** — Vitest + Supertest with 80% coverage gate
5. **security-scan** — `npm audit --audit-level=high`
6. **build-and-push** — Docker image build and push to OCIR (on passing checks)

Image tag format: `iad.ocir.io/<namespace>/corrino-devops-repository:cuopt-interactive-frontend-<sha>`

A **Husky pre-commit hook** runs lint, tests, and audit locally before every commit.

### Writing Tests

- **Frontend tests** go in `src/__tests__/*.test.tsx` using Testing Library
- **Backend tests** go in `server/__tests__/*.test.js` using Supertest
- Mock all external API calls — tests must not depend on external services
- See [`.claude/rules/testing.md`](./.claude/rules/testing.md) for conventions

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
   │ Nginx + Node  │         │ Nginx + Node  │         │               │
   └───────────────┘         └───────────────┘         └───────────────┘
           │                          │                          │
           └──────────────────────────┼──────────────────────────┘
                                      │
                    ┌─────────────────▼───────────────────┐
                    │        External Services            │
                    │  • Google Maps API                  │
                    │  • OpenWeatherMap API               │
                    │  • LlamaStack (GenAI)               │
                    └─────────────────────────────────────┘
```

Each frontend pod runs **Nginx** (serving the built React app on port 80) and an **Express server** (API proxy on port 3001). Nginx reverse-proxies `/api/*` requests to the Express server.

---

## Usage Guide

### 1. Login
Access the application URL and enter credentials (default: `admin`/`admin`). Sessions persist for 24 hours.

### 2. Configure Region (Admin Tab)
- Select Country and City
- Set working hours and fleet defaults
- Choose scenario preset

### 3. Load Stops (Dashboard)
- **Benchmark Scenarios**: Pre-configured test cases (50-5000 stops)
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
| UK | GBP | Kilometers | London | Europe/London |
| US | USD | Miles | New York | America/New_York |
| Germany | EUR | Kilometers | Berlin | Europe/Berlin |
| France | EUR | Kilometers | Paris | Europe/Paris |
| Australia | AUD | Kilometers | Sydney | Australia/Sydney |

---

## Troubleshooting

### cuOPT Connection Failed
```bash
# Test endpoint connectivity
curl $CUOPT_ENDPOINT/cuopt/health
```

### LlamaStack Not Responding
```bash
# Check model availability
curl $LLAMASTACK_ENDPOINT/v1/models
```

### Port Already in Use
```bash
lsof -ti:5173 | xargs kill -9  # Vite dev server
lsof -ti:3001 | xargs kill -9  # Express backend
```

### Docker Build Fails
```bash
# Ensure you're building from the repo root with the correct Dockerfile path
docker build -f appdeploy/Dockerfile -t cuopt-frontend:latest .
```

---

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines on opening issues and submitting pull requests. All contributors must sign the [Oracle Contributor Agreement](https://oca.opensource.oracle.com).

## Security

Please report security vulnerabilities following the process in [SECURITY.md](./SECURITY.md). Do **not** open a public GitHub issue for security vulnerabilities.

## License

Copyright (c) 2024 Oracle and/or its affiliates. Licensed under the [Universal Permissive License (UPL) v1.0](./LICENSE.md).

---

<p align="center">
  <strong>Built with NVIDIA cuOPT | Powered by Oracle Cloud Infrastructure</strong>
</p>
