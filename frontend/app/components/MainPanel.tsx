'use client';

import { useState, useRef, useEffect } from 'react';
import TopicHeader from './TopicHeader';
import TranslationList from './TranslationList';
import BottomInputBar from './BottomInputBar';

interface MainPanelProps {
  selectedTopic: { id: string; title: string } | null;
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

// [110] VAD config
const VAD_PEAK_WINDOW_FRAMES = 80;   // ~2s at 60fps, sliding window for peak
const VAD_SILENCE_RATIO = 0.35;       // [112] raised from 0.20: current < peak * 35% → silence
const VAD_SILENCE_ABS = 8;           // [112] absolute floor: avg < 8 also counts as silence (handles ambient noise)
const VAD_SILENCE_MS = 500;           // silence must persist 0.5s to trigger end_utterance

function getTokenFromCookie(): string {
  if (typeof document === 'undefined') return '';
  const match = document.cookie.match(/(?:^|; )token=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : '';
}

export default function MainPanel({ selectedTopic }: MainPanelProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [translations, setTranslations] = useState<TranslationPair[]>(MOCK_TRANSLATIONS);
  const [inputText, setInputText] = useState('');

  const barRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const animationRef = useRef<number | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  // [110] VAD state
  const peakWindowRef = useRef<number[]>([]);   // sliding window of recent avg volumes
  const silenceStartRef = useRef<number | null>(null); // timestamp when silence began
  const hasSpeechRef = useRef(false);           // true if speech detected since last end_utterance

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

      // Reset VAD state on recording start
      peakWindowRef.current = [];
      silenceStartRef.current = null;
      hasSpeechRef.current = false;

      const tick = () => {
        analyser.getByteFrequencyData(data);

        // Waveform bars
        bins.forEach((bin, i) => {
          const bar = barRefs.current[i];
          if (bar) {
            const val = data[bin] / 255;
            const h = Math.max(4, Math.round(val * 24));
            bar.style.height = `${h}px`;
          }
        });

        // [110] VAD: compute current avg volume
        const avg = data.reduce((s, v) => s + v, 0) / data.length;

        // Maintain sliding peak window
        const win = peakWindowRef.current;
        win.push(avg);
        if (win.length > VAD_PEAK_WINDOW_FRAMES) win.shift();
        const peak = Math.max(...win, 1); // avoid divide-by-zero

        const isSilent = avg < peak * VAD_SILENCE_RATIO || avg < VAD_SILENCE_ABS;
        const now = performance.now();

        if (isSilent) {
          if (silenceStartRef.current === null) {
            silenceStartRef.current = now;
          } else if (now - silenceStartRef.current >= VAD_SILENCE_MS) {
            // Silence threshold exceeded — send end_utterance only if speech was detected
            if (hasSpeechRef.current) {
              const ws = wsRef.current;
              if (ws?.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: 'end_utterance' }));
                console.log('[VAD] end_utterance sent', { avg: avg.toFixed(1), peak: peak.toFixed(1) });
              }
              hasSpeechRef.current = false;
            }
            silenceStartRef.current = null;
          }
        } else {
          // Speaking — mark speech detected, reset silence timer
          hasSpeechRef.current = true;
          silenceStartRef.current = null;
        }

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

  // [107] Send text as plain string via WebSocket
  const handleSubmit = () => {
    const text = inputText.trim();
    if (!text) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(text);
    }
    setTranslations((prev) => [...prev, { original: text, translated: '（翻译中...）' }]);
    setInputText('');
  };

  // [105][106] Record button: open/close WebSocket, start/stop MediaRecorder
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
      if (!selectedTopic) {
        alert('请先选择一个 Topic 再开始录音。');
        return;
      }
      try {
        const s = await navigator.mediaDevices.getUserMedia({ audio: true });
        setStream(s);

        const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';
        const wsUrl = apiUrl.replace(/^http/, 'ws');
        const token = getTokenFromCookie();
        const ws = new WebSocket(`${wsUrl}/topics/${selectedTopic.id}/translation/live?token=${token}`);
        wsRef.current = ws;

        ws.onopen = () => {
          const recorder = new MediaRecorder(s);
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
    <main className="flex flex-1 flex-col h-screen overflow-hidden">
      <TopicHeader selectedTopic={selectedTopic} isRecording={isRecording} barRefs={barRefs} />
      <TranslationList translations={translations} />
      <BottomInputBar
        isRecording={isRecording}
        toggleRecording={toggleRecording}
        inputText={inputText}
        setInputText={setInputText}
        handleSubmit={handleSubmit}
      />
    </main>
  );
}
