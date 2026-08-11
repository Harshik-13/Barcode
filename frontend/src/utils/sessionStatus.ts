import type { SessionStatus } from '@workspace/shared';

export const STATUS_LABELS: Record<SessionStatus, string> = {
  created: 'Created',
  active: 'Active',
  awaiting_summary: 'Awaiting Summary',
  completed: 'Completed',
  archived: 'Archived',
};

export const STATUS_COLORS: Record<SessionStatus, string> = {
  created: '#b45309',
  active: '#047857',
  awaiting_summary: '#c2410c',
  completed: '#4b5563',
  archived: '#6b7280',
};

export function statusChipStyle(status: string): { background: string; color: string } {
  const color = STATUS_COLORS[status as SessionStatus] ?? '#6b7280';
  return { background: `${color}1a`, color };
}

export function formatDuration(seconds: number | null | undefined): string {
  if (!seconds && seconds !== 0) return '-';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}
