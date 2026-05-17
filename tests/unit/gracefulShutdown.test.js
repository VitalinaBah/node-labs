import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import gracefulShutdown from '../../utils/gracefulShutdown.js';

describe('gracefulShutdown', () => {
  let mockApp;
  let exitSpy;

  beforeEach(() => {
    mockApp = {
      log: { info: vi.fn(), error: vi.fn() },
      close: vi.fn().mockResolvedValue(undefined),
    };
    exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {});
  });

  afterEach(() => {
    exitSpy.mockRestore();
  });

  it('викликає app.close() і process.exit(0)', async () => {
    await gracefulShutdown('SIGTERM', mockApp);
    expect(mockApp.close).toHaveBeenCalled();
    expect(exitSpy).toHaveBeenCalledWith(0);
  });

  it('логує сигнал', async () => {
    await gracefulShutdown('SIGINT', mockApp);
    expect(mockApp.log.info).toHaveBeenCalledWith(
      expect.stringContaining('SIGINT'),
    );
  });
});
