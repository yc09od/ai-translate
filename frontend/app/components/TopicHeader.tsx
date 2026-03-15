'use client';

import { RefObject, useState, useRef, useEffect } from 'react';

interface TopicHeaderProps {
  selectedTopic: { id: string; title: string } | null;
  isRecording: boolean;
  barRefs: RefObject<(HTMLSpanElement | null)[]>;
  onExport?: (type: 'pdf' | 'txt') => void;
  isExporting?: boolean;
}

export default function TopicHeader({ selectedTopic, isRecording, barRefs, onExport, isExporting }: TopicHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  const handleSelect = (type: 'pdf' | 'txt') => {
    setMenuOpen(false);
    onExport?.(type);
  };

  return (
    <div style={{ padding: '24px 24px 0', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
      <h1 style={{ fontSize: '22px', fontWeight: 600, color: '#1e293b', margin: 0 }}>
        {selectedTopic?.title ?? '请选择或新建 Topic'}
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

      {/* [131] Export button with format dropdown */}
      {selectedTopic && onExport && (
        <div ref={menuRef} style={{ marginLeft: 'auto', position: 'relative' }}>
          <button
            onClick={() => !isExporting && setMenuOpen(o => !o)}
            disabled={isExporting}
            title="导出历史记录"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 10px',
              fontSize: '12px',
              color: isExporting ? '#94a3b8' : '#6366f1',
              background: 'transparent',
              border: '1px solid',
              borderColor: isExporting ? '#e2e8f0' : '#c7d2fe',
              borderRadius: '6px',
              cursor: isExporting ? 'default' : 'pointer',
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="12" y1="18" x2="12" y2="12"/>
              <line x1="9" y1="15" x2="15" y2="15"/>
            </svg>
            {isExporting ? '导出中...' : '导出'}
            {!isExporting && (
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            )}
          </button>

          {menuOpen && (
            <div style={{
              position: 'absolute',
              right: 0,
              top: 'calc(100% + 4px)',
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              overflow: 'hidden',
              zIndex: 100,
              minWidth: '130px',
            }}>
              {(['pdf', 'txt'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => handleSelect(type)}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '8px 14px',
                    textAlign: 'left',
                    fontSize: '13px',
                    color: '#1e293b',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#f1f5f9')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  {type === 'pdf' ? '📄 导出为 PDF' : '📝 导出为 TXT'}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
