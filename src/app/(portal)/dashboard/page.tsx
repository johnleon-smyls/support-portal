'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Plus, Search, Ticket, ChevronLeft, ChevronRight, ArrowUpDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useTickets } from '@/hooks/use-tickets';
import { useAdminTickets, useCustomers } from '@/hooks/use-admin-tickets';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ErrorState } from '@/components/ui/error-state';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { stripHtml, formatDate, formatDateTime } from '@/lib/format';
import { useAuth } from '@/lib/auth';
import { CreateTicketDialog } from '@/components/tickets/CreateTicketDialog';
import type { HDTicket } from '@/types/frappe';

type StatusFilter = 'All' | 'Open' | 'Replied' | 'Resolved' | 'Closed';
const PAGE_SIZE = 10;

// ─── Customer Dashboard ───────────────────────────────────────────────────────

function CustomerDashboard() {
  const { data: tickets = [], isLoading, error } = useTickets();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    return tickets
      .filter((t) => {
        if (statusFilter !== 'All' && t.status !== statusFilter) return false;
        if (searchQuery) {
          const lower = searchQuery.toLowerCase();
          return (
            t.subject?.toLowerCase().includes(lower) ||
            t.description?.toLowerCase().includes(lower) ||
            false
          );
        }
        return true;
      })
      .sort((a, b) => {
        const cmp = new Date(a.modified).getTime() - new Date(b.modified).getTime();
        return sortDir === 'asc' ? cmp : -cmp;
      });
  }, [tickets, statusFilter, searchQuery, sortDir]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Header Bar */}
      <div className="h-12 flex items-center justify-between px-6 border-b border-border flex-shrink-0">
        <h1 className="text-lg font-medium text-foreground">
          Tickets
        </h1>
        <Button className="h-8 px-3 rounded-lg" onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          Create
        </Button>
      </div>

      <CreateTicketDialog open={showCreateDialog} onOpenChange={setShowCreateDialog} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-0 p-6">
        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tickets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Status</SelectItem>
              <SelectItem value="Open">Open</SelectItem>
              <SelectItem value="Replied">Replied</SelectItem>
              <SelectItem value="Resolved">Resolved</SelectItem>
              <SelectItem value="Closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Error */}
        {error && <ErrorState message={error instanceof Error ? error.message : 'Failed to load tickets'} />}

        {/* Table */}
        <div className="border border-border rounded-lg flex flex-col min-h-0 flex-1 bg-card">
          {/* Header */}
          <div className="grid grid-cols-12 gap-2 px-4 py-3 border-b border-border bg-muted/50 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            <span className="col-span-1">#</span>
            <span className="col-span-7">Subject</span>
            <span className="col-span-2">Status</span>
            <button className="col-span-2 flex items-center gap-1 uppercase cursor-pointer hover:text-foreground transition-colors" onClick={() => setSortDir(d => d === 'asc' ? 'desc' : 'asc')}>
              Updated
              <ArrowUpDown className="h-3 w-3" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <LoadingSpinner message="Loading tickets..." />
              </div>
            ) : filtered.length === 0 ? (
              <EmptyState
                icon={Ticket}
                title="No tickets found"
                description={searchQuery || statusFilter !== 'All' ? 'Try adjusting your filters' : undefined}
                action={
                  <Button onClick={() => setShowCreateDialog(true)}>Create a ticket</Button>
                }
              />
            ) : (
              paginated.map((ticket) => (
                <Link key={ticket.name} href={`/tickets/${ticket.name}`}>
                  <div className="grid grid-cols-12 gap-2 px-4 py-3 border-b border-border hover:bg-muted/30 transition-colors cursor-pointer items-center">
                    <span className="col-span-1 text-sm text-muted-foreground">
                      {ticket.name}
                    </span>
                    <div className="col-span-7">
                      <p className="text-sm font-medium text-foreground truncate">
                        {ticket.subject}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {stripHtml(ticket.description)}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <StatusBadge status={ticket.status} />
                    </div>
                    <span className="col-span-2 text-xs text-muted-foreground">
                      {ticket.modified ? formatDateTime(ticket.modified) : 'N/A'}
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Agent Dashboard ──────────────────────────────────────────────────────────

type AgentSortField = 'modified' | 'priority';
type SortDir = 'asc' | 'desc';

const PRIORITY_ORDER: Record<string, number> = { Urgent: 4, High: 3, Medium: 2, Low: 1 };

function AgentDashboard() {
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [customerFilter, setCustomerFilter] = useState('All');
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<AgentSortField>('modified');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const toggleSort = (field: AgentSortField) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const { data: ticketData, isLoading, error } = useAdminTickets({
    status: statusFilter,
    priority: priorityFilter,
    customer: customerFilter,
    page,
    pageSize: PAGE_SIZE,
  });

  const { data: customers } = useCustomers();

  const tickets = ticketData?.data || [];
  const total = ticketData?.total || 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  // Client-side search + sort on top of server filters
  const filtered = useMemo(() => {
    let result = searchQuery
      ? tickets.filter((t: HDTicket) =>
          t.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.raised_by?.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : [...tickets];

    result.sort((a: HDTicket, b: HDTicket) => {
      let cmp = 0;
      if (sortField === 'modified') {
        cmp = new Date(a.modified).getTime() - new Date(b.modified).getTime();
      } else if (sortField === 'priority') {
        cmp = (PRIORITY_ORDER[a.priority] || 0) - (PRIORITY_ORDER[b.priority] || 0);
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [tickets, searchQuery, sortField, sortDir]);

  const getAssignee = (ticket: HDTicket) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const assign = JSON.parse((ticket as any)._assign || '[]');
      return assign[0] || null;
    } catch {
      return null;
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Header Bar */}
      <div className="h-12 flex items-center justify-between px-6 border-b border-border flex-shrink-0">
        <h1 className="text-lg font-medium text-foreground">
          Tickets
        </h1>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-0 p-6">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tickets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Status</SelectItem>
            <SelectItem value="Open">Open</SelectItem>
            <SelectItem value="Replied">Replied</SelectItem>
            <SelectItem value="Resolved">Resolved</SelectItem>
            <SelectItem value="Closed">Closed</SelectItem>
          </SelectContent>
        </Select>

        <Select value={priorityFilter} onValueChange={(v) => { setPriorityFilter(v); setPage(1); }}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Priority</SelectItem>
            <SelectItem value="Low">Low</SelectItem>
            <SelectItem value="Medium">Medium</SelectItem>
            <SelectItem value="High">High</SelectItem>
            <SelectItem value="Urgent">Urgent</SelectItem>
          </SelectContent>
        </Select>

        <Select value={customerFilter} onValueChange={(v) => { setCustomerFilter(v); setPage(1); }}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Company" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Companies</SelectItem>
            {customers?.map((c) => (
              <SelectItem key={c.name} value={c.name}>{c.customer_name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="border border-border rounded-lg flex flex-col min-h-0 flex-1 bg-card">
        {/* Header */}
        <div className="grid grid-cols-12 gap-2 px-4 py-3 border-b border-border bg-muted/50 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          <span className="col-span-1">#</span>
          <span className="col-span-5">Subject</span>
          <span className="col-span-2">Company</span>
          <span className="col-span-1">Status</span>
          <button className="col-span-1 flex items-center gap-1 uppercase cursor-pointer hover:text-foreground transition-colors" onClick={() => toggleSort('priority')}>
            Priority
            {sortField === 'priority' && <ArrowUpDown className="h-3 w-3" />}
          </button>
          <button className="col-span-2 flex items-center gap-1 uppercase cursor-pointer hover:text-foreground transition-colors" onClick={() => toggleSort('modified')}>
            Updated
            {sortField === 'modified' && <ArrowUpDown className="h-3 w-3" />}
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <LoadingSpinner message="Loading tickets..." />
            </div>
          ) : error ? (
            <div className="text-center py-20 text-destructive">
              Failed to load tickets
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={Ticket}
              title="No tickets found"
              description="Try adjusting your filters"
            />
          ) : (
            filtered.map((ticket: HDTicket) => {
              const assignee = getAssignee(ticket);
              return (
                <Link key={ticket.name} href={`/tickets/${ticket.name}`}>
                  <div className="grid grid-cols-12 gap-2 px-4 py-3 border-b border-border hover:bg-muted/30 transition-colors cursor-pointer items-center">
                    <span className="col-span-1 text-sm text-muted-foreground">
                      {ticket.name}
                    </span>
                    <div className="col-span-5">
                      <p className="text-sm font-medium text-foreground truncate">
                        {ticket.subject}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {ticket.raised_by}
                      </p>
                    </div>
                    <span className="col-span-2 text-xs text-muted-foreground truncate">
                      {ticket.customer || '\u2014'}
                    </span>
                    <div className="col-span-1">
                      <StatusBadge status={ticket.status} />
                    </div>
                    <div className="col-span-1">
                      <StatusBadge status={ticket.priority} />
                    </div>
                    <span className="col-span-2 text-xs text-muted-foreground">
                      {formatDateTime(ticket.modified)}
                    </span>
                  </div>
                </Link>
              );
            })
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <span className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}

// ─── Unified Dashboard ────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { isAgent } = useAuth();

  if (isAgent) {
    return <AgentDashboard />;
  }

  return <CustomerDashboard />;
}
