'use client';

import { useState, useRef, useEffect } from 'react';
import hark from 'hark';
import TopicHeader from './TopicHeader';
import TranslationList from './TranslationList';
import BottomInputBar from './BottomInputBar';
import { getTranslations } from '../../lib/apiClient';
import { exportToPdf, exportToTxt } from '../../lib/exportToPdf';
import { useLanguage } from '../../lib/i18n';

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
  const { t } = useLanguage();
  const [isRecording, setIsRecording] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [items, setItems] = useState<TranslationItem[]>([]);
  const [inputText, setInputText] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [isDraining, setIsDraining] = useState(false);
  const drainTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [loadedCount, setLoadedCount] = useState(0);
  const [oldestTimestamp, setOldestTimestamp] = useState<string | null>(null);
  const [scrollTrigger, setScrollTrigger] = useState(0);
  const barRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const animationRef = useRef<number | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  // hark instance ref for cleanup
  const harkerRef = useRef<ReturnType<typeof hark> | null>(null);

  // [128] Load history when selected topic changes (default 10 records)
  useEffect(() => {
    setItems([]);
    setTotalCount(0);
    setLoadedCount(0);
    setOldestTimestamp(null);
    if (!selectedTopic) return;
    getTranslations(selectedTopic.id, 10).then(({ records, total }) => {
      setItems(records.map((r) => ({ id: `history-${r.timestamp}`, original: r.originalText, translated: r.translatedText, loading: false })));
      setTotalCount(total);
      setLoadedCount(records.length);
      if (records.length > 0) setOldestTimestamp(records[0].timestamp);
      setScrollTrigger(t => t + 1);
    }).catch(() => { /* silent fail */ });
  }, [selectedTopic?.id]);

  // [129] Load previous N records (prepend to top)
  const handleLoadPrevious = async (count: number) => {
    if (!selectedTopic || !oldestTimestamp) return;
    const { records } = await getTranslations(selectedTopic.id, count, oldestTimestamp);
    const mapped = records.map((r) => ({ id: `history-${r.timestamp}`, original: r.originalText, translated: r.translatedText, loading: false }));
    setItems(prev => [...mapped, ...prev]);
    setLoadedCount(c => c + records.length);
    if (records.length > 0) setOldestTimestamp(records[0].timestamp);
  };

  const handleLoadAll = () => {
    const remaining = totalCount - loadedCount;
    if (remaining > 0) handleLoadPrevious(remaining);
  };

  // [131] Export all translation history for the current topic (PDF or TXT)
  const handleExport = async (type: 'pdf' | 'txt') => {
    if (!selectedTopic || isExporting) return;
    setIsExporting(true);
    try {
      const { records } = await getTranslations(selectedTopic.id, totalCount || 9999);
      const mapped = records.map(r => ({
        originalText: r.originalText,
        translatedText: r.translatedText,
        timestamp: r.timestamp,
      }));
      if (type === 'pdf') {
        await exportToPdf(selectedTopic.title, mapped);
      } else {
        exportToTxt(selectedTopic.title, mapped);
      }
    } finally {
      setIsExporting(false);
    }
  };

  // [132] When draining, close the WS as soon as all loading cards are resolved
  useEffect(() => {
    if (!isDraining) return;
    const hasLoading = items.some(item => item.loading);
    if (!hasLoading) {
      if (drainTimerRef.current) clearTimeout(drainTimerRef.current);
      wsRef.current?.close();
      wsRef.current = null;
      setIsDraining(false);
    }
  }, [items, isDraining]);

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

      // [125] Guard: speaking can fire multiple times before stopped_speaking due to
      // audio fluctuations. Only create ONE card per utterance cycle.
      let currentSegmentId: string | null = null;

      harker.on('speaking', () => {
        hasSpeech = true;
        if (currentSegmentId !== null) return; // already tracking this utterance
        // [123] Generate segmentId, notify backend, create loading card
        currentSegmentId = crypto.randomUUID();
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: 'segment_start', segmentId: currentSegmentId }));
        }
        setItems(prev => [...prev, { id: currentSegmentId!, original: '', translated: '', loading: true }]);
      });
      harker.on('stopped_speaking', () => {
        if (hasSpeech && wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: 'end_utterance' }));
          console.log('[hark] end_utterance sent');
        }
        hasSpeech = false;
        currentSegmentId = null; // reset for next utterance
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
    setItems(prev => [...prev, { id: crypto.randomUUID(), original: text, translated: t.translating, loading: false }]);
    setInputText('');
  };

  // [105][106] Record button: open/close WebSocket, start/stop MediaRecorder
  const toggleRecording = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      mediaRecorderRef.current = null;
      stream?.getTracks().forEach((t) => t.stop());
      setStream(null);
      setIsRecording(false);
      // [132] Keep WS open to drain pending translations; force-close after 15s
      setIsDraining(true);
      drainTimerRef.current = setTimeout(() => {
        wsRef.current?.close();
        wsRef.current = null;
        setIsDraining(false);
        setItems(prev => prev.map(item =>
          item.loading ? { ...item, original: t.translationTimeout, translated: '', loading: false } : item
        ));
      }, 15000);
    } else {
      if (!selectedTopic) {
        alert(t.selectTopicBeforeRecording);
        return;
      }
      try {
        // Cancel any lingering drain from a previous session
        if (drainTimerRef.current) clearTimeout(drainTimerRef.current);
        if (wsRef.current) { wsRef.current.close(); wsRef.current = null; }
        setIsDraining(false);

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
                // Reveal the matching loading card immediately, regardless of order
                setItems(prev => prev.map(item =>
                  item.id === msg.segmentId
                    ? { ...item, original: msg.original!, translated: msg.translated ?? '', loading: false }
                    : item
                ));
              } else {
                // Fallback: no segmentId (e.g. text input result)
                setItems(prev => [...prev, { id: crypto.randomUUID(), original: msg.original!, translated: msg.translated ?? '', loading: false }]);
              }
              setScrollTrigger(t => t + 1);
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
        alert(t.microphoneError);
      }
    }
  };

  return (
    <main className="flex flex-1 flex-col h-screen overflow-hidden">
      <TopicHeader selectedTopic={selectedTopic} isRecording={isRecording} barRefs={barRefs} onExport={handleExport} isExporting={isExporting} />
      <TranslationList
        items={items}
        hasMore={loadedCount < totalCount}
        onLoadPrev={() => handleLoadPrevious(10)}
        onLoadAll={handleLoadAll}
        scrollTrigger={scrollTrigger}
      />
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
