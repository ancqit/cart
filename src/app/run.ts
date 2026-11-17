import { WritableSignal } from '@angular/core';
import { ApiError } from './cart-api';

export async function runBusy(
  busy: WritableSignal<boolean>,
  error: WritableSignal<string>,
  task: () => Promise<void>,
  onUnauthorized?: () => void,
): Promise<void> {
  if (busy()) {
    return;
  }
  busy.set(true);
  error.set('');
  try {
    await task();
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) {
      onUnauthorized?.();
      return;
    }
    error.set(err instanceof ApiError ? err.message : 'The portal could not do that.');
  } finally {
    busy.set(false);
  }
}
