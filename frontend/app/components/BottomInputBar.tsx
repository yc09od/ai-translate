'use client';

import Button from '@mui/material/Button';
import MicIcon from '@mui/icons-material/Mic';
import SendIcon from '@mui/icons-material/Send';

interface BottomInputBarProps {
  isRecording: boolean;
  toggleRecording: () => void;
  inputText: string;
  setInputText: (text: string) => void;
  handleSubmit: () => void;
}

export default function BottomInputBar({ isRecording, toggleRecording, inputText, setInputText, handleSubmit }: BottomInputBarProps) {
  return (
    <div className="flex items-center gap-2 border-t border-gray-200 px-4 py-3 bg-white">
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
  );
}
