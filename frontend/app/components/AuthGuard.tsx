'use client';

// [63] AuthGuard: redirects unauthenticated users to /login
// [92] Proactive token refresh timer: checks every minute, refreshes if expiring within threshold
import { useEffect, useState } from 'react';
import { isExpiringSoon, refreshAccessToken } from '@/lib/apiClient';

const TOKEN_CHECK_INTERVAL_MS = 60_000; // 1 minute

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  // Lazy initializer runs once on mount — reads cookie synchronously without needing an effect
  const [checked, setChecked] = useState(() =>
    document.cookie.split(';').some(c => c.trim().startsWith('token='))
  );

  useEffect(() => {
    // [113] Token cookie gone — try refresh before logging out.
    // refreshToken (HttpOnly, 30d) may still be valid.
    // refreshAccessToken() calls logout() internally on failure, so no else needed.
    const hasToken = document.cookie.split(';').some(c => c.trim().startsWith('token='));
    if (!hasToken) {
      refreshAccessToken().then(refreshed => {
        if (refreshed) setChecked(true);
      });
    }
  }, []);

  useEffect(() => {
    if (!checked) return;
    const id = setInterval(async () => {
      if (isExpiringSoon()) {
        await refreshAccessToken();
      }
    }, TOKEN_CHECK_INTERVAL_MS);
    return () => clearInterval(id);
  }, [checked]);

  if (!checked) return null;
  return <>{children}</>;
}
