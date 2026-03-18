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
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { logoutUser, getTopics, createTopic, deleteTopic, updateTopicTitle, reorderTopics } from '@/lib/apiClient';
import client from '@/lib/apiClient';
import { toggleSidebar } from '@/lib/store/sidebarSlice';
import { toggleLanguage } from '@/lib/store/languageSlice';
import { useLanguage } from '@/lib/i18n';
import LanguageIcon from '@mui/icons-material/Language';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
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
  selectedTopic: { id: string; title: string } | null;
  onSelectTopic: (topic: { id: string; title: string } | null) => void;
  onOpenUserProfile: () => void;
}

// Sortable topic item component
interface SortableTopicItemProps {
  topic: Topic;
  isSelected: boolean;
  editingId: string | null;
  editValue: string;
  editInputRef: React.RefObject<HTMLInputElement | null>;
  onSelect: () => void;
  onStartEdit: () => void;
  onEditChange: (v: string) => void;
  onEditSubmit: () => void;
  onEditCancel: () => void;
  onDeleteClick: () => void;
}

function SortableTopicItem({
  topic,
  isSelected,
  editingId,
  editValue,
  editInputRef,
  onSelect,
  onStartEdit,
  onEditChange,
  onEditSubmit,
  onEditCancel,
  onDeleteClick,
}: SortableTopicItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: topic.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const isEditing = editingId === topic.id;

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        display: 'flex',
        alignItems: 'center',
        background: isSelected ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.12)',
        border: isSelected ? '1px solid rgba(255,255,255,0.6)' : '1px solid transparent',
        borderRadius: '6px',
        flexShrink: 0,
      }}
    >
      {/* drag handle */}
      <span
        {...attributes}
        {...listeners}
        style={{ cursor: 'grab', padding: '0 4px', color: 'rgba(255,255,255,0.3)', fontSize: '12px', userSelect: 'none', flexShrink: 0 }}
      >
        ⠿
      </span>

      {isEditing ? (
        <>
          <input
            ref={editInputRef as React.RefObject<HTMLInputElement>}
            type="text"
            value={editValue}
            onChange={(e) => onEditChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onEditSubmit();
              if (e.key === 'Escape') onEditCancel();
            }}
            style={{
              flex: 1,
              background: 'rgba(255,255,255,0.15)',
              border: '1px solid rgba(255,255,255,0.5)',
              borderRadius: '4px',
              color: 'white',
              fontSize: '13px',
              outline: 'none',
              padding: '4px 6px',
              minWidth: 0,
            }}
          />
          <IconButton size="small" onClick={onEditSubmit} sx={{ color: 'rgba(255,255,255,0.9)', padding: '2px', flexShrink: 0 }}>
            <CheckIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" onClick={onEditCancel} sx={{ color: 'rgba(255,255,255,0.7)', padding: '2px', flexShrink: 0 }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </>
      ) : (
        <>
          <button
            onClick={onSelect}
            style={{
              flex: 1,
              color: 'white',
              background: 'none',
              border: 'none',
              padding: '8px 4px',
              textAlign: 'left',
              fontSize: '14px',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              minWidth: 0,
            }}
          >
            {topic.title}
          </button>
          <IconButton
            size="small"
            onClick={onStartEdit}
            sx={{ color: 'rgba(255,255,255,0.5)', padding: '4px', flexShrink: 0, '&:hover': { color: 'rgba(255,255,255,0.9)' } }}
          >
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={onDeleteClick}
            sx={{ color: 'rgba(255,255,255,0.5)', padding: '4px', flexShrink: 0, '&:hover': { color: 'rgba(255,255,255,0.9)' } }}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </>
      )}
    </div>
  );
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
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);
  const cancelBlurRef = useRef(false);

  const [userRole, setUserRole] = useState<string>('');
  const { t, lang } = useLanguage();
  const isMobile = useMediaQuery('(max-width:767px)');
  const username = getUsernameFromCookie();

  useEffect(() => {
    client.get<{ role: string }>('/users/me').then((res) => setUserRole(res.data.role)).catch(() => {});
  }, []);

  // Dev-only: token expiry countdown
  const isDev = process.env.NODE_ENV !== 'production';
  const [tokenCountdown, setTokenCountdown] = useState('');
  useEffect(() => {
    if (!isDev) return;
    function computeCountdown() {
      const match = document.cookie.match(/(?:^|; )token=([^;]*)/);
      if (!match) { setTokenCountdown('no token'); return; }
      try {
        const payload = JSON.parse(atob(decodeURIComponent(match[1]).split('.')[1]));
        const secsLeft = (payload.exp as number) - Math.floor(Date.now() / 1000);
        if (secsLeft <= 0) { setTokenCountdown('expired'); return; }
        const h = Math.floor(secsLeft / 3600);
        const m = Math.floor((secsLeft % 3600) / 60);
        const s = secsLeft % 60;
        setTokenCountdown(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`);
      } catch { setTokenCountdown('err'); }
    }
    computeCountdown();
    const id = setInterval(computeCountdown, 5000);
    return () => clearInterval(id);
  }, [isDev]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

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

  function startEditing(topic: Topic) {
    setEditingId(topic.id);
    setEditValue(topic.title);
    setTimeout(() => editInputRef.current?.focus(), 0);
  }

  function cancelEditing() {
    setEditingId(null);
    setEditValue('');
  }

  async function submitEdit() {
    const title = editValue.trim();
    if (!title || !editingId) return;
    try {
      await updateTopicTitle(editingId, title);
      setTopics((prev) => prev.map((t) => t.id === editingId ? { ...t, title } : t));
      if (selectedTopic?.id === editingId) {
        onSelectTopic({ id: editingId, title });
      }
      setEditingId(null);
      setEditValue('');
    } catch {
      // keep editing open on error
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = topics.findIndex((t) => t.id === active.id);
    const newIndex = topics.findIndex((t) => t.id === over.id);
    const reordered = arrayMove(topics, oldIndex, newIndex);
    setTopics(reordered);

    try {
      await reorderTopics(reordered.map((t, i) => ({ id: t.id, order: i })));
    } catch {
      // revert on error
      await loadTopics();
    }
  }

  const filteredTopics = topics.filter((t) => t.title.includes(filter));
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
              {t.sidebarTitle}
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
              placeholder={t.searchTopicPlaceholder}
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

            {/* [96] 新增 topic 入口：搜索框正下方 */}
            {adding ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                <input
                  ref={inputRef}
                  type="text"
                  placeholder={t.newTopicPlaceholder}
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
                  marginBottom: '4px',
                  flexShrink: 0,
                }}
              >
                <AddIcon fontSize="small" />
                {t.addTopic}
              </button>
            )}

            {/* [96+101] 可滚动 + 可拖拽的 topic 列表 */}
            <div className="sidebar-scroll" style={{ maxHeight: 'calc(80vh - 100px)', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px', paddingRight: '5px' }}>
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={filteredTopics.map((t) => t.id)} strategy={verticalListSortingStrategy}>
                  {filteredTopics.map((topic) => (
                    <SortableTopicItem
                      key={topic.id}
                      topic={topic}
                      isSelected={selectedTopic?.id === topic.id}
                      editingId={editingId}
                      editValue={editValue}
                      editInputRef={editInputRef}
                      onSelect={() => onSelectTopic({ id: topic.id, title: topic.title })}
                      onStartEdit={() => startEditing(topic)}
                      onEditChange={setEditValue}
                      onEditSubmit={submitEdit}
                      onEditCancel={cancelEditing}
                      onDeleteClick={() => setDeleteConfirmId(topic.id)}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            </div>
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
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
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
            {isDev && tokenCountdown && (
              <span style={{ color: 'rgba(255,255,100,0.75)', fontSize: '11px', whiteSpace: 'nowrap', fontFamily: 'monospace' }}>
                {tokenCountdown}
              </span>
            )}
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
            {t.userProfile}
          </MenuItem>
          {['agent', 'admin'].includes(userRole) && (
            <MenuItem
              onClick={() => {
                setMenuAnchor(null);
                window.location.href = '/admin';
              }}
            >
              <AdminPanelSettingsIcon fontSize="small" sx={{ mr: 1 }} />
              {t.adminPanel}
            </MenuItem>
          )}
          <MenuItem
            onClick={() => dispatch(toggleLanguage())}
            sx={{ justifyContent: 'space-between', gap: 1 }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <LanguageIcon fontSize="small" />
              {t.language}
            </span>
            <span style={{ display: 'flex', borderRadius: '999px', overflow: 'hidden', border: '1px solid #c7d2fe', flexShrink: 0, fontSize: '11px', fontWeight: 600 }}>
              {(['en', 'zh'] as const).map((l) => (
                <span
                  key={l}
                  style={{
                    padding: '2px 8px',
                    background: lang === l ? '#6366f1' : 'transparent',
                    color: lang === l ? '#fff' : '#6366f1',
                    transition: 'background 0.2s, color 0.2s',
                    userSelect: 'none',
                  }}
                >
                  {l === 'en' ? 'EN' : '中'}
                </span>
              ))}
            </span>
          </MenuItem>
          <MenuItem
            onClick={async () => {
              setMenuAnchor(null);
              await logoutUser('manualLogout');
            }}
          >
            <LogoutIcon fontSize="small" sx={{ mr: 1 }} />
            {t.logout}
          </MenuItem>
        </Menu>
      </div>

      {/* [89] 删除确认 dialog */}
      <Dialog open={Boolean(deleteConfirmId)} onClose={() => setDeleteConfirmId(null)}>
        <DialogTitle>{t.deleteTopicTitle}</DialogTitle>
        <DialogContent>
          <DialogContentText>{t.deleteTopicConfirm}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmId(null)}>{t.cancel}</Button>
          <Button
            color="error"
            onClick={async () => {
              if (!deleteConfirmId) return;
              try {
                await deleteTopic(deleteConfirmId);
                if (selectedTopic?.id === deleteConfirmId) {
                  onSelectTopic(null);
                }
                await loadTopics();
              } catch (err) {
                console.error('Delete topic failed:', err);
              } finally {
                setDeleteConfirmId(null);
              }
            }}
          >
            {t.delete}
          </Button>
        </DialogActions>
      </Dialog>
    </aside>
  );
}
