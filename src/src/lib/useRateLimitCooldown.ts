import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook for handling form submission cooldown after HTTP 429 Too Many Requests.
 * Automatically initiates countdown when the global axios interceptor fires 'api:rate-limited',
 * or when manually called via startCooldown(seconds).
 */
export function useRateLimitCooldown(defaultSeconds = 30) {
  const [countdown, setCountdown] = useState<number>(0);

  const startCooldown = useCallback(
    (seconds = defaultSeconds) => {
      setCountdown(seconds);
    },
    [defaultSeconds]
  );

  // Interval timer for countdown
  useEffect(() => {
    if (countdown <= 0) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown]);

  // Listen to global window event dispatched by axios 429 interceptor
  useEffect(() => {
    const handleRateLimit = (e: Event) => {
      const customEvent = e as CustomEvent<{ cooldownSeconds?: number }>;
      const sec = customEvent.detail?.cooldownSeconds ?? defaultSeconds;
      setCountdown(sec);
    };

    window.addEventListener('api:rate-limited', handleRateLimit);
    return () => {
      window.removeEventListener('api:rate-limited', handleRateLimit);
    };
  }, [defaultSeconds]);

  return {
    isCoolingDown: countdown > 0,
    countdown,
    startCooldown,
  };
}
