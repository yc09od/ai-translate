'use client';

import { useState } from 'react';
import AudioWaveform from './AudioWaveform';

interface MainPanelProps {
  selectedTopic: string | null;
}

export default function MainPanel({ selectedTopic }: MainPanelProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [originalText, setOriginalText] = useState('');

  return (
    <main className="flex flex-1 flex-col h-screen overflow-hidden">
      {/* 上部分：主显示区 */}
      <div className="flex flex-1 flex-col overflow-y-auto p-6" style={{ gap: '20px' }}>
        {/* Topic title */}
        <h1 style={{ fontSize: '22px', fontWeight: 600, color: '#1e293b', margin: 0 }}>
          {selectedTopic ?? '请选择或新建 Topic'}
        </h1>

        {/* 音频波形 / 录音状态 */}
        <AudioWaveform isRecording={isRecording} stream={stream} />

        {/* 原文（语音识别结果） */}
        <div
          style={{
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            background: '#f8fafc',
            padding: '16px 20px',
            minHeight: '80px',
          }}
        >
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            原文
          </span>
          <p style={{ margin: '8px 0 0', fontSize: '16px', color: originalText ? '#1e293b' : '#cbd5e1', lineHeight: 1.7 }}>
            {originalText || '语音识别结果将显示在此处...'}
          </p>
        </div>

        {/* 译文由后续任务填充 */}
      </div>

      {/* 下部分：底部输入区，固定在底部 */}
      <div className="flex items-center gap-2 border-t border-gray-200 px-4 py-3 bg-white">
        {/* 内容由后续任务填充 */}
      </div>
    </main>
  );
}
