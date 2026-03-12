'use client';

// [63] AuthGuard: redirects unauthenticated users to /login
// [92] Proactive token refresh timer: checks every minute, refreshes if expiring within threshold
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { isExpiringSoon, refreshAccessToken } from '@/lib/apiClient';

const TOKEN_CHECK_INTERVAL_MS = 60_000; // 1 minute

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    // token cookie is not HttpOnly, so JS can read it for auth checks
    const hasToken = document.cookie.split(';').some(c => c.trim().startsWith('token='));
    if (!hasToken) {
      // [113] Token cookie gone — try refresh before logging out.
      // refreshToken (HttpOnly, 30d) may still be valid.
      // refreshAccessToken() calls logout() internally on failure, so no else needed.
      refreshAccessToken().then(refreshed => {
        if (refreshed) setChecked(true);
      });
    } else {
      setChecked(true);
    }
  }, [router]);

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
