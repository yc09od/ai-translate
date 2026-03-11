'use client';

import { Box, Button, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useEffect, Suspense } from 'react';

// [63] Redirect already-logged-in users to dashboard
function OAuthCallbackHandler() {
  const router = useRouter();

  useEffect(() => {
    if (document.cookie.split(';').some(c => c.trim().startsWith('token='))) {
      router.replace('/dashboard');
    }
  }, [router]);

  return null;
}

// [56] Google SVG logo
function GoogleLogo() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
      <path fill="none" d="M0 0h48v48H0z"/>
    </svg>
  );
}

// [57] Microsoft SVG logo
function MicrosoftLogo() {
  return (
    <svg width="20" height="20" viewBox="0 0 21 21" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="1" width="9" height="9" fill="#F25022"/>
      <rect x="11" y="1" width="9" height="9" fill="#7FBA00"/>
      <rect x="1" y="11" width="9" height="9" fill="#00A4EF"/>
      <rect x="11" y="11" width="9" height="9" fill="#FFB900"/>
    </svg>
  );
}

// [59] Google OAuth handler
function handleGoogleLogin() {
  const url = process.env.NEXT_PUBLIC_GOOGLE_OAUTH_URL;
  if (url) window.location.href = url;
}

// [60] Hotmail OAuth handler
function handleHotmailLogin() {
  const url = process.env.NEXT_PUBLIC_HOTMAIL_OAUTH_URL;
  if (url) window.location.href = url;
}

export default function LoginPage() {
  return (
    <>
      <Suspense>
        <OAuthCallbackHandler />
      </Suspense>
    <Box
      sx={{
        display: 'flex',
        height: '100vh',
        width: '100vw',
        overflow: 'hidden',
      }}
    >
      {/* [53] Left decorative gradient panel */}
      <Box
        sx={{
          flex: 1,
          background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 40%, #3730a3 100%)',
        }}
      />

      {/* [54] Right content area - vertically and horizontally centered */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#fff',
          px: 4,
        }}
      >
        {/* [55] App Title */}
        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            color: '#1e293b',
            mb: 4,
            textAlign: 'center',
            letterSpacing: '-0.5px',
          }}
        >
          AI 实时翻译
        </Typography>

        {/* [56][57][58] Login buttons - same width, vertical layout, moderate spacing */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: 280 }}>
          {/* [56] Gmail button */}
          <Button
            variant="outlined"
            startIcon={<GoogleLogo />}
            onClick={handleGoogleLogin}
            sx={{
              width: '100%',
              py: 1.5,
              borderColor: '#e2e8f0',
              color: '#1e293b',
              textTransform: 'none',
              fontSize: '0.95rem',
              fontWeight: 500,
              justifyContent: 'flex-start',
              pl: 3,
              '&:hover': { borderColor: '#cbd5e1', backgroundColor: '#f8fafc' },
            }}
          >
            Sign in with Gmail
          </Button>

          {/* [57] Hotmail button */}
          <Button
            variant="outlined"
            startIcon={<MicrosoftLogo />}
            onClick={handleHotmailLogin}
            sx={{
              width: '100%',
              py: 1.5,
              borderColor: '#e2e8f0',
              color: '#1e293b',
              textTransform: 'none',
              fontSize: '0.95rem',
              fontWeight: 500,
              justifyContent: 'flex-start',
              pl: 3,
              '&:hover': { borderColor: '#cbd5e1', backgroundColor: '#f8fafc' },
            }}
          >
            Sign in with Hotmail
          </Button>
        </Box>
      </Box>
    </Box>
    </>
  );
}
