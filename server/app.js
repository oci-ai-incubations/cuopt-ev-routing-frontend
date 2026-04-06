import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env from parent directory (project root)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ============ Authentication ============
const adminUsername = process.env.ADMIN_USERNAME || 'admin';
const adminPassword = process.env.ADMIN_PASSWORD || 'admin';

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (username === adminUsername && password === adminPassword) {
    res.json({ success: true, username });
  } else {
    res.status(401).json({ success: false, error: 'Invalid username or password' });
  }
});

// ============ Runtime Config ============
// Serves runtime configuration to the frontend (for values that can't be baked in at build time)
app.get('/api/config', (req, res) => {
  res.json({
    googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY || '',
  });
});

// ============ cuOPT Configuration ============
const cuoptEndpoint = process.env.CUOPT_ENDPOINT || 'https://cuopt-2-cuopt.137-131-27-21.nip.io';

// cuOPT health check
app.get('/api/cuopt/health', async (req, res) => {
  try {
    console.log('[cuOPT] Health check...');
    const response = await fetch(`${cuoptEndpoint}/cuopt/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    const data = await response.text();
    console.log('[cuOPT] Health response:', response.status);
    res.status(response.status).send(data);
  } catch (error) {
    console.error('[cuOPT] Health error:', error.message);
    res.status(503).json({ status: 'disconnected', error: error.message });
  }
});

// cuOPT submit request
app.post('/api/cuopt/request', async (req, res) => {
  try {
    console.log('[cuOPT] Submitting optimization request...');
    console.log('[cuOPT] Payload keys:', Object.keys(req.body));
    console.log('[cuOPT] Fleet data:', JSON.stringify(req.body.fleet_data, null, 2));
    const response = await fetch(`${cuoptEndpoint}/cuopt/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    });
    const data = await response.json();
    console.log('[cuOPT] Submit response:', response.status, data);
    res.status(response.status).json(data);
  } catch (error) {
    console.error('[cuOPT] Submit error:', error.message);
    res.status(500).json({ error: 'cuOPT request failed', message: error.message });
  }
});

// cuOPT get solution
app.get('/api/cuopt/solution/:reqId', async (req, res) => {
  try {
    const { reqId } = req.params;
    const response = await fetch(`${cuoptEndpoint}/cuopt/solution/${reqId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    const data = await response.json();

    // Log full response when there's an error or a completed response
    if (data.error || data.response) {
      console.log('[cuOPT] Full solution data:', JSON.stringify(data, null, 2));
    }

    res.status(response.status).json(data);
  } catch (error) {
    console.error('[cuOPT] Solution error:', error.message);
    res.status(500).json({ error: 'cuOPT solution failed', message: error.message });
  }
});

// cuOPT health check (alternate endpoint)
app.get('/api/cuopt-health', async (req, res) => {
  try {
    const response = await fetch(`${cuoptEndpoint}/cuopt/health`);
    if (response.ok) {
      res.json({ status: 'connected', endpoint: cuoptEndpoint });
    } else {
      res.status(503).json({ status: 'unavailable' });
    }
  } catch (error) {
    res.status(503).json({ status: 'disconnected', error: error.message });
  }
});

// ============ LlamaStack Configuration ============
// Proxies to LlamaStack /v1/responses endpoint (OpenAI-compatible)
// Matches oraclenet-frontend pattern: transforms frontend request format to LlamaStack format
const llamastackEndpoint = process.env.LLAMASTACK_ENDPOINT || 'http://localhost:8321';
// No default model — frontend must select one from /api/models
const llamastackDefaultModel = process.env.LLAMASTACK_MODEL ?? '';

// Models endpoint - proxies to LlamaStack /v1/models, filters for LLM type
app.get('/api/models', async (req, res) => {
  try {
    const response = await fetch(`${llamastackEndpoint}/v1/models`);
    if (!response.ok) {
      return res.status(response.status).json({ error: 'Failed to fetch models' });
    }
    const data = await response.json();
    // Filter to LLM models only
    const models = (data.data || []).filter(
      (m) => m.custom_metadata?.model_type === 'llm'
    );
    console.log(`[LlamaStack] Fetched ${models.length} LLM models`);
    res.json({ data: models });
  } catch (error) {
    console.error('[LlamaStack] Models error:', error.message);
    res.status(503).json({ error: 'Failed to fetch models', message: error.message });
  }
});

/**
 * Transform frontend request format to LlamaStack /v1/responses format.
 * Frontend sends: { chatRequest: { messages: [{role:'USER', content:[{type:'TEXT',text:'...'}]}], model?, ... } }
 * LlamaStack expects: { input: [{role:'user', content:'...'}], model, instructions, stream, ... }
 */
export function transformToLlamastackFormat(chatRequest) {
  const messages = (chatRequest.messages || []).map(m => ({
    role: m.role.toLowerCase(),
    content: Array.isArray(m.content)
      ? m.content.filter(c => c.type === 'TEXT').map(c => c.text).join('')
      : m.content,
  }));

  // Extract system instructions (first system message)
  const systemMessage = messages.find(m => m.role === 'system');
  const instructions = systemMessage?.content || 'You are a helpful assistant';
  const input = messages.filter(m => m.role !== 'system');

  return {
    input,
    model: chatRequest.model ?? llamastackDefaultModel,
    instructions,
    stream: false,
  };
}

/**
 * Extract text from LlamaStack /v1/responses response.
 * Response format: { output_text: "...", output: [...], ... }
 */
export function extractResponseText(data) {
  // Primary: output_text field
  if (data.output_text) {
    return data.output_text;
  }

  // Fallback: extract from output items
  if (Array.isArray(data.output)) {
    for (const item of data.output) {
      if (item.type === 'message' && Array.isArray(item.content)) {
        const textParts = item.content
          .filter(c => c.type === 'output_text' || c.type === 'text')
          .map(c => c.text)
          .join('');
        if (textParts) return textParts;
      }
    }
  }

  // Last resort: choices format (OpenAI compat)
  if (data.choices?.[0]?.message?.content) {
    return data.choices[0].message.content;
  }

  return '';
}

// GenAI Chat endpoint - proxies to LlamaStack /v1/responses
app.post('/api/genai/chat', async (req, res) => {
  try {
    const { chatRequest } = req.body;
    const llamastackRequest = transformToLlamastackFormat(chatRequest);

    console.log('[LlamaStack] Sending request to', `${llamastackEndpoint}/v1/responses`);
    console.log('[LlamaStack] Model:', llamastackRequest.model);
    console.log('[LlamaStack] Input messages:', llamastackRequest.input.length);

    const response = await fetch(`${llamastackEndpoint}/v1/responses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(llamastackRequest),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[LlamaStack] Error response:', response.status, errorText);
      return res.status(response.status).json({
        error: 'LlamaStack error',
        message: errorText,
      });
    }

    const data = await response.json();
    const text = extractResponseText(data);

    console.log('[LlamaStack] Response text length:', text.length);

    // Return in the format the frontend expects
    res.json({
      chatResponse: {
        text,
        choices: null,
        finishReason: 'stop',
      },
      usageMetadata: {
        inputTokenCount: data.usage?.input_tokens || 0,
        outputTokenCount: data.usage?.output_tokens || 0,
      },
    });
  } catch (error) {
    console.error('[LlamaStack] Error:', error.message);
    res.status(500).json({ error: 'LlamaStack error', message: error.message });
  }
});

// ============ Weather API Configuration ============
const weatherApiKey = process.env.OPENWEATHERMAP_API_KEY || '';
const weatherApiEndpoint = 'https://api.openweathermap.org/data/2.5';

// Weather - Current conditions
app.get('/api/weather/current', async (req, res) => {
  try {
    const { lat, lng } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ error: 'lat and lng parameters required' });
    }

    // If no API key, return mock data
    if (!weatherApiKey) {
      console.log('[Weather] No API key configured, returning mock data');
      return res.json(generateMockWeather(parseFloat(lat), parseFloat(lng)));
    }

    const url = `${weatherApiEndpoint}/weather?lat=${lat}&lon=${lng}&appid=${weatherApiKey}&units=metric`;
    console.log('[Weather] Fetching current weather for:', lat, lng);

    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      console.error('[Weather] API error:', data);
      return res.json(generateMockWeather(parseFloat(lat), parseFloat(lng)));
    }

    console.log('[Weather] Got data for:', data.name || 'location');
    res.json(data);
  } catch (error) {
    console.error('[Weather] Error:', error.message);
    res.json(generateMockWeather(parseFloat(req.query.lat || 51.5), parseFloat(req.query.lng || -0.1)));
  }
});

// Weather - Forecast
app.get('/api/weather/forecast', async (req, res) => {
  try {
    const { lat, lng } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ error: 'lat and lng parameters required' });
    }

    if (!weatherApiKey) {
      return res.json({ list: [] });
    }

    const url = `${weatherApiEndpoint}/forecast?lat=${lat}&lon=${lng}&appid=${weatherApiKey}&units=metric`;
    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      return res.json({ list: [] });
    }

    res.json(data);
  } catch (error) {
    console.error('[Weather] Forecast error:', error.message);
    res.json({ list: [] });
  }
});

// Weather - Alerts (One Call API - requires subscription)
app.get('/api/weather/alerts', async (_req, res) => {
  // One Call API requires subscription, return empty for now
  res.json({ alerts: [] });
});

// Weather health check
app.get('/api/weather/health', async (_req, res) => {
  if (weatherApiKey) {
    res.json({ status: 'configured', provider: 'OpenWeatherMap' });
  } else {
    res.json({ status: 'mock_mode', message: 'No API key configured, using mock data' });
  }
});

// Generate mock weather data for UK
export function generateMockWeather(lat, lng) {
  // Simulate realistic UK weather based on location and time
  const hour = new Date().getHours();
  const isNight = hour < 6 || hour > 20;

  // Temperature varies by latitude (cooler north) and time
  const baseTemp = 12 - (lat - 51) * 0.5;
  const timeAdjust = isNight ? -3 : 2;
  const temp = baseTemp + timeAdjust + (Math.random() * 4 - 2);

  // Weather conditions - UK is often cloudy/rainy
  const conditions = [
    { id: 801, main: 'Clouds', description: 'few clouds', icon: isNight ? '02n' : '02d' },
  ];

  // 30% chance of rain
  const hasRain = Math.random() < 0.3;
  if (hasRain) {
    conditions[0] = { id: 500, main: 'Rain', description: 'light rain', icon: isNight ? '10n' : '10d' };
  }

  return {
    coord: { lat, lon: lng },
    weather: conditions,
    main: {
      temp: Math.round(temp * 10) / 10,
      feels_like: Math.round((temp - 2) * 10) / 10,
      humidity: 65 + Math.floor(Math.random() * 20),
      pressure: 1013 + Math.floor(Math.random() * 20) - 10,
    },
    wind: {
      speed: 3 + Math.random() * 5,
      gust: 5 + Math.random() * 8,
    },
    clouds: { all: 40 + Math.floor(Math.random() * 40) },
    visibility: 10000,
    rain: hasRain ? { '1h': 0.5 + Math.random() * 1.5 } : undefined,
    name: 'UK Location',
  };
}

// GenAI health check - checks LlamaStack /v1/models
app.get('/api/genai/health', async (_req, res) => {
  try {
    const response = await fetch(`${llamastackEndpoint}/v1/models`);
    if (response.ok) {
      res.json({ status: 'connected', endpoint: llamastackEndpoint, defaultModel: llamastackDefaultModel });
    } else {
      res.status(503).json({ status: 'unavailable', endpoint: llamastackEndpoint });
    }
  } catch (error) {
    res.status(503).json({ status: 'disconnected', endpoint: llamastackEndpoint, error: error.message });
  }
});

export default app;
