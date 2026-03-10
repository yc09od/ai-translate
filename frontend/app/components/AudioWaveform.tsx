'use client';

import { useEffect, useRef } from 'react';

interface AudioWaveformProps {
  isRecording: boolean;
  stream: MediaStream | null;
}

export default function AudioWaveform({ isRecording, stream }: AudioWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (isRecording && stream) {
      const audioCtx = new AudioContext();
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);
      audioCtxRef.current = audioCtx;
      analyserRef.current = analyser;

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const draw = () => {
        animationRef.current = requestAnimationFrame(draw);
        analyser.getByteTimeDomainData(dataArray);

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#6366f1';
        ctx.beginPath();

        const sliceWidth = canvas.width / bufferLength;
        let x = 0;
        for (let i = 0; i < bufferLength; i++) {
          const v = dataArray[i] / 128.0;
          const y = (v * canvas.height) / 2;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
          x += sliceWidth;
        }
        ctx.lineTo(canvas.width, canvas.height / 2);
        ctx.stroke();
      };
      draw();
    } else {
      // 停止动画，清空画布
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (audioCtxRef.current) audioCtxRef.current.close();
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (audioCtxRef.current) audioCtxRef.current.close();
    };
  }, [isRecording, stream]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
        padding: '16px',
        borderRadius: '12px',
        background: isRecording ? '#eef2ff' : '#f8fafc',
        border: `1px solid ${isRecording ? '#a5b4fc' : '#e2e8f0'}`,
        transition: 'all 0.3s',
      }}
    >
      {/* 状态指示 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span
          style={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: isRecording ? '#ef4444' : '#94a3b8',
            boxShadow: isRecording ? '0 0 0 3px rgba(239,68,68,0.25)' : 'none',
            display: 'inline-block',
            transition: 'all 0.3s',
          }}
        />
        <span style={{ fontSize: '13px', color: isRecording ? '#6366f1' : '#94a3b8', fontWeight: 500 }}>
          {isRecording ? '录音中...' : '等待录音'}
        </span>
      </div>

      {/* 波形 Canvas */}
      <canvas
        ref={canvasRef}
        width={400}
        height={60}
        style={{
          width: '100%',
          maxWidth: 400,
          height: 60,
          opacity: isRecording ? 1 : 0.3,
        }}
      />
    </div>
  );
}
