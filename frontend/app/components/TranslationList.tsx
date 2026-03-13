'use client';

import { useEffect, useRef } from 'react';

interface TranslationItem {
  id: string;
  original: string;
  translated: string;
  loading: boolean;
}

interface TranslationListProps {
  items: TranslationItem[];
}

export default function TranslationList({ items }: TranslationListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // [126] Auto-scroll to bottom whenever items change
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [items]);

  return (
    <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '0 12px 0 24px', marginRight: '24px', marginTop: '16px', marginBottom: '16px' }}>
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .ot-skeleton {
          background: linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%);
          background-size: 200% 100%;
          animation: shimmer 1.4s infinite;
          border-radius: 4px;
        }
      `}</style>
      {items.length === 0 ? (
        <p style={{ color: '#cbd5e1', fontSize: '15px', margin: 0 }}>翻译内容将显示在此处...</p>
      ) : (
        <div
          style={{
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            background: '#f8fafc',
            overflow: 'hidden',
          }}
        >
          {items.map((item, i) => (
            <div key={item.id} style={{ padding: '10px 16px' }}>
              {item.loading ? (
                // [123] Loading card: show shimmer skeleton while awaiting translation
                <>
                  <div className="ot-skeleton" style={{ height: '14px', width: '70%', marginBottom: '6px' }} />
                  <div className="ot-skeleton" style={{ height: '14px', width: '50%' }} />
                </>
              ) : (
                <>
                  <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.6, color: '#1e293b' }}>
                    <span style={{ fontWeight: 700, color: '#94a3b8' }}>O:</span> {item.original}
                  </p>
                  <p style={{ margin: '2px 0 0', fontSize: '14px', lineHeight: 1.6, color: '#3730a3' }}>
                    <span style={{ fontWeight: 700, color: '#6366f1' }}>T:</span> {item.translated}
                  </p>
                </>
              )}
              {i < items.length - 1 && (
                <div style={{ borderTop: '1px solid #e2e8f0', marginTop: '10px' }} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
