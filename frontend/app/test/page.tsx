'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import hark from 'hark';
import Button from '@mui/material/Button';
import MicIcon from '@mui/icons-material/Mic';

interface TranslationEntry {
  original: string;
  translated: string;
}

function getTokenFromCookie(): string {
  if (typeof document === 'undefined') return '';
  const match = document.cookie.match(/(?:^|; )token=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : '';
}

export default function TestPage() {
  const router = useRouter();

  useEffect(() => {
    if (process.env.NODE_ENV === 'production') {
      router.replace('/dashboard');
    }
  }, [router]);

  if (process.env.NODE_ENV === 'production') return null;

  return <TestContent />;
}

function TestContent() {
  const [isRecording, setIsRecording] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [entries, setEntries] = useState<TranslationEntry[]>([]);
  const [currentChunk, setCurrentChunk] = useState('');

  const barRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const animationRef = useRef<number | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const harkerRef = useRef<ReturnType<typeof hark> | null>(null);

  // Waveform animation
  useEffect(() => {
    if (isRecording && stream) {
      const audioCtx = new AudioContext();
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 32;
      audioCtx.createMediaStreamSource(stream).connect(analyser);
      audioCtxRef.current = audioCtx;
      analyserRef.current = analyser;

      const data = new Uint8Array(analyser.frequencyBinCount);
      const bins = [1, 2, 3, 4, 5, 6, 5, 4, 3, 1];
      const tick = () => {
        analyser.getByteFrequencyData(data);
        bins.forEach((bin, i) => {
          const bar = barRefs.current[i];
          if (bar) {
            const val = data[bin] / 255;
            bar.style.height = `${Math.max(4, Math.round(val * 24))}px`;
          }
        });
        animationRef.current = requestAnimationFrame(tick);
      };
      tick();
    } else {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (audioCtxRef.current?.state !== 'closed') audioCtxRef.current?.close();
      barRefs.current.forEach((bar) => { if (bar) bar.style.height = '6px'; });
    }
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (audioCtxRef.current?.state !== 'closed') audioCtxRef.current?.close();
    };
  }, [isRecording, stream]);

  // Hark VAD
  useEffect(() => {
    if (isRecording && stream) {
      const harker = hark(stream, { threshold: -65, interval: 100 });
      harkerRef.current = harker;
      let hasSpeech = false;

      harker.on('speaking', () => { hasSpeech = true; });
      harker.on('stopped_speaking', () => {
        if (hasSpeech && wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: 'end_utterance' }));
        }
        hasSpeech = false;
      });
    } else {
      harkerRef.current?.stop();
      harkerRef.current = null;
    }
    return () => {
      harkerRef.current?.stop();
      harkerRef.current = null;
    };
  }, [isRecording, stream]);

  const toggleRecording = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      mediaRecorderRef.current = null;
      stream?.getTracks().forEach((t) => t.stop());
      setStream(null);
      wsRef.current?.close();
      wsRef.current = null;
      setIsRecording(false);
    } else {
      try {
        const s = await navigator.mediaDevices.getUserMedia({ audio: true });
        setStream(s);

        const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';
        const wsUrl = apiUrl.replace(/^http/, 'ws');
        const token = getTokenFromCookie();
        const ws = new WebSocket(`${wsUrl}/dev/test/translate/stream?token=${token}`);
        wsRef.current = ws;

        ws.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data as string) as {
              type: string;
              text?: string;
              original?: string;
              translated?: string;
            };
            if (msg.type === 'chunk' && msg.text) {
              setCurrentChunk((prev) => prev + msg.text);
            } else if (msg.type === 'done') {
              setEntries((prev) => [...prev, {
                original: msg.original ?? '',
                translated: msg.translated ?? '',
              }]);
              setCurrentChunk('');
            }
          } catch { /* ignore */ }
        };

        ws.onopen = () => {
          const mimeType = 'audio/ogg;codecs=opus';
          const recorder = new MediaRecorder(s, { mimeType });
          mediaRecorderRef.current = recorder;
          recorder.ondataavailable = (e) => {
            if (e.data.size > 0 && ws.readyState === WebSocket.OPEN) {
              ws.send(e.data);
            }
          };
          recorder.start(250);
        };

        ws.onerror = () => {
          mediaRecorderRef.current?.stop();
          mediaRecorderRef.current = null;
          s.getTracks().forEach((t) => t.stop());
          setStream(null);
          wsRef.current = null;
          setIsRecording(false);
        };

        setIsRecording(true);
      } catch {
        alert('无法访问麦克风，请检查浏览器权限。');
      }
    }
  };

  return (
    <main style={{ padding: '32px', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '8px', color: '#1e293b' }}>
        Dev: Streaming Translation Test
      </h1>
      <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '28px' }}>
        说话 → hark VAD 检测到静音 → 发送音频给 Gemini → 流式返回转录+翻译
      </p>

      {/* Record button + waveform */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '28px' }}>
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
              <span style={{
                width: 8, height: 8, borderRadius: '50%', background: 'white',
                animation: 'pulse 1s infinite', flexShrink: 0,
              }} />
              Recording
            </span>
          ) : (
            <MicIcon />
          )}
        </Button>

        {isRecording && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '3px', height: '32px' }}>
            {Array.from({ length: 10 }).map((_, i) => (
              <span
                key={i}
                ref={(el) => { barRefs.current[i] = el; }}
                style={{
                  display: 'inline-block',
                  width: '4px',
                  height: '6px',
                  background: '#ef4444',
                  borderRadius: '2px',
                  transition: 'height 0.05s',
                }}
              />
            ))}
          </div>
        )}

        <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }`}</style>
      </div>

      {/* Display block */}
      <div style={{
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        minHeight: '300px',
        padding: '16px',
        background: '#f8fafc',
      }}>
        {entries.length === 0 && !currentChunk && (
          <p style={{ color: '#94a3b8', fontSize: '14px' }}>
            开始录音后，翻译结果会显示在这里...
          </p>
        )}

        {entries.map((entry, i) => (
          <div key={i} style={{
            marginBottom: '12px', padding: '12px',
            background: 'white', borderRadius: '8px', border: '1px solid #e2e8f0',
          }}>
            <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '2px' }}>Original</p>
            <p style={{ fontSize: '15px', color: '#1e293b', marginBottom: '8px' }}>{entry.original}</p>
            <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '2px' }}>Translation</p>
            <p style={{ fontSize: '15px', color: '#6366f1' }}>{entry.translated}</p>
          </div>
        ))}

        {currentChunk && (
          <div style={{
            padding: '12px', background: 'white', borderRadius: '8px',
            border: '1px dashed #6366f1',
          }}>
            <p style={{ fontSize: '12px', color: '#6366f1', marginBottom: '4px' }}>翻译中...</p>
            <p style={{ fontSize: '15px', color: '#1e293b', whiteSpace: 'pre-wrap' }}>{currentChunk}</p>
          </div>
        )}
      </div>
    </main>
  );
}
