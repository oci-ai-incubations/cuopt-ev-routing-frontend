import { beforeEach, describe, expect, it, vi } from 'vitest';

import { authClient, genaiClient } from '@/api';
import type { Message } from '@/types';

vi.mock('@/api/authClient', () => ({
  authClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

// convertPromptToCuOpt dynamically imports these two modules
vi.mock('@/data/benchmarkData', () => ({
  generateRandomStops: vi.fn(() => [
    { id: 1, lat: 51.5, lng: -0.1, demand: 3 },
    { id: 2, lat: 51.6, lng: -0.2, demand: 5 },
  ]),
}));

vi.mock('@/api/cuoptClient', () => ({
  cuoptClient: {
    buildPayload: vi.fn(() => ({
      cost_matrix_data: {},
      task_data: {},
      fleet_data: {},
      solver_config: {},
    })),
  },
}));

function makeMessage(content: string, role: 'user' | 'assistant' = 'user'): Message {
  return { id: '1', role, content, timestamp: new Date() };
}

function mockChatResponse(text: string) {
  vi.mocked(authClient.post).mockResolvedValue({
    data: {
      chatResponse: { text },
      usageMetadata: { inputTokenCount: 10, outputTokenCount: 20 },
    },
  });
}

beforeEach(() => {
  vi.resetAllMocks();
});

// ─── setModel / model field ───────────────────────────────────────────────────

describe('setModel', () => {
  it('sets the model used in subsequent chat calls', async () => {
    genaiClient.setModel('meta.llama-3');
    mockChatResponse('hello');

    await genaiClient.chat([makeMessage('hi')]);

    const body = vi.mocked(authClient.post).mock.calls[0][1] as {
      chatRequest: { model: string };
    };

    expect(body.chatRequest.model).toBe('meta.llama-3');
  });
});

// ─── fetchModels ──────────────────────────────────────────────────────────────

describe('fetchModels', () => {
  it('returns model list from /api/models', async () => {
    const models = [{ id: 'llama-3', name: 'Llama 3' }];

    vi.mocked(authClient.get).mockResolvedValue({ data: { data: models } });

    const result = await genaiClient.fetchModels();

    expect(authClient.get).toHaveBeenCalledWith('/api/models', expect.any(Object));
    expect(result).toEqual(models);
  });

  it('returns empty array on error', async () => {
    vi.mocked(authClient.get).mockRejectedValue(new Error('Network'));

    const result = await genaiClient.fetchModels();

    expect(result).toEqual([]);
  });
});

// ─── healthCheck ──────────────────────────────────────────────────────────────

describe('healthCheck', () => {
  it('returns true when /api/genai/health responds 200', async () => {
    vi.mocked(authClient.get).mockResolvedValue({ status: 200 });

    expect(await genaiClient.healthCheck()).toBe(true);
  });

  it('returns false on error', async () => {
    vi.mocked(authClient.get).mockRejectedValue(new Error('Down'));

    expect(await genaiClient.healthCheck()).toBe(false);
  });
});

// ─── chat ─────────────────────────────────────────────────────────────────────

describe('chat', () => {
  it('posts messages and returns content + tokensUsed', async () => {
    mockChatResponse('Route optimized.');

    const result = await genaiClient.chat([makeMessage('Optimize my routes')]);

    expect(authClient.post).toHaveBeenCalledWith(
      '/api/genai/chat',
      expect.objectContaining({ chatRequest: expect.any(Object) }),
      expect.any(Object),
    );
    expect(result.content).toBe('Route optimized.');
    expect(result.tokensUsed).toBe(30);
  });

  it('concatenates TEXT choices when chatResponse has no top-level text', async () => {
    vi.mocked(authClient.post).mockResolvedValue({
      data: {
        chatResponse: {
          choices: [
            {
              message: {
                content: [
                  { type: 'TEXT', text: 'Hello ' },
                  { type: 'TEXT', text: 'world' },
                ],
              },
            },
          ],
        },
        usageMetadata: { inputTokenCount: 5, outputTokenCount: 5 },
      },
    });

    const result = await genaiClient.chat([makeMessage('hi')]);

    expect(result.content).toBe('Hello world');
  });

  it('includes system prompt as SYSTEM message', async () => {
    mockChatResponse('ok');

    await genaiClient.chat([makeMessage('hi')], 'You are a helpful assistant');

    const body = vi.mocked(authClient.post).mock.calls[0][1] as {
      chatRequest: { messages: Array<{ role: string; content: Array<{ text: string }> }> };
    };

    expect(body.chatRequest.messages[0].role).toBe('SYSTEM');
    expect(body.chatRequest.messages[0].content[0].text).toBe('You are a helpful assistant');
  });
});

// ─── classifyIntent ───────────────────────────────────────────────────────────

describe('classifyIntent', () => {
  it('classifies obvious greetings locally without calling LLM', async () => {
    const result = await genaiClient.classifyIntent('Hello!');

    expect(result.intent).toBe('greeting');
    expect(authClient.post).not.toHaveBeenCalled();
  });

  it('classifies optimization keywords + numbers without calling LLM', async () => {
    const result = await genaiClient.classifyIntent('Optimize 50 deliveries with 5 vehicles');

    expect(result.intent).toBe('optimization');
    expect(authClient.post).not.toHaveBeenCalled();
  });

  it('asks LLM when intent is ambiguous and returns optimization when LLM says so', async () => {
    mockChatResponse('INTENT:optimization');

    const result = await genaiClient.classifyIntent('What is the best routing strategy?');

    expect(result.intent).toBe('optimization');
    expect(authClient.post).toHaveBeenCalledOnce();
  });

  it('asks LLM and returns question intent with LLM answer', async () => {
    mockChatResponse('VRP stands for Vehicle Routing Problem.');

    const result = await genaiClient.classifyIntent('What is VRP?');

    expect(result.intent).toBe('question');
    expect(result.answer).toBe('VRP stands for Vehicle Routing Problem.');
  });

  it('defaults to optimization intent when LLM call fails', async () => {
    vi.mocked(authClient.post).mockRejectedValue(new Error('LLM down'));

    const result = await genaiClient.classifyIntent('Some unclear input');

    expect(result.intent).toBe('optimization');
    expect(result.confidence).toBeLessThan(0.8);
  });
});

// ─── convertPromptToCuOpt ─────────────────────────────────────────────────────

describe('convertPromptToCuOpt', () => {
  it('returns a valid cuOPT request when LLM response contains JSON', async () => {
    const llmJson = JSON.stringify({
      num_stops: 10,
      num_vehicles: 2,
      time_limit: 30,
      location: 'London',
      vehicle_capacity: 100,
    });

    mockChatResponse(`Here is the plan: ${llmJson}`);

    const result = await genaiClient.convertPromptToCuOpt(
      'Deliver 10 parcels in London with 2 vans',
    );

    expect(result.request).not.toBeNull();
    expect(result.numStops).toBe(10);
    expect(result.numVehicles).toBe(2);
    expect(result.location).toBe('London');
  });

  it('returns error when LLM response has no extractable JSON', async () => {
    mockChatResponse('Sorry, I could not parse that.');

    const result = await genaiClient.convertPromptToCuOpt('gibberish request');

    expect(result.request).toBeNull();
    expect(result.error).toContain('Could not extract');
  });

  it('returns error description when chat call throws', async () => {
    vi.mocked(authClient.post).mockRejectedValue(new Error('LLM unavailable'));

    const result = await genaiClient.convertPromptToCuOpt('any input');

    expect(result.request).toBeNull();
    expect(result.error).toContain('LLM unavailable');
  });
});

// ─── convertResponseToNaturalLanguage ────────────────────────────────────────

describe('convertResponseToNaturalLanguage', () => {
  it('returns LLM explanation string', async () => {
    mockChatResponse('The optimization reduced total distance by 15%.');

    const result = await genaiClient.convertResponseToNaturalLanguage(
      {
        vehicle_data: [
          {
            vehicle_id: 0,
            route: [0, 1, 0],
            arrival_times: [0, 10, 20],
            route_distance: 5,
            route_duration: 20,
            load_at_stops: [],
          },
        ],
        solution_cost: 100,
        num_vehicles: 1,
        status: 'SUCCESS',
        solve_time: 1,
      },
      'Optimize 5 stops',
    );

    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });
});

// ─── streamChat ───────────────────────────────────────────────────────────────

describe('streamChat', () => {
  it('yields all words from the chat response', async () => {
    mockChatResponse('word1 word2 word3');
    // streamChat uses delay internally — stub it out
    vi.spyOn(genaiClient as unknown as { delay: () => Promise<void> }, 'delay').mockResolvedValue();

    const chunks: string[] = [];

    for await (const chunk of genaiClient.streamChat([makeMessage('hello')])) {
      chunks.push(chunk);
    }

    const joined = chunks.join('').trim();

    expect(joined).toBe('word1 word2 word3');
  });
});
