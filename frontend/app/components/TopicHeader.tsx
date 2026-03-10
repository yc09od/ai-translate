'use client';

import { RefObject } from 'react';

interface TopicHeaderProps {
  selectedTopic: string | null;
  isRecording: boolean;
  barRefs: RefObject<(HTMLSpanElement | null)[]>;
}

export default function TopicHeader({ selectedTopic, isRecording, barRefs }: TopicHeaderProps) {
  return (
    <div style={{ padding: '24px 24px 0', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
      <h1 style={{ fontSize: '22px', fontWeight: 600, color: '#1e293b', margin: 0 }}>
        {selectedTopic ?? '请选择或新建 Topic'}
      </h1>
      <div style={{ display: 'flex', alignItems: 'center', gap: '3px', height: '24px' }}>
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
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
  );
}
