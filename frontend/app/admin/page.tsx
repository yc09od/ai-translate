'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import client from '@/lib/apiClient';
import {
  adminGetUsers,
  adminUpdateUserActive,
  adminGetCodes,
  adminCreateCode,
  adminUpdateCodeUsed,
  type AdminUser,
  type AdminCode,
} from '@/lib/apiClient';

// ── styles ──────────────────────────────────────────────────────────────────

const styles = {
  page: {
    minHeight: '100vh',
    background: '#f9fafb',
    fontFamily: 'system-ui, sans-serif',
    fontSize: '14px',
    color: '#111827',
  } as React.CSSProperties,
  header: {
    background: '#fff',
    borderBottom: '1px solid #e5e7eb',
    padding: '0 32px',
    display: 'flex',
    alignItems: 'center',
    height: '56px',
    gap: '24px',
  } as React.CSSProperties,
  headerTitle: { fontWeight: 700, fontSize: '16px', marginRight: '16px' } as React.CSSProperties,
  tab: (active: boolean): React.CSSProperties => ({
    padding: '0 4px',
    height: '56px',
    display: 'flex',
    alignItems: 'center',
    color: active ? '#6366f1' : '#6b7280',
    fontWeight: active ? 600 : 400,
    cursor: 'pointer',
    userSelect: 'none',
    background: 'none',
    borderTop: 'none',
    borderLeft: 'none',
    borderRight: 'none',
    borderBottom: active ? '2px solid #6366f1' : '2px solid transparent',
    fontSize: '14px',
  }),
  content: { padding: '24px 32px' } as React.CSSProperties,
  toolbar: { display: 'flex', gap: '12px', marginBottom: '16px', alignItems: 'center' } as React.CSSProperties,
  input: {
    padding: '7px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '14px',
    outline: 'none',
    width: '240px',
  } as React.CSSProperties,
  select: {
    padding: '7px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '14px',
    background: '#fff',
    cursor: 'pointer',
  } as React.CSSProperties,
  table: { width: '100%', borderCollapse: 'collapse' as const, background: '#fff', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,.08)' },
  th: {
    padding: '10px 14px',
    background: '#f3f4f6',
    textAlign: 'left' as const,
    fontWeight: 600,
    fontSize: '13px',
    color: '#374151',
    borderBottom: '1px solid #e5e7eb',
  },
  td: {
    padding: '10px 14px',
    borderBottom: '1px solid #f3f4f6',
    verticalAlign: 'middle' as const,
  },
  badge: (active: boolean): React.CSSProperties => ({
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: '9999px',
    fontSize: '12px',
    fontWeight: 600,
    background: active ? '#dcfce7' : '#fee2e2',
    color: active ? '#16a34a' : '#dc2626',
  }),
  btn: (variant: 'primary' | 'ghost' | 'danger' = 'ghost'): React.CSSProperties => ({
    padding: '5px 12px',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
    border: variant === 'ghost' ? '1px solid #d1d5db' : 'none',
    background: variant === 'primary' ? '#6366f1' : variant === 'danger' ? '#ef4444' : '#fff',
    color: variant === 'ghost' ? '#374151' : '#fff',
  }),
  pagination: { display: 'flex', alignItems: 'center', gap: '12px', marginTop: '16px', justifyContent: 'flex-end' } as React.CSSProperties,
  label: { fontSize: '13px', color: '#6b7280' } as React.CSSProperties,
  error: { color: '#dc2626', fontSize: '13px', marginBottom: '12px' } as React.CSSProperties,
} as const;

// ── UserManagement ───────────────────────────────────────────────────────────

function UserManagement() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState('');
  const [debouncedFilter, setDebouncedFilter] = useState('');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editActive, setEditActive] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const PAGE_SIZE = 15;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // Debounce filter input
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedFilter(filter);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [filter]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminGetUsers({
        filter: debouncedFilter || undefined,
        order,
        page,
        pageSize: PAGE_SIZE,
      });
      setUsers(res.users);
      setTotal(res.total);
    } finally {
      setLoading(false);
    }
  }, [debouncedFilter, order, page]);

  useEffect(() => { load(); }, [load]);

  // Reset page when order changes
  const handleOrderChange = (v: 'asc' | 'desc') => { setOrder(v); setPage(1); };

  function startEdit(u: AdminUser) {
    setEditingId(u.id);
    setEditActive(u.active);
  }

  async function submitEdit(userId: string) {
    setSaving(true);
    try {
      await adminUpdateUserActive(userId, editActive);
      setEditingId(null);
      await load();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div style={styles.toolbar}>
        <input
          style={styles.input}
          placeholder="Search by name or email…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
        <select
          style={styles.select}
          value={order}
          onChange={(e) => handleOrderChange(e.target.value as 'asc' | 'desc')}
        >
          <option value="desc">Newest first</option>
          <option value="asc">Oldest first</option>
        </select>
        <span style={styles.label}>{loading ? 'Loading…' : `${total} user${total !== 1 ? 's' : ''}`}</span>
      </div>

      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>ID</th>
            <th style={styles.th}>Name</th>
            <th style={styles.th}>Email</th>
            <th style={styles.th}>Role</th>
            <th style={styles.th}>Active</th>
            <th style={styles.th}>Action</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td style={{ ...styles.td, fontFamily: 'monospace', fontSize: '12px', color: '#6b7280', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {u.id}
              </td>
              <td style={styles.td}>{u.name}</td>
              <td style={styles.td}>{u.email}</td>
              <td style={styles.td}>
                <span style={{ textTransform: 'capitalize' }}>{u.role}</span>
              </td>
              <td style={styles.td}>
                {editingId === u.id ? (
                  <select
                    style={styles.select}
                    value={editActive ? 'true' : 'false'}
                    onChange={(e) => setEditActive(e.target.value === 'true')}
                  >
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                ) : (
                  <span style={styles.badge(u.active)}>{u.active ? 'Active' : 'Inactive'}</span>
                )}
              </td>
              <td style={styles.td}>
                {editingId === u.id ? (
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button style={styles.btn('primary')} onClick={() => submitEdit(u.id)} disabled={saving}>
                      {saving ? 'Saving…' : 'Save'}
                    </button>
                    <button style={styles.btn('ghost')} onClick={() => setEditingId(null)} disabled={saving}>
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button style={styles.btn('ghost')} onClick={() => startEdit(u)}>Edit</button>
                )}
              </td>
            </tr>
          ))}
          {!loading && users.length === 0 && (
            <tr>
              <td colSpan={6} style={{ ...styles.td, textAlign: 'center', color: '#9ca3af', padding: '32px' }}>
                No users found
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <div style={styles.pagination}>
        <span style={styles.label}>Page {page} / {totalPages}</span>
        <button style={styles.btn('ghost')} onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
          ← Prev
        </button>
        <button style={styles.btn('ghost')} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
          Next →
        </button>
      </div>
    </div>
  );
}

// ── CodeManagement ───────────────────────────────────────────────────────────

const CODE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_#@!';
const CODE_LENGTH = 15;

function generateUniqueCode(existingCodes: string[]): string {
  const existing = new Set(existingCodes);
  for (let attempt = 0; attempt < 20; attempt++) {
    let code = '';
    const arr = new Uint8Array(CODE_LENGTH);
    crypto.getRandomValues(arr);
    for (const byte of arr) {
      code += CODE_CHARS[byte % CODE_CHARS.length];
    }
    if (!existing.has(code)) return code;
  }
  // Extremely unlikely to reach here; return last generated anyway
  let code = '';
  const arr = new Uint8Array(CODE_LENGTH);
  crypto.getRandomValues(arr);
  for (const byte of arr) code += CODE_CHARS[byte % CODE_CHARS.length];
  return code;
}

function CodeManagement() {
  const [codes, setCodes] = useState<AdminCode[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<'used' | 'unused' | 'null'>('unused');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [newCode, setNewCode] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [loading, setLoading] = useState(false);
  const PAGE_SIZE = 15;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminGetCodes({ filter, order, page, pageSize: PAGE_SIZE });
      setCodes(res.codes);
      setTotal(res.total);
    } finally {
      setLoading(false);
    }
  }, [filter, order, page]);

  useEffect(() => { load(); }, [load]);

  const handleFilterChange = (v: 'used' | 'unused' | 'null') => { setFilter(v); setPage(1); };
  const handleOrderChange = (v: 'asc' | 'desc') => { setOrder(v); setPage(1); };

  async function handleCreate() {
    const trimmed = newCode.trim();
    if (!trimmed) return;
    setCreating(true);
    setCreateError('');
    try {
      await adminCreateCode(trimmed);
      setNewCode('');
      setPage(1);
      await load();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setCreateError(msg || 'Failed to create code');
    } finally {
      setCreating(false);
    }
  }

  async function handleToggleUsed(c: AdminCode) {
    await adminUpdateCodeUsed(c.id, !c.used);
    await load();
  }

  return (
    <div>
      {/* Add code */}
      <div style={{ ...styles.toolbar, marginBottom: '20px' }}>
        <input
          style={styles.input}
          placeholder="New invitation code…"
          value={newCode}
          onChange={(e) => { setNewCode(e.target.value.replace(/[\s\t]/g, '')); setCreateError(''); }}
          onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
        />
        <button
          style={styles.btn('ghost')}
          onClick={() => setNewCode(generateUniqueCode(codes.map((c) => c.code)))}
          disabled={creating}
        >
          Generate
        </button>
        <button style={styles.btn('primary')} onClick={handleCreate} disabled={creating || !newCode.trim()}>
          {creating ? 'Adding…' : 'Add Code'}
        </button>
        {createError && <span style={styles.error}>{createError}</span>}
      </div>

      {/* Filter / order */}
      <div style={styles.toolbar}>
        <select
          style={styles.select}
          value={filter}
          onChange={(e) => handleFilterChange(e.target.value as 'used' | 'unused' | 'null')}
        >
          <option value="unused">Unused only</option>
          <option value="used">Used only</option>
          <option value="null">All</option>
        </select>
        <select
          style={styles.select}
          value={order}
          onChange={(e) => handleOrderChange(e.target.value as 'asc' | 'desc')}
        >
          <option value="desc">Newest first</option>
          <option value="asc">Oldest first</option>
        </select>
        <span style={styles.label}>{loading ? 'Loading…' : `${total} code${total !== 1 ? 's' : ''}`}</span>
      </div>

      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Code</th>
            <th style={styles.th}>Status</th>
            <th style={styles.th}>Created</th>
            <th style={styles.th}>Action</th>
          </tr>
        </thead>
        <tbody>
          {codes.map((c) => (
            <tr key={c.id}>
              <td style={{ ...styles.td, fontFamily: 'monospace', fontWeight: 600 }}>{c.code}</td>
              <td style={styles.td}>
                <span style={styles.badge(!c.used)}>{c.used ? 'Used' : 'Unused'}</span>
              </td>
              <td style={{ ...styles.td, color: '#6b7280', fontSize: '13px' }}>
                {new Date(c.createdAt).toLocaleDateString()}
              </td>
              <td style={styles.td}>
                <button
                  style={styles.btn(c.used ? 'ghost' : 'danger')}
                  onClick={() => handleToggleUsed(c)}
                >
                  {c.used ? 'Mark Unused' : 'Mark Used'}
                </button>
              </td>
            </tr>
          ))}
          {!loading && codes.length === 0 && (
            <tr>
              <td colSpan={4} style={{ ...styles.td, textAlign: 'center', color: '#9ca3af', padding: '32px' }}>
                No codes found
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <div style={styles.pagination}>
        <span style={styles.label}>Page {page} / {totalPages}</span>
        <button style={styles.btn('ghost')} onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
          ← Prev
        </button>
        <button style={styles.btn('ghost')} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
          Next →
        </button>
      </div>
    </div>
  );
}

// ── AdminPage ────────────────────────────────────────────────────────────────

type Tab = 'users' | 'codes';

export default function AdminPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<Tab>((searchParams.get('tab') as Tab) || 'users');
  const [checking, setChecking] = useState(true);

  // Verify admin role on mount
  useEffect(() => {
    client.get<{ role: string }>('/users/me').then((res) => {
      if (res.data.role !== 'admin') {
        router.replace('/dashboard');
      } else {
        setChecking(false);
      }
    }).catch(() => {
      router.replace('/login');
    });
  }, [router]);

  if (checking) return null;

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <span style={styles.headerTitle}>Admin Panel</span>
        <button style={styles.tab(tab === 'users')} onClick={() => { setTab('users'); router.replace('/admin?tab=users'); }}>
          Users
        </button>
        <button style={styles.tab(tab === 'codes')} onClick={() => { setTab('codes'); router.replace('/admin?tab=codes'); }}>
          Invitation Codes
        </button>
        <div style={{ flex: 1 }} />
        <button
          style={{ ...styles.btn('ghost'), fontSize: '13px' }}
          onClick={() => router.push('/dashboard')}
        >
          ← Back to Dashboard
        </button>
      </header>

      <main style={styles.content}>
        {tab === 'users' ? <UserManagement /> : <CodeManagement />}
      </main>
    </div>
  );
}
