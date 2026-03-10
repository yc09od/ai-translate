'use client';

import { useState, useRef, useEffect } from 'react';
import TopicHeader from './TopicHeader';
import TranslationList from './TranslationList';
import BottomInputBar from './BottomInputBar';

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
      const bins = [1, 2, 3, 4, 5, 6, 5, 4, 3, 1];

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
