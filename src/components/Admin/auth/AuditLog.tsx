/**
 * Admin → Audit Log
 *
 * Query and export audit events from /auth/audit and /auth/audit/export.
 */

import { ChevronLeft, ChevronRight, Download, FileSearch } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { exportAuditLog, queryAuditLog } from '@/api/admin';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  Select,
  Spinner,
  TextInput,
} from '@/components/Admin/auth/_primitives';

import type { AuditLogEntry } from '@/types/admin';

const PAGE_SIZE = 20;

const EVENT_TYPES = [
  '',
  'login',
  'logout',
  'login_failed',
  'token_refresh',
  'user_created',
  'user_updated',
  'user_deleted',
  'role_assigned',
  'permission_changed',
  'provider_created',
  'group_created',
];

export function AuditLog() {
  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [offset, setOffset] = useState(0);
  const [exporting, setExporting] = useState(false);

  const [eventType, setEventType] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [userId, setUserId] = useState('');

  const fetchAudit = useCallback(async () => {
    setLoading(true);
    try {
      const data = await queryAuditLog({
        event_type: eventType || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        user_id: userId || undefined,
        offset,
        limit: PAGE_SIZE,
      });
      setEntries(data.items);
      setTotal(data.total);
    } finally {
      setLoading(false);
    }
  }, [eventType, dateFrom, dateTo, userId, offset]);

  useEffect(() => {
    void fetchAudit();
  }, [fetchAudit]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const blob = await exportAuditLog();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-log-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  const applyFilters = () => {
    setOffset(0);
    void fetchAudit();
  };

  const totalPages = Math.ceil(total / PAGE_SIZE) || 1;
  const currentPage = Math.floor(offset / PAGE_SIZE) + 1;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Audit Log</h2>
        <p className="text-sm text-gray-400 mt-1">
          Query and export authentication and authorization events
        </p>
      </div>

      <Card>
        <CardHeader
          title="Filters"
          description="Filter audit events by type, date range, and user"
          icon={<FileSearch className="w-4 h-4 text-oracle-red" />}
        />
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Event Type</label>
              <Select<string>
                value={eventType}
                onChange={setEventType}
                options={[
                  { value: '', label: 'All events' },
                  ...EVENT_TYPES.filter(Boolean).map((t) => ({ value: t, label: t })),
                ]}
                className="w-full text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">User ID</label>
              <TextInput
                value={userId}
                onChange={setUserId}
                placeholder="Filter by user ID"
                className="text-xs py-2"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">From</label>
              <TextInput
                value={dateFrom}
                onChange={setDateFrom}
                type="date"
                className="text-xs py-2"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">To</label>
              <TextInput
                value={dateTo}
                onChange={setDateTo}
                type="date"
                className="text-xs py-2"
              />
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <Button variant="primary" size="sm" onClick={applyFilters}>
              Apply Filters
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => void handleExport()}
              loading={exporting}
              icon={<Download className="w-3.5 h-3.5" />}
            >
              Export
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader title={`Events (${total})`} description={`Page ${currentPage} of ${totalPages}`} />
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-6">
              <Spinner size="sm" />
            </div>
          ) : (
            <div className="space-y-4">
              {entries.length > 0 ? (
                <div className="space-y-2">
                  {entries.map((entry) => (
                    <div
                      key={entry.id}
                      data-testid={`audit-row-${entry.id}`}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-dark-bg border border-dark-border"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <span className="text-xs text-gray-400 whitespace-nowrap">
                          {new Date(entry.timestamp).toLocaleString()}
                        </span>
                        <Badge>{entry.event_type}</Badge>
                        <span className="text-xs text-white truncate">{entry.actor_email}</span>
                        {entry.target && (
                          <span className="text-xs text-gray-400 truncate">→ {entry.target}</span>
                        )}
                      </div>
                      <Badge variant={entry.result === 'success' ? 'success' : 'error'}>
                        {entry.result}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400 text-center py-4">No audit events found</p>
              )}

              {total > PAGE_SIZE && (
                <div className="flex items-center justify-between pt-2 border-t border-dark-border">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setOffset((p) => Math.max(0, p - PAGE_SIZE))}
                    disabled={offset === 0}
                    icon={<ChevronLeft className="w-3.5 h-3.5" />}
                  >
                    Previous
                  </Button>
                  <span className="text-xs text-gray-400">
                    {offset + 1}–{Math.min(offset + PAGE_SIZE, total)} of {total}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setOffset((p) => p + PAGE_SIZE)}
                    disabled={offset + PAGE_SIZE >= total}
                    icon={<ChevronRight className="w-3.5 h-3.5" />}
                    iconPosition="right"
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default AuditLog;
