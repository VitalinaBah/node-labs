import { describe, it, expect } from 'vitest';
import { formatImageUrl } from '../../utils/formatImageUrl.js';

describe('formatImageUrl', () => {
  const mockReq = { protocol: 'http', hostname: 'localhost:3000' };

  it('повертає null коли image відсутній', () => {
    expect(formatImageUrl(mockReq, null)).toBeNull();
    expect(formatImageUrl(mockReq, undefined)).toBeNull();
  });

  it('будує повний URL з відносного шляху', () => {
    const result = formatImageUrl(mockReq, '/1/image.png');
    expect(result).toContain('localhost:3000');
    expect(result).toContain('/files/1/image.png');
  });

  it('повертає рядок (не null) для непорожнього шляху', () => {
    const result = formatImageUrl(mockReq, '/some/path.jpg');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });
});
