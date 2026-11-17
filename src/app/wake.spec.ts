import { HEALTH_EVERY_MS, HERBACK_HEALTH, armWake, type WakeTarget } from './wake';

function target(): WakeTarget & { visibilityState: DocumentVisibilityState; fire(): void } {
  let listener = (): void => undefined;
  return {
    visibilityState: 'visible' as DocumentVisibilityState,
    addEventListener(_type: 'visibilitychange', next: () => void) {
      listener = next;
    },
    fire() {
      listener();
    },
  };
}

describe('wake', () => {
  it('calls herback health when the page opens', async () => {
    const calls: string[] = [];
    const stop = armWake(target(), async (url) => {
      calls.push(url);
      return new Response('ok');
    });
    stop();
    await Promise.resolve();
    expect(calls).toEqual([HERBACK_HEALTH]);
    expect(HEALTH_EVERY_MS).toBe(60_000);
  });

  it('calls again when the page comes back', async () => {
    const calls: string[] = [];
    const page = target();
    const stop = armWake(page, async (url) => {
      calls.push(url);
      return new Response('ok');
    });
    page.visibilityState = 'hidden';
    page.fire();
    page.visibilityState = 'visible';
    page.fire();
    stop();
    await Promise.resolve();
    expect(calls).toEqual([HERBACK_HEALTH, HERBACK_HEALTH]);
  });
});
