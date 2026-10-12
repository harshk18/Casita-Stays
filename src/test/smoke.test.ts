import { describe, expect, it } from 'vitest';

describe('test setup', () => {
  it('runs TypeScript tests', () => {
    expect(1 + 1).toBe(2);
  });

  it('provides a jsdom document with jest-dom matchers', () => {
    expect(document.body).toBeInTheDocument();
  });
});
