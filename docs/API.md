# API Reference

The Express backend runs on port 3001 and proxies requests to external services (cuOPT, LlamaStack, OpenWeatherMap). In production, Nginx reverse-proxies `/api/*` to the Express server so all traffic goes through port 80.

The Vite dev server proxies `/api` to `http://localhost:3001` automatically.

---

## Health

### `GET /health`

Server health check.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-04-03T12:00:00.000Z"
}
```

---

## Authentication

### `POST /api/auth/login`

Authenticate a user. Credentials are validated against `ADMIN_USERNAME` and `ADMIN_PASSWORD` environment variables (default: `admin`/`admin`).

**Request:**
```json
{
  "username": "admin",
  "password": "admin"
}
```

**Success (200):**
```json
{
  "success": true,
  "username": "admin"
}
```

**Failure (401):**
```json
{
  "success": false,
  "error": "Invalid username or password"
}
```

---

## Runtime Config

### `GET /api/config`

Returns runtime configuration that the frontend needs but cannot be baked in at build time.

**Response:**
```json
{
  "googleMapsApiKey": "AIza..."
}
```

---

## cuOPT Optimization

All cuOPT endpoints proxy to the upstream cuOPT NIM service configured via `CUOPT_ENDPOINT`.

### `GET /api/cuopt/health`

Check cuOPT service health.

**Success (200):** Proxied response from cuOPT.

**Failure (503):**
```json
{
  "status": "disconnected",
  "error": "connection refused"
}
```

### `GET /api/cuopt-health`

Simplified connectivity check — returns a structured status.

**Connected (200):**
```json
{
  "status": "connected",
  "endpoint": "https://cuopt-2-cuopt.example.com"
}
```

**Disconnected (503):**
```json
{
  "status": "disconnected",
  "error": "fetch failed"
}
```

### `POST /api/cuopt/request`

Submit a route optimization request to cuOPT.

**Request:**
```json
{
  "cost_matrix_data": {
    "data": { "0": [[0, 10, 15], [10, 0, 12], [15, 12, 0]] }
  },
  "travel_time_matrix_data": {
    "data": { "0": [[0, 600, 900], [600, 0, 720], [900, 720, 0]] }
  },
  "task_data": {
    "task_locations": [1, 2],
    "demand": [[1], [1]],
    "service_times": [900, 1200]
  },
  "fleet_data": {
    "vehicle_locations": [[0, 0]],
    "capacities": [[10]]
  },
  "solver_config": {
    "time_limit": 5
  }
}
```

**Success (200):**
```json
{
  "reqId": "abc123-def456"
}
```

**Failure (500):**
```json
{
  "error": "cuOPT request failed",
  "message": "connection refused"
}
```

### `GET /api/cuopt/solution/:reqId`

Fetch the solution for a previously submitted optimization request.

**Parameters:**
- `:reqId` — The request ID returned by `POST /api/cuopt/request`

**Success (200):**
```json
{
  "response": {
    "solver_infeasible_response": null,
    "solution_list": [
      {
        "vehicle_id": 0,
        "route": [0, 2, 1, 0],
        "arrival_stamp": [0, 900, 2100, 3300],
        "type": ["Depot", "Task", "Task", "Depot"]
      }
    ],
    "num_vehicles": 1
  }
}
```

**Pending:** Returns partial status; poll until `response` is present.

---

## GenAI / LlamaStack

All GenAI endpoints proxy to the upstream LlamaStack service configured via `LLAMASTACK_ENDPOINT`. The backend transforms the frontend's message format to the LlamaStack `/v1/responses` format.

### `GET /api/models`

List available LLM models, filtered to `model_type: "llm"`.

**Success (200):**
```json
{
  "data": [
    {
      "id": "meta-llama/Llama-3.2-3B-Instruct",
      "custom_metadata": { "model_type": "llm" }
    }
  ]
}
```

**Failure (503):**
```json
{
  "error": "Failed to fetch models",
  "message": "connection refused"
}
```

### `POST /api/genai/chat`

Send a chat message to the LLM. The backend transforms the request from the frontend format to LlamaStack's `/v1/responses` format and extracts the response text.

**Request:**
```json
{
  "chatRequest": {
    "messages": [
      {
        "role": "SYSTEM",
        "content": [{ "type": "TEXT", "text": "You are a route optimization assistant." }]
      },
      {
        "role": "USER",
        "content": [{ "type": "TEXT", "text": "Optimize 50 stops with 5 vehicles in London" }]
      }
    ],
    "model": "meta-llama/Llama-3.2-3B-Instruct"
  }
}
```

**Transformed LlamaStack request (internal):**
```json
{
  "input": [
    { "role": "user", "content": "Optimize 50 stops with 5 vehicles in London" }
  ],
  "model": "meta-llama/Llama-3.2-3B-Instruct",
  "instructions": "You are a route optimization assistant.",
  "stream": false
}
```

**Success (200):**
```json
{
  "chatResponse": {
    "text": "I'll help you optimize 50 stops...",
    "choices": null,
    "finishReason": "stop"
  },
  "usageMetadata": {
    "inputTokenCount": 42,
    "outputTokenCount": 156
  }
}
```

**Failure (500):**
```json
{
  "error": "LlamaStack error",
  "message": "connection refused"
}
```

### `GET /api/genai/health`

Check LlamaStack connectivity by querying `/v1/models`.

**Connected (200):**
```json
{
  "status": "connected",
  "endpoint": "http://localhost:8321",
  "defaultModel": ""
}
```

**Disconnected (503):**
```json
{
  "status": "disconnected",
  "endpoint": "http://localhost:8321",
  "error": "fetch failed"
}
```

---

## Weather

All weather endpoints proxy to the OpenWeatherMap API. If `OPENWEATHERMAP_API_KEY` is not set, endpoints return mock data instead of failing.

### `GET /api/weather/current`

Get current weather conditions for a location.

**Query parameters:**
- `lat` (required) — Latitude
- `lng` (required) — Longitude

**Success (200):** Returns OpenWeatherMap format (or mock data if no API key):
```json
{
  "coord": { "lat": 51.5, "lon": -0.1 },
  "weather": [
    { "id": 801, "main": "Clouds", "description": "few clouds", "icon": "02d" }
  ],
  "main": {
    "temp": 14.2,
    "feels_like": 12.2,
    "humidity": 72,
    "pressure": 1015
  },
  "wind": { "speed": 5.3, "gust": 8.1 },
  "clouds": { "all": 55 },
  "visibility": 10000,
  "name": "London"
}
```

**Missing parameters (400):**
```json
{
  "error": "lat and lng parameters required"
}
```

### `GET /api/weather/forecast`

Get 5-day weather forecast.

**Query parameters:**
- `lat` (required) — Latitude
- `lng` (required) — Longitude

**Success (200):** Returns OpenWeatherMap forecast format. Returns `{ "list": [] }` if no API key is configured.

### `GET /api/weather/alerts`

Get active weather alerts for a location.

**Response (200):**
```json
{
  "alerts": []
}
```

> Note: Weather alerts require a One Call API subscription. Currently returns empty.

### `GET /api/weather/health`

Check weather service status.

**With API key (200):**
```json
{
  "status": "configured",
  "provider": "OpenWeatherMap"
}
```

**Without API key (200):**
```json
{
  "status": "mock_mode",
  "message": "No API key configured, using mock data"
}
```

---

## Error Handling

All proxy endpoints follow a consistent error pattern:

- **Upstream reachable but returns error**: The upstream HTTP status code and body are forwarded.
- **Upstream unreachable (network error)**: Returns `500` or `503` with:
  ```json
  {
    "error": "<service> error",
    "message": "<error description>"
  }
  ```
- **Missing required parameters**: Returns `400` with a descriptive error message.

---

## CORS

CORS is enabled for all origins in development. In production, Nginx serves the frontend and proxies `/api/*` to the Express server on `127.0.0.1:3001`, so CORS is not a factor.

## Rate Limiting

No rate limiting is applied at the Express layer. Use Nginx or OCI WAF for production rate limiting.
