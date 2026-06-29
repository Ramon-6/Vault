export interface Database {
  id: string;
  name: string;
  type: 'mysql' | 'postgres';
  host: string;
  port: number;
  lastAt: string | null;
  status: 'success' | 'failed' | 'running';
  size: string | null;
  nextAt: string | null;
  ret: number;
  error?: string;
}

export interface Backup {
  id: string;
  dbId: string;
  dbName: string;
  status: 'success' | 'failed';
  size: string;
  at: string;
  dur: string;
  error?: string;
}

export interface ApiToken {
  id: string;
  label: string;
  lastUsed: string;
  created: string;
}

export const DBS: Database[] = [
  { id: '1', name: 'Loja do Joao', type: 'mysql', host: '192.168.1.10', port: 3306, lastAt: '2026-06-28T02:14:00', status: 'success', size: '4.2 MB', nextAt: '2026-06-29T02:00:00', ret: 30 },
  { id: '2', name: 'App da Maria', type: 'postgres', host: '10.0.0.5', port: 5432, lastAt: '2026-06-28T02:31:00', status: 'success', size: '18.7 MB', nextAt: '2026-06-29T02:00:00', ret: 30 },
  { id: '3', name: 'ERP Construtora', type: 'mysql', host: '172.16.0.3', port: 3306, lastAt: null, status: 'running', size: null, nextAt: null, ret: 30 },
  { id: '4', name: 'API Producao', type: 'postgres', host: '10.0.1.8', port: 5432, lastAt: '2026-06-27T02:14:00', status: 'failed', size: null, nextAt: '2026-06-29T02:00:00', ret: 7, error: 'Connection refused: host unreachable after 10s' },
  { id: '5', name: 'Blog WordPress', type: 'mysql', host: '159.223.45.12', port: 3306, lastAt: '2026-06-28T03:00:00', status: 'success', size: '234 MB', nextAt: '2026-06-29T03:00:00', ret: 30 },
];

export const BACKUPS: Backup[] = [
  { id: 'b1', dbId: '1', dbName: 'Loja do Joao', status: 'success', size: '4.2 MB', at: '2026-06-28T02:14:00', dur: '42s' },
  { id: 'b2', dbId: '2', dbName: 'App da Maria', status: 'success', size: '18.7 MB', at: '2026-06-28T02:31:00', dur: '1m 15s' },
  { id: 'b3', dbId: '4', dbName: 'API Producao', status: 'failed', size: '—', at: '2026-06-27T02:14:00', dur: '10m 0s', error: 'Connection refused: host unreachable after 10s' },
  { id: 'b4', dbId: '5', dbName: 'Blog WordPress', status: 'success', size: '234 MB', at: '2026-06-28T03:00:00', dur: '3m 47s' },
  { id: 'b5', dbId: '1', dbName: 'Loja do Joao', status: 'success', size: '4.0 MB', at: '2026-06-27T02:14:00', dur: '40s' },
  { id: 'b6', dbId: '2', dbName: 'App da Maria', status: 'success', size: '18.1 MB', at: '2026-06-27T02:31:00', dur: '1m 10s' },
  { id: 'b7', dbId: '4', dbName: 'API Producao', status: 'success', size: '8.3 MB', at: '2026-06-26T02:14:00', dur: '55s' },
  { id: 'b8', dbId: '5', dbName: 'Blog WordPress', status: 'failed', size: '—', at: '2026-06-27T03:00:00', dur: '10m 0s', error: 'mysqldump: error 28 — No space left on device' },
  { id: 'b9', dbId: '1', dbName: 'Loja do Joao', status: 'success', size: '3.9 MB', at: '2026-06-26T02:14:00', dur: '38s' },
  { id: 'b10', dbId: '2', dbName: 'App da Maria', status: 'success', size: '17.8 MB', at: '2026-06-26T02:31:00', dur: '1m 5s' },
  { id: 'b11', dbId: '5', dbName: 'Blog WordPress', status: 'success', size: '231 MB', at: '2026-06-26T03:00:00', dur: '3m 52s' },
  { id: 'b12', dbId: '4', dbName: 'API Producao', status: 'success', size: '7.9 MB', at: '2026-06-25T02:14:00', dur: '51s' },
  { id: 'b13', dbId: '1', dbName: 'Loja do Joao', status: 'success', size: '3.8 MB', at: '2026-06-25T02:14:00', dur: '37s' },
  { id: 'b14', dbId: '2', dbName: 'App da Maria', status: 'success', size: '17.5 MB', at: '2026-06-25T02:31:00', dur: '1m 2s' },
  { id: 'b15', dbId: '5', dbName: 'Blog WordPress', status: 'success', size: '228 MB', at: '2026-06-25T03:00:00', dur: '3m 45s' },
];

export const TOKENS: ApiToken[] = [
  { id: 't1', label: 'Servidor do cliente Joao', lastUsed: '2026-06-28T09:15:00', created: '2026-04-10' },
  { id: 't2', label: 'VPS da Maria', lastUsed: '2026-06-27T14:30:00', created: '2026-05-22' },
  { id: 't3', label: 'Blog WordPress', lastUsed: '2026-06-28T03:01:00', created: '2026-06-01' },
];

export function fmtDate(str: string | null): string {
  if (!str) return '—';
  const d = new Date(str);
  const ref = new Date('2026-06-28T12:00:00');
  const days = Math.floor((ref.getTime() - d.getTime()) / 86400000);
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
