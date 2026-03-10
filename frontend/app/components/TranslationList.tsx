'use client';

interface TranslationPair {
  original: string;
  translated: string;
}

interface TranslationListProps {
  translations: TranslationPair[];
}

export default function TranslationList({ translations }: TranslationListProps) {
  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '0 12px 0 24px', marginRight: '24px', marginTop: '16px', marginBottom: '16px' }}>
      {translations.length === 0 ? (
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
          {translations.map((pair, i) => (
            <div key={i} style={{ padding: '10px 16px' }}>
              <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.6, color: '#1e293b' }}>
                <span style={{ fontWeight: 700, color: '#94a3b8' }}>O:</span> {pair.original}
              </p>
              <p style={{ margin: '2px 0 0', fontSize: '14px', lineHeight: 1.6, color: '#3730a3' }}>
                <span style={{ fontWeight: 700, color: '#6366f1' }}>T:</span> {pair.translated}
              </p>
              {i < translations.length - 1 && (
                <div style={{ borderTop: '1px solid #e2e8f0', marginTop: '10px' }} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
