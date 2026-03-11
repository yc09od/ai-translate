'use client';

import { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import useMediaQuery from '@mui/material/useMediaQuery';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import SettingsIcon from '@mui/icons-material/Settings';
import AddIcon from '@mui/icons-material/Add';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import LogoutIcon from '@mui/icons-material/Logout';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { logoutUser, getTopics, createTopic } from '@/lib/apiClient';
import { toggleSidebar } from '@/lib/store/sidebarSlice';
import type { RootState } from '@/lib/store/store';

interface Topic {
  id: string;
  title: string;
}

function getUsernameFromCookie(): string {
  if (typeof document === 'undefined') return '';
  const match = document.cookie.match(/(?:^|; )token=([^;]*)/);
  if (!match) return '';
  try {
    const payload = JSON.parse(atob(decodeURIComponent(match[1]).split('.')[1]));
    const email: string = payload.email ?? '';
    return email.split('@')[0];
  } catch {
    return '';
  }
}

interface SidebarProps {
  selectedTopic: string | null;
  onSelectTopic: (topic: string) => void;
  onOpenUserProfile: () => void;
}

export default function Sidebar({ selectedTopic, onSelectTopic, onOpenUserProfile }: SidebarProps) {
  const dispatch = useDispatch();
  const expanded = useSelector((state: RootState) => state.sidebar.expanded);
  const [filter, setFilter] = useState('');
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [adding, setAdding] = useState(false);
  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const cancelBlurRef = useRef(false);

  const isMobile = useMediaQuery('(max-width:767px)');
  const username = getUsernameFromCookie();

  async function loadTopics() {
    try {
      const data = await getTopics();
      setTopics(data.map((t) => ({ id: t.id, title: t.title })));
    } catch {
      // silently fail if not authenticated yet
    }
  }

  useEffect(() => {
    if (expanded) loadTopics();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expanded]);

  function startAdding() {
    setAdding(true);
    setNewTopicTitle('');
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  function cancelAdding() {
    setAdding(false);
    setNewTopicTitle('');
  }

  async function submitTopic() {
    const title = newTopicTitle.trim();
    if (!title) return;
    setSubmitting(true);
    try {
      await createTopic(title);
      await loadTopics();
      setAdding(false);
      setNewTopicTitle('');
    } catch {
      // keep input open on error
    } finally {
      setSubmitting(false);
    }
  }

  function handleInputBlur() {
    if (cancelBlurRef.current) {
      cancelBlurRef.current = false;
      return;
    }
    cancelAdding();
  }

  const sidebarWidth = expanded ? (isMobile ? '100vw' : 240) : 56;

  return (
    <aside
      className="flex h-screen flex-col justify-between bg-indigo-600 py-2 transition-all duration-300 overflow-x-hidden"
      style={{
        width: sidebarWidth,
        alignItems: 'center',
        ...(isMobile && expanded ? { position: 'fixed', top: 0, left: 0, zIndex: 1200, height: '100vh' } : {}),
      }}
    >
      {/* 上半部分：标题栏 + topic 列表 */}
      <div className="flex flex-col w-full" style={{ flex: 1, overflow: 'hidden' }}>
        {/* 顶部：标题 + 展开/收起 icon */}
        <div
          className="flex items-center w-full"
          style={{ justifyContent: expanded ? 'space-between' : 'center', padding: expanded ? '0 15px' : '0' }}
        >
          {expanded && (
            <span style={{ color: 'white', fontWeight: 600, fontSize: '18px', whiteSpace: 'nowrap', overflow: 'hidden' }}>
              AI 实时翻译
            </span>
          )}
          <IconButton
            onClick={() => dispatch(toggleSidebar())}
            sx={{
              color: 'white',
              border: '1px solid rgba(255,255,255,0.6)',
              borderRadius: '6px',
              padding: '4px',
            }}
          >
            {expanded ? <ChevronLeftIcon /> : <ChevronRightIcon />}
          </IconButton>
        </div>

        {/* 展开时：topic 列表 + 新增 topic */}
        {expanded && (
          <div className="flex flex-col mt-4" style={{ padding: '0 15px', gap: '4px' }}>
            {/* Topic 过滤输入框 */}
            <input
              type="text"
              placeholder="搜索 topic..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              style={{
                background: 'rgba(255,255,255,0.15)',
                border: '1px solid rgba(255,255,255,0.3)',
                borderRadius: '6px',
                color: 'white',
                fontSize: '13px',
                outline: 'none',
                padding: '6px 10px',
                marginBottom: '6px',
                width: '100%',
                boxSizing: 'border-box',
              }}
            />

            {/* 可滚动的 topic 列表，最高 80vh 减去 filter input 高度 */}
            <div className="sidebar-scroll" style={{ maxHeight: 'calc(80vh - 50px)', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px', paddingRight: '5px' }}>
              {topics.filter((t) => t.title.includes(filter)).map((topic) => (
                <button
                  key={topic.id}
                  onClick={() => onSelectTopic(topic.title)}
                  style={{
                    color: 'white',
                    background: selectedTopic === topic.title ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.12)',
                    border: selectedTopic === topic.title ? '1px solid rgba(255,255,255,0.6)' : 'none',
                    borderRadius: '6px',
                    padding: '8px 10px',
                    textAlign: 'left',
                    fontSize: '14px',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    flexShrink: 0,
                  }}
                >
                  {topic.title}
                </button>
              ))}
            </div>

            {/* [86] 新增 topic 入口：点击后变形为 input + submit/cancel */}
            {adding ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Topic 名称..."
                  value={newTopicTitle}
                  onChange={(e) => setNewTopicTitle(e.target.value)}
                  onBlur={handleInputBlur}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') submitTopic();
                    if (e.key === 'Escape') cancelAdding();
                  }}
                  style={{
                    flex: 1,
                    background: 'rgba(255,255,255,0.15)',
                    border: '1px solid rgba(255,255,255,0.5)',
                    borderRadius: '6px',
                    color: 'white',
                    fontSize: '13px',
                    outline: 'none',
                    padding: '6px 8px',
                    minWidth: 0,
                  }}
                />
                <IconButton
                  size="small"
                  disabled={submitting}
                  onMouseDown={() => { cancelBlurRef.current = true; }}
                  onClick={submitTopic}
                  sx={{ color: 'rgba(255,255,255,0.9)', padding: '2px', flexShrink: 0 }}
                >
                  <CheckIcon fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  onMouseDown={() => { cancelBlurRef.current = true; }}
                  onClick={cancelAdding}
                  sx={{ color: 'rgba(255,255,255,0.7)', padding: '2px', flexShrink: 0 }}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </div>
            ) : (
              <button
                onClick={startAdding}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: 'rgba(255,255,255,0.7)',
                  background: 'none',
                  border: '1px dashed rgba(255,255,255,0.4)',
                  borderRadius: '6px',
                  padding: '8px 10px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  marginTop: '4px',
                  flexShrink: 0,
                }}
              >
                <AddIcon fontSize="small" />
                新增 Topic
              </button>
            )}
          </div>
        )}
      </div>

      {/* 底部：用户名（展开时）+ 设置 icon */}
      <div
        className="w-full"
        style={{
          padding: expanded ? '0 15px' : '0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: expanded ? 'space-between' : 'center',
          gap: '6px',
        }}
      >
        {expanded && username && (
          <span
            style={{
              color: 'rgba(255,255,255,0.85)',
              fontSize: '13px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: '120px',
            }}
            title={username}
          >
            {username}
          </span>
        )}
        <IconButton
          sx={{ color: 'white', flexShrink: 0 }}
          onClick={(e) => setMenuAnchor(e.currentTarget)}
        >
          <SettingsIcon />
        </IconButton>

        {/* 设置菜单：大屏向右上方展开，小屏向左上方展开 */}
        <Menu
          anchorEl={menuAnchor}
          open={Boolean(menuAnchor)}
          onClose={() => setMenuAnchor(null)}
          anchorOrigin={{ vertical: 'top', horizontal: isMobile ? 'left' : 'right' }}
          transformOrigin={{ vertical: 'bottom', horizontal: isMobile ? 'right' : 'left' }}
        >
          <MenuItem
            onClick={() => {
              setMenuAnchor(null);
              onOpenUserProfile();
            }}
          >
            <AccountCircleIcon fontSize="small" sx={{ mr: 1 }} />
            User Profile
          </MenuItem>
          <MenuItem
            onClick={async () => {
              setMenuAnchor(null);
              await logoutUser();
            }}
          >
            <LogoutIcon fontSize="small" sx={{ mr: 1 }} />
            Logout
          </MenuItem>
        </Menu>
      </div>
    </aside>
  );
}
