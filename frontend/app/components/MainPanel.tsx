'use client';

import { useState, useRef, useEffect } from 'react';
import Button from '@mui/material/Button';
import MicIcon from '@mui/icons-material/Mic';
import SendIcon from '@mui/icons-material/Send';

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
  const [inputText, setInputText] = useState('');

  const barRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    if (isRecording && stream) {
      const audioCtx = new AudioContext();
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 32;
      audioCtx.createMediaStreamSource(stream).connect(analyser);
      audioCtxRef.current = audioCtx;
      analyserRef.current = analyser;

      const data = new Uint8Array(analyser.frequencyBinCount);
      const bins = [1, 3, 5, 3, 1]; // pick 5 frequency bins

      const tick = () => {
        analyser.getByteFrequencyData(data);
        bins.forEach((bin, i) => {
          const bar = barRefs.current[i];
          if (bar) {
            const val = data[bin] / 255;
            const h = Math.max(4, Math.round(val * 24));
            bar.style.height = `${h}px`;
          }
        });
        animationRef.current = requestAnimationFrame(tick);
      };
      tick();
    } else {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (audioCtxRef.current) audioCtxRef.current.close();
      barRefs.current.forEach((bar) => { if (bar) bar.style.height = '6px'; });
    }
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (audioCtxRef.current) audioCtxRef.current.close();
    };
  }, [isRecording, stream]);

  const handleSubmit = () => {
    const text = inputText.trim();
    if (!text) return;
    setTranslations((prev) => [...prev, { original: text, translated: '（翻译中...）' }]);
    setInputText('');
  };

  const toggleRecording = async () => {
    if (isRecording) {
      stream?.getTracks().forEach((t) => t.stop());
      setStream(null);
      setIsRecording(false);
    } else {
      try {
        const s = await navigator.mediaDevices.getUserMedia({ audio: true });
        setStream(s);
        setIsRecording(true);
      } catch {
        alert('无法访问麦克风，请检查浏览器权限。');
      }
    }
  };

  return (
    <main className="flex flex-1 flex-col h-screen overflow-hidden">
      {/* Topic title + 简单波形 — 同一行，不参与滚动 */}
      <div style={{ padding: '24px 24px 0', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 600, color: '#1e293b', margin: 0 }}>
          {selectedTopic ?? '请选择或新建 Topic'}
        </h1>
        {/* 实时波形：5 根小竖条 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '3px', height: '24px' }}>
          {[0, 1, 2, 3, 4].map((i) => (
            <span
              key={i}
              ref={(el) => { barRefs.current[i] = el; }}
              style={{
                display: 'inline-block',
                width: '3px',
                borderRadius: '2px',
                background: isRecording ? '#6366f1' : '#cbd5e1',
                height: '6px',
                transition: 'background 0.3s',
              }}
            />
          ))}
        </div>
      </div>

      {/* 翻译展示区 — flex-1，可滚动 */}
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

      {/* 下部分：底部输入区，固定在底部 */}
      <div className="flex items-center gap-2 border-t border-gray-200 px-4 py-3 bg-white">
        {/* 麦克风按钮 */}
        <Button
          onClick={toggleRecording}
          variant="contained"
          sx={{
            background: isRecording ? '#ef4444' : '#6366f1',
            color: 'white',
            height: 44,
            minWidth: isRecording ? 120 : 44,
            width: isRecording ? 'auto' : 44,
            padding: isRecording ? '0 14px' : 0,
            flexShrink: 0,
            borderRadius: '8px',
            textTransform: 'none',
            fontWeight: 600,
            fontSize: '14px',
            '&:hover': { background: isRecording ? '#dc2626' : '#4f46e5' },
            boxShadow: isRecording ? '0 0 0 4px rgba(239,68,68,0.2)' : 'none',
            transition: 'all 0.2s',
          }}
        >
          {isRecording ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: 'white',
                  animation: 'pulse 1s infinite',
                  flexShrink: 0,
                }}
              />
              Recording
            </span>
          ) : (
            <MicIcon />
          )}
        </Button>
        <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }`}</style>

        {/* 文字输入框 */}
        <input
          type="text"
          placeholder="输入文字进行翻译..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          style={{
            flex: 1,
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '10px 14px',
            fontSize: '15px',
            color: '#1e293b',
            outline: 'none',
            background: '#f8fafc',
            transition: 'border-color 0.2s',
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = '#6366f1')}
          onBlur={(e) => (e.currentTarget.style.borderColor = '#e2e8f0')}
        />

        {/* 提交按钮 */}
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={!inputText.trim()}
          endIcon={<SendIcon />}
          sx={{
            background: '#6366f1',
            borderRadius: '8px',
            textTransform: 'none',
            fontWeight: 600,
            flexShrink: 0,
            '&:hover': { background: '#4f46e5' },
            '&:disabled': { background: '#e2e8f0', color: '#94a3b8' },
          }}
        >
          提交
        </Button>
      </div>
    </main>
  );
}
