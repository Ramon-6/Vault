import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';

// ── Databases ──────────────────────────────────────────────

export interface DatabaseRow {
  id: string;
  name: string;
  type: 'MYSQL' | 'POSTGRES';
  host: string;
  port: number;
  dbName: string;
  username: string;
  schedule: string;
  retention: number;
  isActive: boolean;
  lastBackupAt: string | null;
  lastStatus: string | null;
  createdAt: string;
  _count: { backups: number };
}

export function useDatabases() {
  return useQuery<DatabaseRow[]>({
    queryKey: ['databases'],
    queryFn: async () => {
      const { data } = await api.get('/databases');
      return data.databases;
    },
  });
}

export function useDeleteDatabase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/databases/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['databases'] });
      qc.invalidateQueries({ queryKey: ['backups'] });
    },
  });
}

export function useTestDatabase() {
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post(`/databases/${id}/test`);
      return data as { success: boolean; message: string };
    },
  });
}

export function useCreateDatabase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: {
      name: string;
      type: 'MYSQL' | 'POSTGRES';
      host: string;
      port: number;
      dbName: string;
      username: string;
      password: string;
      schedule: string;
      retention: number;
    }) => {
      const { data } = await api.post('/databases', body);
      return data.database;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['databases'] });
    },
  });
}

// ── Backups ────────────────────────────────────────────────

export interface BackupRow {
  id: string;
  databaseId: string;
  status: string;
  sizeBytes: string | null;
  startedAt: string;
  finishedAt: string | null;
  errorMessage: string | null;
  database: { name: string; type: string };
}

interface BackupParams {
  page?: number;
  limit?: number;
  databaseId?: string;
  status?: string;
}

interface BackupResponse {
  backups: BackupRow[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export function useBackups(params: BackupParams = {}) {
  return useQuery<BackupResponse>({
    queryKey: ['backups', params],
    queryFn: async () => {
      const search = new URLSearchParams();
      if (params.page) search.set('page', String(params.page));
      if (params.limit) search.set('limit', String(params.limit));
      if (params.databaseId) search.set('databaseId', params.databaseId);
      if (params.status) search.set('status', params.status);
      const { data } = await api.get(`/backups?${search.toString()}`);
      return data;
    },
  });
}

// ── API Tokens ─────────────────────────────────────────────

export interface TokenRow {
  id: string;
  label: string;
  lastUsedAt: string | null;
  createdAt: string;
}

export function useApiTokens() {
  return useQuery<TokenRow[]>({
    queryKey: ['tokens'],
    queryFn: async () => {
      const { data } = await api.get('/tokens');
      return data.tokens;
    },
  });
}

export function useCreateToken() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (label: string) => {
      const { data } = await api.post('/tokens', { label });
      return data.token as TokenRow & { plainToken: string };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tokens'] });
    },
  });
}

export function useDeleteToken() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/tokens/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tokens'] });
    },
  });
}

// ── Billing ────────────────────────────────────────────────

export function useBillingPlan() {
  return useQuery({
    queryKey: ['billing'],
    queryFn: async () => {
      const { data } = await api.get('/billing/plan');
      return data.plan;
    },
  });
}

// ── Alerts ─────────────────────────────────────────────────

export function useAlertSettings() {
  return useQuery({
    queryKey: ['alerts'],
    queryFn: async () => {
      const { data } = await api.get('/alerts/settings');
      return data.settings as { emailOnSuccess: boolean; emailOnFailure: boolean };
    },
  });
}

export function useUpdateAlerts() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: { emailOnSuccess?: boolean }) => {
      const { data } = await api.put('/alerts/settings', body);
      return data.settings;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['alerts'] });
    },
  });
}

// ── Profile ────────────────────────────────────────────────

export function useUpdateProfile() {
  return useMutation({
    mutationFn: async (body: { name?: string; currentPassword?: string; newPassword?: string }) => {
      const { data } = await api.put('/auth/profile', body);
      return data.user;
    },
  });
}

// ── Helpers ────────────────────────────────────────────────

export function formatBytes(bytes: string | null): string {
  if (!bytes) return '—';
  const n = parseInt(bytes, 10);
  if (isNaN(n) || n === 0) return '—';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

export function formatDuration(start: string, end: string | null): string {
  if (!end) return '—';
  const ms = new Date(end).getTime() - new Date(start).getTime();
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const rs = s % 60;
  return `${m}m ${rs}s`;
}

export function fmtDate(str: string | null): string {
  if (!str) return '—';
  const d = new Date(str);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const days = Math.floor(diffMs / 86400000);
  const t = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  if (days === 0) return 'hoje, ' + t;
  if (days === 1) return 'ontem, ' + t;
  return String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0') + ', ' + t;
}

export function fmtShort(str: string | null): string {
  if (!str) return '—';
  const d = new Date(str);
  return String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0') + '/' + d.getFullYear();
}
