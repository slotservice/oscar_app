import { useRef, useCallback } from 'react';

/**
 * Auto-save hook that debounces save calls.
 * Used for checklist entries and lab data to save on every input.
 */
export function useAutoSave(saveFn: () => Promise<void>, delayMs = 500) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savingRef = useRef(false);

  const trigger = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(async () => {
      if (savingRef.current) return;
      savingRef.current = true;
      try {
        await saveFn();
      } catch (err) {
        console.warn('Auto-save failed:', err);
      } finally {
        savingRef.current = false;
      }
    }, delayMs);
  }, [saveFn, delayMs]);

  const cancel = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
  }, []);

  return { trigger, cancel };
}
