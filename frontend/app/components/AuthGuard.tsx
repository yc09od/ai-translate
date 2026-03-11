'use client';

// [63] AuthGuard: redirects unauthenticated users to /login
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    // token cookie is not HttpOnly, so JS can read it for auth checks
    const hasToken = document.cookie.split(';').some(c => c.trim().startsWith('token='));
    if (!hasToken) {
      router.replace('/login');
    } else {
      setChecked(true);
    }
  }, [router]);

  if (!checked) return null;
  return <>{children}</>;
}
