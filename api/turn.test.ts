import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildGameState } from '../tests/fixtures';

describe('api/turn request validation', () => {
  const envBackup = { ...process.env };

  afterEach(() => {
    process.env = { ...envBackup };
    vi.resetModules();
  });

  it('returns 400 with validation error details for malformed request body', async () => {
    process.env.AWS_REGION = 'us-east-1';
    process.env.BEDROCK_NARRATOR_MODEL_ID = 'narrator-model';
    process.env.BEDROCK_DIRECTOR_MODEL_ID = 'director-model';

    const { default: handler } = await import('./turn');

    let statusCode = 0;
    let payload: any;

    const req = {
      method: 'POST',
      headers: {
        host: 'example.com'
      },
      socket: {
        remoteAddress: '127.0.0.1'
      },
      body: {
        state: buildGameState(),
        input: {},
      },
    };

    const res = {
      status(code: number) {
        statusCode = code;
        return this;
      },
      json(data: any) {
        payload = data;
        return this;
      }
    };

    await handler(req, res);

    expect(statusCode).toBe(400);
    expect(payload).toEqual({ error: 'Invalid input.type: expected one of DO, SAY, STORY.' });
  });
});
