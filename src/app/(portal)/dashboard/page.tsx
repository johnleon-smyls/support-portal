'use client';

import { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { Plus, Search, Ticket, ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useTickets, useSearchTickets } from '@/hooks/use-tickets';
import { useAdminTickets, useCustomers } from '@/hooks/use-admin-tickets';
import { useDebouncedSearch } from '@/hooks/use-debounced-search';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ErrorState } from '@/components/ui/error-state';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { stripHtml, formatDate } from '@/lib/format';
import { useAuth } from '@/lib/auth';
import type { HDTicket } from '@/types/frappe';

type StatusFilter = 'All' | 'Open' | 'Closed';
type SortField = 'creation' | 'modified';
type SortDirection = 'asc' | 'desc';

const CUSTOMER_STATUS_FILTERS: StatusFilter[] = ['All', 'Open', 'Closed'];
const PAGE_SIZE = 20;

// ─── Customer Dashboard ───────────────────────────────────────────────────────

function CustomerDashboard() {
  const { data: tickets = [], isLoading, error } = useTickets();
  const { search } = useSearchTickets();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');
  const [sortField, setSortField] = useState<SortField>('modified');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const filterFn = useCallback(
    (ticket: HDTicket, q: string) => {
      const lower = q.toLowerCase();
      return (
        ticket.subject?.toLowerCase().includes(lower) ||
        ticket.description?.toLowerCase().includes(lower) ||
        false
      );
    },
    []
  );

  const { query, setQuery, results } = useDebouncedSearch<HDTicket>({
    items: tickets,
    filterFn,
    apiFn: search,
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="h-3 w-3 ml-1 opacity-40" />;
    return sortDirection === 'asc'
      ? <ArrowUp className="h-3 w-3 ml-1" />
      : <ArrowDown className="h-3 w-3 ml-1" />;
  };

  const filteredAndSorted = useMemo(() => {
    return results
      .filter((t) => {
        if (statusFilter === 'All') return true;
        return t.status === statusFilter;
      })
      .sort((a, b) => {
        const aVal = new Date(a[sortField]).getTime();
        const bVal = new Date(b[sortField]).getTime();
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      });
  }, [results, statusFilter, sortField, sortDirection]);

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Header Bar */}
      <div className="h-12 flex items-center justify-between px-6 border-b border-gray-200 flex-shrink-0">
        <h1 className="text-xl font-medium text-foreground">
          Tickets
        </h1>
        <Link href="/tickets/new">
          <Button className="h-8 px-2 rounded-lg cursor-pointer">
            <Plus className="h-2.5 w-2.5 mr-2" />
            <span className="text-lg font-medium">Create</span>
          </Button>
        </Link>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-0 p-6 bg-white">
        {/* Search Bar */}
        <div className="mb-6 flex-shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search tickets..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10 h-10 rounded-lg border-gray-300"
            />
          </div>
        </div>

        {/* Status Filter */}
        <div className="mb-6 flex-shrink-0 flex space-x-2">
          {CUSTOMER_STATUS_FILTERS.map((filter) => (
            <Badge
              key={filter}
              variant={statusFilter === filter ? 'default' : 'outline'}
              className={`h-8 px-3 text-sm cursor-pointer ${statusFilter === filter ? 'cursor-default' : ''}`}
              onClick={() => setStatusFilter(filter)}
            >
              {filter}
            </Badge>
          ))}
        </div>

        {/* Error */}
        {error && <ErrorState message={error instanceof Error ? error.message : 'Failed to load tickets'} />}

        {/* Tickets Table */}
        <div className="border border-gray-200 rounded-lg flex flex-col min-h-0 flex-1">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 p-4 border-b border-gray-200 flex-shrink-0 bg-gray-100">
            <div className="col-span-6 flex items-center">
              <span className="text-sm font-medium text-muted-foreground">Subject</span>
            </div>
            <div className="col-span-2 flex items-center">
              <span className="text-sm font-medium text-muted-foreground">Status</span>
            </div>
            <div className="col-span-2 flex items-center">
              <button
                onClick={() => handleSort('creation')}
                className="flex items-center text-sm font-medium text-muted-foreground hover:text-gray-900 transition-colors"
              >
                Created{getSortIcon('creation')}
              </button>
            </div>
            <div className="col-span-2 flex items-center">
              <button
                onClick={() => handleSort('modified')}
                className="flex items-center text-sm font-medium text-muted-foreground hover:text-gray-900 transition-colors"
              >
                Last Updated{getSortIcon('modified')}
              </button>
            </div>
          </div>

          {/* Table Content */}
          <div className="flex-1 overflow-y-auto min-h-0">
            {isLoading ? (
              <div className="py-12">
                <LoadingSpinner message="Loading tickets..." />
              </div>
            ) : filteredAndSorted.length === 0 ? (
              <EmptyState
                icon={Ticket}
                title="No tickets found"
                action={
                  <Link href="/tickets/new">
                    <Button>Create a ticket</Button>
                  </Link>
                }
              />
            ) : (
              <div>
                {filteredAndSorted.map((ticket, index) => (
                  <Link key={ticket.name} href={`/tickets/${ticket.name}`}>
                    <div
                      className={`grid grid-cols-12 gap-4 p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                        index !== filteredAndSorted.length - 1 ? 'border-b border-gray-100' : ''
                      }`}
                    >
                      <div className="col-span-6 flex flex-col justify-center">
                        <h3 className="text-sm font-medium mb-1 text-foreground">
                          {ticket.subject}
                        </h3>
                        <p className="text-xs line-clamp-1 text-muted-foreground">
                          {stripHtml(ticket.description)}
                        </p>
                      </div>
                      <div className="col-span-2 flex items-center">
                        <Badge variant={ticket.status === 'Open' ? 'default' : 'outline'} className="text-xs">
                          {ticket.status}
                        </Badge>
                      </div>
                      <div className="col-span-2 flex items-center">
                        <span className="text-xs text-muted-foreground">
                          {ticket.creation ? formatDate(ticket.creation) : 'N/A'}
                        </span>
                      </div>
                      <div className="col-span-2 flex items-center">
                        <span className="text-xs text-muted-foreground">
                          {ticket.modified ? formatDate(ticket.modified) : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Agent Dashboard ──────────────────────────────────────────────────────────

function AgentDashboard() {
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [customerFilter, setCustomerFilter] = useState('All');
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');

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

  // Client-side search filter on top of server filters
  const filtered = searchQuery
    ? tickets.filter((t: HDTicket) =>
        t.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.raised_by?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : tickets;

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
      <div className="h-12 flex items-center justify-between px-6 border-b border-gray-200 flex-shrink-0">
        <h1 className="text-xl font-medium text-foreground">
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
        <div className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-border bg-muted/50 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          <span className="col-span-1">#</span>
          <span className="col-span-4">Subject</span>
          <span className="col-span-2">Company</span>
          <span className="col-span-1">Status</span>
          <span className="col-span-1">Priority</span>
          <span className="col-span-1">Agent</span>
          <span className="col-span-2">Updated</span>
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
                  <div className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-border hover:bg-muted/30 transition-colors cursor-pointer items-center">
                    <span className="col-span-1 text-sm text-muted-foreground">
                      {ticket.name}
                    </span>
                    <div className="col-span-4">
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
                    <span className="col-span-1 text-xs text-muted-foreground truncate">
                      {assignee ? assignee.split('@')[0] : '\u2014'}
                    </span>
                    <span className="col-span-2 text-xs text-muted-foreground">
                      {formatDate(ticket.modified)}
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
