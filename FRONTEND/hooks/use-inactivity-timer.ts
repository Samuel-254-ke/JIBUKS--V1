import { useEffect, useRef, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';

const INACTIVITY_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

/**
 * useInactivityTimer
 *
 * Calls `onTimeout` when the user has had no touch activity for
 * INACTIVITY_TIMEOUT_MS milliseconds.  The timer is also paused/reset
 * when the app goes to the background and resumed when it comes back
 * to the foreground.
 *
 * Returns a `resetTimer` function that you can call from a
 * PanResponder / GestureDetector to manually signal activity.
 */
export function useInactivityTimer(onTimeout: () => void, enabled: boolean = true) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onTimeoutRef = useRef(onTimeout);

  // Keep the callback ref fresh so callers don't need to worry about deps
  useEffect(() => {
    onTimeoutRef.current = onTimeout;
  }, [onTimeout]);

  const clearExistingTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const resetTimer = useCallback(() => {
    if (!enabled) return;
    clearExistingTimer();
    timerRef.current = setTimeout(() => {
      onTimeoutRef.current();
    }, INACTIVITY_TIMEOUT_MS);
  }, [enabled, clearExistingTimer]);

  // Start / stop the timer based on `enabled`
  useEffect(() => {
    if (enabled) {
      resetTimer();
    } else {
      clearExistingTimer();
    }
    return clearExistingTimer;
  }, [enabled, resetTimer, clearExistingTimer]);

  // Pause when app goes to background, resume + reset when it returns
  useEffect(() => {
    if (!enabled) return;

    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        resetTimer();
      } else {
        clearExistingTimer();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [enabled, resetTimer, clearExistingTimer]);

  return { resetTimer };
}
