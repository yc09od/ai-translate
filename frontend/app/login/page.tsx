'use client';

import { Box, Typography } from '@mui/material';

export default function LoginPage() {
  return (
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
      </Box>
    </Box>
  );
}
