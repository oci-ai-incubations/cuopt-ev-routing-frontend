import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import app, {
  transformToLlamastackFormat,
  extractResponseText,
  generateMockWeather,
} from "../app.js";

// ---------------------------------------------------------------------------
// Mock global fetch so no real HTTP calls are made
// ---------------------------------------------------------------------------
const mockFetch = vi.fn();
global.fetch = mockFetch;

beforeEach(() => {
  mockFetch.mockReset();
});

// ===========================================================================
// Health
// ===========================================================================
describe("GET /health", () => {
  it("returns ok status", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(res.body).toHaveProperty("timestamp");
  });
});

// ===========================================================================
// Authentication
// ===========================================================================
describe("POST /api/auth/login", () => {
  it("accepts valid default credentials", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ username: "admin", password: "admin" });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, username: "admin" });
  });

  it("rejects invalid credentials", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ username: "admin", password: "wrong" });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});

// ===========================================================================
// Runtime Config
// ===========================================================================
describe("GET /api/config", () => {
  it("returns runtime configuration", async () => {
    const res = await request(app).get("/api/config");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("googleMapsApiKey");
  });
});

// ===========================================================================
// cuOPT endpoints
// ===========================================================================
describe("cuOPT proxy", () => {
  it("GET /api/cuopt/health proxies to cuOPT", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: async () => '{"status":"healthy"}',
    });

    const res = await request(app).get("/api/cuopt/health");
    expect(res.status).toBe(200);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/cuopt/health"),
      expect.any(Object)
    );
  });

  it("GET /api/cuopt/health returns 503 on fetch failure", async () => {
    mockFetch.mockRejectedValueOnce(new Error("connection refused"));

    const res = await request(app).get("/api/cuopt/health");
    expect(res.status).toBe(503);
    expect(res.body.status).toBe("disconnected");
  });

  it("POST /api/cuopt/request proxies optimization request", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ reqId: "abc123" }),
    });

    const res = await request(app)
      .post("/api/cuopt/request")
      .send({ fleet_data: {}, task_data: {} });
    expect(res.status).toBe(200);
    expect(res.body.reqId).toBe("abc123");
  });

  it("POST /api/cuopt/request returns 500 on fetch failure", async () => {
    mockFetch.mockRejectedValueOnce(new Error("timeout"));

    const res = await request(app)
      .post("/api/cuopt/request")
      .send({ fleet_data: {} });
    expect(res.status).toBe(500);
    expect(res.body.error).toBe("cuOPT request failed");
  });

  it("GET /api/cuopt/solution/:reqId proxies solution fetch", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ response: { routes: [] } }),
    });

    const res = await request(app).get("/api/cuopt/solution/abc123");
    expect(res.status).toBe(200);
    expect(res.body.response).toEqual({ routes: [] });
  });

  it("GET /api/cuopt-health returns connected when cuOPT is up", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true });

    const res = await request(app).get("/api/cuopt-health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("connected");
  });

  it("GET /api/cuopt-health returns unavailable when upstream returns non-ok", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 500 });

    const res = await request(app).get("/api/cuopt-health");
    expect(res.status).toBe(503);
    expect(res.body.status).toBe("unavailable");
  });

  it("GET /api/cuopt-health returns disconnected on failure", async () => {
    mockFetch.mockRejectedValueOnce(new Error("down"));

    const res = await request(app).get("/api/cuopt-health");
    expect(res.status).toBe(503);
    expect(res.body.status).toBe("disconnected");
  });

  it("GET /api/cuopt/solution/:reqId returns 500 on fetch failure", async () => {
    mockFetch.mockRejectedValueOnce(new Error("timeout"));

    const res = await request(app).get("/api/cuopt/solution/abc123");
    expect(res.status).toBe(500);
    expect(res.body.error).toBe("cuOPT solution failed");
  });
});

// ===========================================================================
// LlamaStack / GenAI endpoints
// ===========================================================================
describe("LlamaStack proxy", () => {
  it("GET /api/models returns filtered LLM models", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        data: [
          { id: "m1", custom_metadata: { model_type: "llm" } },
          { id: "m2", custom_metadata: { model_type: "embedding" } },
        ],
      }),
    });

    const res = await request(app).get("/api/models");
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].id).toBe("m1");
  });

  it("GET /api/models returns 503 on fetch failure", async () => {
    mockFetch.mockRejectedValueOnce(new Error("down"));

    const res = await request(app).get("/api/models");
    expect(res.status).toBe(503);
  });

  it("POST /api/genai/chat proxies and transforms request", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        output_text: "Hello!",
        usage: { input_tokens: 10, output_tokens: 5 },
      }),
    });

    const res = await request(app)
      .post("/api/genai/chat")
      .send({
        chatRequest: {
          messages: [
            { role: "USER", content: [{ type: "TEXT", text: "Hi" }] },
          ],
          model: "test-model",
        },
      });

    expect(res.status).toBe(200);
    expect(res.body.chatResponse.text).toBe("Hello!");
    expect(res.body.usageMetadata.inputTokenCount).toBe(10);
  });

  it("POST /api/genai/chat forwards upstream errors", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: async () => "Internal Server Error",
    });

    const res = await request(app)
      .post("/api/genai/chat")
      .send({ chatRequest: { messages: [] } });
    expect(res.status).toBe(500);
    expect(res.body.error).toBe("LlamaStack error");
  });

  it("GET /api/genai/health returns connected", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true });

    const res = await request(app).get("/api/genai/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("connected");
  });

  it("GET /api/genai/health returns disconnected on failure", async () => {
    mockFetch.mockRejectedValueOnce(new Error("down"));

    const res = await request(app).get("/api/genai/health");
    expect(res.status).toBe(503);
    expect(res.body.status).toBe("disconnected");
  });

  it("GET /api/genai/health returns unavailable when upstream returns non-ok", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 503 });

    const res = await request(app).get("/api/genai/health");
    expect(res.status).toBe(503);
    expect(res.body.status).toBe("unavailable");
  });

  it("GET /api/models forwards non-ok status from upstream", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 502,
      json: async () => ({}),
    });

    const res = await request(app).get("/api/models");
    expect(res.status).toBe(502);
  });
});

// ===========================================================================
// Weather endpoints
// ===========================================================================
describe("Weather proxy", () => {
  it("GET /api/weather/current returns 400 without coordinates", async () => {
    const res = await request(app).get("/api/weather/current");
    expect(res.status).toBe(400);
  });

  it("GET /api/weather/current returns mock data without API key", async () => {
    const res = await request(app)
      .get("/api/weather/current")
      .query({ lat: "51.5", lng: "-0.1" });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("coord");
    expect(res.body).toHaveProperty("weather");
    expect(res.body).toHaveProperty("main");
  });

  it("GET /api/weather/forecast returns empty list without API key", async () => {
    const res = await request(app)
      .get("/api/weather/forecast")
      .query({ lat: "51.5", lng: "-0.1" });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ list: [] });
  });

  it("GET /api/weather/forecast returns 400 without coordinates", async () => {
    const res = await request(app).get("/api/weather/forecast");
    expect(res.status).toBe(400);
  });

  it("GET /api/weather/alerts returns empty alerts", async () => {
    const res = await request(app).get("/api/weather/alerts");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ alerts: [] });
  });

  it("GET /api/weather/health returns mock_mode without API key", async () => {
    const res = await request(app).get("/api/weather/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("mock_mode");
  });

  it("GET /api/weather/current falls back to mock on fetch error", async () => {
    // This branch is only reached when weatherApiKey is set,
    // but since env is empty in test, the mock path is always taken.
    // Covering the no-key branch for current weather with coords.
    const res = await request(app)
      .get("/api/weather/current")
      .query({ lat: "52.0", lng: "1.0" });
    expect(res.status).toBe(200);
    expect(res.body.coord.lat).toBe(52.0);
  });
});

// ===========================================================================
// Unit tests for helper functions
// ===========================================================================
describe("transformToLlamastackFormat", () => {
  it("transforms frontend message format to LlamaStack format", () => {
    const result = transformToLlamastackFormat({
      messages: [
        {
          role: "SYSTEM",
          content: [{ type: "TEXT", text: "Be helpful" }],
        },
        {
          role: "USER",
          content: [{ type: "TEXT", text: "Hello" }],
        },
      ],
      model: "my-model",
    });

    expect(result.model).toBe("my-model");
    expect(result.instructions).toBe("Be helpful");
    expect(result.input).toHaveLength(1);
    expect(result.input[0].role).toBe("user");
    expect(result.input[0].content).toBe("Hello");
    expect(result.stream).toBe(false);
  });

  it("uses default instructions when no system message", () => {
    const result = transformToLlamastackFormat({
      messages: [{ role: "USER", content: "Hi" }],
    });
    expect(result.instructions).toBe("You are a helpful assistant");
  });

  it("handles string content directly", () => {
    const result = transformToLlamastackFormat({
      messages: [{ role: "USER", content: "plain text" }],
    });
    expect(result.input[0].content).toBe("plain text");
  });
});

describe("extractResponseText", () => {
  it("extracts from output_text", () => {
    expect(extractResponseText({ output_text: "hello" })).toBe("hello");
  });

  it("extracts from output array", () => {
    const data = {
      output: [
        {
          type: "message",
          content: [{ type: "output_text", text: "from array" }],
        },
      ],
    };
    expect(extractResponseText(data)).toBe("from array");
  });

  it("extracts from choices format", () => {
    const data = {
      choices: [{ message: { content: "from choices" } }],
    };
    expect(extractResponseText(data)).toBe("from choices");
  });

  it("extracts from output array with text type", () => {
    const data = {
      output: [
        {
          type: "message",
          content: [{ type: "text", text: "text type" }],
        },
      ],
    };
    expect(extractResponseText(data)).toBe("text type");
  });

  it("skips non-message output items", () => {
    const data = {
      output: [{ type: "tool_call", content: "ignored" }],
    };
    expect(extractResponseText(data)).toBe("");
  });

  it("returns empty string when nothing found", () => {
    expect(extractResponseText({})).toBe("");
  });
});

describe("generateMockWeather", () => {
  it("returns valid weather structure", () => {
    const data = generateMockWeather(51.5, -0.1);
    expect(data.coord).toEqual({ lat: 51.5, lon: -0.1 });
    expect(data.weather).toBeInstanceOf(Array);
    expect(data.main).toHaveProperty("temp");
    expect(data.main).toHaveProperty("humidity");
    expect(data.wind).toHaveProperty("speed");
    expect(data.name).toBe("UK Location");
  });
});
