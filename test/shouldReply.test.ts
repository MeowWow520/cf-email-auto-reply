import { describe, it, expect } from 'vitest';
import { shouldReply } from '../src/shouldReply';

function headers(init?: Record<string, string>): Headers {
  const h = new Headers();
  if (init) {
    for (const [name, value] of Object.entries(init)) {
      h.set(name, value);
    }
  }
  return h;
}

describe('shouldReply', () => {
  it('replies to a normal personal email', () => {
    const result = shouldReply(
      headers({ from: 'alice@example.com', subject: 'Hello', 'auto-submitted': 'no' })
    );
    expect(result.shouldReply).toBe(true);
  });

  it('skips auto-replied messages', () => {
    const result = shouldReply(headers({ from: 'a@b.com', 'auto-submitted': 'auto-replied' }));
    expect(result).toEqual({ shouldReply: false, reason: 'auto-submitted: auto-replied' });
  });

  it('skips bulk / junk / list precedence messages', () => {
    for (const p of ['bulk', 'junk', 'list']) {
      const result = shouldReply(headers({ from: 'a@b.com', precedence: p }));
      expect(result.shouldReply).toBe(false);
      expect(result.reason).toBe(`precedence: ${p}`);
    }
  });

  it('skips mailing list messages', () => {
    const result = shouldReply(
      headers({ from: 'list@example.com', 'list-unsubscribe': '<https://x.com/unsub>' })
    );
    expect(result.shouldReply).toBe(false);
  });

  it('skips messages suppressing auto responses', () => {
    const result = shouldReply(
      headers({ from: 'a@b.com', 'x-auto-response-suppress': 'All, DR, NDR' })
    );
    expect(result.shouldReply).toBe(false);
  });

  it('skips bounces with empty from', () => {
    const result = shouldReply(headers({}));
    expect(result.shouldReply).toBe(false);
  });

  it('auto-submitted: no is allowed', () => {
    const result = shouldReply(headers({ from: 'a@b.com', 'auto-submitted': 'no' }));
    expect(result.shouldReply).toBe(true);
  });

  it('header checks are case-insensitive', () => {
    const result = shouldReply(headers({ from: 'a@b.com', Precedence: 'Bulk' }));
    expect(result.shouldReply).toBe(false);
  });
});
