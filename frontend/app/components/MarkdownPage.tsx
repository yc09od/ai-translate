'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Box, Button, CircularProgress, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

interface MarkdownPageProps {
  src: string;
}

export default function MarkdownPage({ src }: MarkdownPageProps) {
  const router = useRouter();
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(src)
      .then((res) => res.text())
      .then((text) => {
        setContent(text);
        setLoading(false);
      });
  }, [src]);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', py: 4, px: { xs: 2, sm: 4 } }}>
      <Box sx={{ maxWidth: 800, mx: 'auto' }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => router.back()}
          sx={{ mb: 3 }}
          variant="outlined"
          size="small"
        >
          Return
        </Button>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box
            sx={{
              '& h1': { fontSize: '2rem', fontWeight: 700, mb: 2, mt: 0 },
              '& h2': { fontSize: '1.4rem', fontWeight: 600, mb: 1.5, mt: 4 },
              '& h3': { fontSize: '1.1rem', fontWeight: 600, mb: 1, mt: 3 },
              '& p': { mb: 1.5, lineHeight: 1.8 },
              '& ul, & ol': { pl: 3, mb: 1.5 },
              '& li': { mb: 0.5, lineHeight: 1.8 },
              '& hr': { my: 3, borderColor: 'divider' },
              '& strong': { fontWeight: 600 },
              '& table': { width: '100%', borderCollapse: 'collapse', mb: 2 },
              '& th, & td': { border: '1px solid', borderColor: 'divider', p: 1, textAlign: 'left' },
              '& th': { bgcolor: 'action.hover', fontWeight: 600 },
              '& a': { color: 'primary.main' },
              '& blockquote': { borderLeft: '4px solid', borderColor: 'divider', pl: 2, ml: 0, color: 'text.secondary' },
            }}
          >
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
          </Box>
        )}

        <Box sx={{ mt: 4, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <Typography variant="body2" color="text.secondary">
            ai-translate.eggplantcui.ca
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
