'use client';

import { useState } from 'react';
import AudioWaveform from './AudioWaveform';

interface MainPanelProps {
  selectedTopic: string | null;
}

interface TranslationPair {
  original: string;
  translated: string;
}

const MOCK_TRANSLATIONS: TranslationPair[] = [
  { original: 'Welcome to the AI translation system.', translated: '欢迎使用 AI 翻译系统。' },
  { original: 'Please speak clearly into the microphone.', translated: '请对着麦克风清晰地说话。' },
  { original: 'The translation will appear in real time.', translated: '翻译结果将实时显示。' },
];

export default function MainPanel({ selectedTopic }: MainPanelProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [translations, setTranslations] = useState<TranslationPair[]>(MOCK_TRANSLATIONS);

  return (
    <main className="flex flex-1 flex-col h-screen overflow-hidden">
      {/* Topic title — 不参与滚动 */}
      <div style={{ padding: '24px 24px 0' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 600, color: '#1e293b', margin: 0 }}>
          {selectedTopic ?? '请选择或新建 Topic'}
        </h1>
      </div>

      {/* 音频波形 — 不参与滚动 */}
      <div style={{ padding: '16px 24px 0' }}>
        <AudioWaveform isRecording={isRecording} stream={stream} />
      </div>

      {/* 翻译展示区 — flex-1，可滚动 */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        {translations.length === 0 ? (
          <p style={{ color: '#cbd5e1', fontSize: '15px', margin: 0 }}>翻译内容将显示在此处...</p>
        ) : (
          translations.map((pair, i) => (
            <div
              key={i}
              style={{
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                background: '#f8fafc',
                padding: '14px 18px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              {/* 原文 */}
              <div>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  原文
                </span>
                <p style={{ margin: '4px 0 0', fontSize: '15px', color: '#1e293b', lineHeight: 1.6 }}>
                  {pair.original}
                </p>
              </div>
              {/* 分隔线 */}
              <div style={{ borderTop: '1px solid #e2e8f0' }} />
              {/* 译文 */}
              <div>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#6366f1', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  译文
                </span>
                <p style={{ margin: '4px 0 0', fontSize: '15px', color: '#3730a3', lineHeight: 1.6 }}>
                  {pair.translated}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 下部分：底部输入区，固定在底部 */}
      <div className="flex items-center gap-2 border-t border-gray-200 px-4 py-3 bg-white">
        {/* 内容由后续任务填充 */}
      </div>
    </main>
  );
}
