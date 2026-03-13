'use client';

import { useState, useRef, useEffect } from 'react';
import hark from 'hark';
import TopicHeader from './TopicHeader';
import TranslationList from './TranslationList';
import BottomInputBar from './BottomInputBar';
import { getTranslations } from '../../lib/apiClient';

interface MainPanelProps {
  selectedTopic: { id: string; title: string } | null;
}

interface TranslationItem {
  id: string;
  original: string;
  translated: string;
  loading: boolean;
}



function getTokenFromCookie(): string {
  if (typeof document === 'undefined') return '';
  const match = document.cookie.match(/(?:^|; )token=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : '';
}

export default function MainPanel({ selectedTopic }: MainPanelProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [items, setItems] = useState<TranslationItem[]>([]);
  const [inputText, setInputText] = useState('');
  // [124] Pending results for out-of-order translation responses: segmentId → result
  const pendingResultsRef = useRef<Map<string, { original: string; translated: string }>>(new Map());

  const barRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const animationRef = useRef<number | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  // hark instance ref for cleanup
  const harkerRef = useRef<ReturnType<typeof hark> | null>(null);

  // [124] Flush pending results in order: reveal loading cards only when all prior cards are revealed
  const flushPending = () => {
    const pending = pendingResultsRef.current;
    setItems(prev => {
      const next = [...prev];
      let changed = false;
      for (let i = 0; i < next.length; i++) {
        if (next[i].loading) {
          const result = pending.get(next[i].id);
          if (result) {
            pending.delete(next[i].id);
            next[i] = { ...next[i], ...result, loading: false };
            changed = true;
          } else {
            break; // First unresolved loading card — stop here, maintain order
          }
        }
      }
      return changed ? next : prev;
    });
  };

  // Load history when selected topic changes
  useEffect(() => {
    setItems([]);
    pendingResultsRef.current.clear();
    if (!selectedTopic) return;
    getTranslations(selectedTopic.id).then((records) => {
      setItems(records.map((r, i) => ({ id: `history-${i}-${r.originalText.slice(0, 8)}`, original: r.originalText, translated: r.translatedText, loading: false })));
    }).catch(() => { /* silent fail */ });
  }, [selectedTopic?.id]);

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

  // hark VAD: speaking / stopped_speaking events
  useEffect(() => {
    if (isRecording && stream) {
      const harker = hark(stream, { threshold: -65, interval: 100 });
      harkerRef.current = harker;
      let hasSpeech = false;

      harker.on('speaking', () => {
        hasSpeech = true;
        // [123] Generate segmentId, notify backend, create loading card
        const segmentId = crypto.randomUUID();
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: 'segment_start', segmentId }));
        }
        setItems(prev => [...prev, { id: segmentId, original: '', translated: '', loading: true }]);
      });
      harker.on('stopped_speaking', () => {
        if (hasSpeech && wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: 'end_utterance' }));
          console.log('[hark] end_utterance sent');
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

  // [107] Send text as plain string via WebSocket
  const handleSubmit = () => {
    const text = inputText.trim();
    if (!text) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(text);
    }
    setItems(prev => [...prev, { id: crypto.randomUUID(), original: text, translated: '（翻译中...）', loading: false }]);
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

        ws.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data as string) as { type: string; original?: string; translated?: string; segmentId?: string };
            if (msg.type === 'translation' && msg.original) {
              if (msg.segmentId) {
                // [124] Store result and flush in order
                pendingResultsRef.current.set(msg.segmentId, { original: msg.original, translated: msg.translated ?? '' });
                flushPending();
              } else {
                // Fallback: no segmentId (e.g. legacy or text input result)
                setItems(prev => [...prev, { id: crypto.randomUUID(), original: msg.original!, translated: msg.translated ?? '', loading: false }]);
              }
            }
          } catch { /* ignore non-JSON */ }
        };

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
      <TranslationList items={items} />
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
