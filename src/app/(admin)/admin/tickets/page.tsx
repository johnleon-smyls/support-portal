'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Ticket, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
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
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { useAdminTickets, useCustomers } from '@/hooks/use-admin-tickets';
import { formatDate } from '@/lib/format';
import type { HDTicket } from '@/types/frappe';

const PAGE_SIZE = 20;

export default function AdminTicketsPage() {
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
    <div className="flex-1 flex flex-col min-h-0 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Tickets</h1>
          <p className="text-sm text-muted-foreground mt-1">{total} total tickets</p>
        </div>
      </div>

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
                <Link key={ticket.name} href={`/admin/tickets/${ticket.name}`}>
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
                      {ticket.customer || '—'}
                    </span>
                    <div className="col-span-1">
                      <StatusBadge status={ticket.status} />
                    </div>
                    <div className="col-span-1">
                      <StatusBadge status={ticket.priority} />
                    </div>
                    <span className="col-span-1 text-xs text-muted-foreground truncate">
                      {assignee ? assignee.split('@')[0] : '—'}
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
  );
}
