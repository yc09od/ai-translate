'use client';

import { useEffect, useState } from 'react';
import IconButton from '@mui/material/IconButton';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import client from '@/lib/apiClient';

interface UserProfilePanelProps {
  onClose: () => void;
}

interface UserInfo {
  id: string;
  email: string;
  name: string;
  provider: string;
}

export default function UserProfilePanel({ onClose }: UserProfilePanelProps) {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [nameInput, setNameInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  useEffect(() => {
    client.get<UserInfo>('/users/me').then((res) => {
      setUser(res.data);
      setNameInput(res.data.name);
    });
  }, []);

  async function handleSave() {
    if (!nameInput.trim()) return;
    setSaving(true);
    setSaveMsg('');
    try {
      const res = await client.patch<UserInfo>('/users/me', { name: nameInput.trim() });
      setUser(res.data);
      setSaveMsg('Saved!');
    } catch {
      setSaveMsg('Save failed. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col h-full" style={{ padding: '24px 32px' }}>
      {/* Header */}
      <div className="flex items-center gap-2" style={{ marginBottom: '32px' }}>
        <IconButton onClick={onClose} size="small">
          <ArrowBackIcon />
        </IconButton>
        <span style={{ fontSize: '20px', fontWeight: 600 }}>User Profile</span>
      </div>

      {/* Content */}
      {user ? (
        <div className="flex flex-col" style={{ gap: '24px', maxWidth: '400px' }}>
          {/* Email (read-only) */}
          <div className="flex flex-col" style={{ gap: '6px' }}>
            <label style={{ fontSize: '13px', color: '#6b7280', fontWeight: 500 }}>Email</label>
            <div
              style={{
                fontSize: '15px',
                color: '#374151',
                padding: '10px 12px',
                background: '#f3f4f6',
                borderRadius: '8px',
              }}
            >
              {user.email}
            </div>
          </div>

          {/* Name (editable) */}
          <div className="flex flex-col" style={{ gap: '6px' }}>
            <label style={{ fontSize: '13px', color: '#6b7280', fontWeight: 500 }}>
              User Name
            </label>
            <input
              type="text"
              value={nameInput}
              onChange={(e) => { setNameInput(e.target.value); setSaveMsg(''); }}
              style={{
                fontSize: '15px',
                color: '#111827',
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                outline: 'none',
              }}
              onFocus={(e) => { e.target.style.borderColor = '#6366f1'; }}
              onBlur={(e) => { e.target.style.borderColor = '#d1d5db'; }}
            />
          </div>

          {/* Save button */}
          <div className="flex items-center" style={{ gap: '12px' }}>
            <button
              onClick={handleSave}
              disabled={saving || !nameInput.trim()}
              style={{
                background: saving || !nameInput.trim() ? '#a5b4fc' : '#6366f1',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 24px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: saving || !nameInput.trim() ? 'not-allowed' : 'pointer',
              }}
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
            {saveMsg && (
              <span style={{ fontSize: '14px', color: saveMsg === 'Saved!' ? '#16a34a' : '#dc2626' }}>
                {saveMsg}
              </span>
            )}
          </div>
        </div>
      ) : (
        <div style={{ color: '#9ca3af', fontSize: '14px' }}>Loading...</div>
      )}
    </div>
  );
}
