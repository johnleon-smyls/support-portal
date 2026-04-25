'use client';

import { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { Plus, Search, Ticket, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useTickets, useSearchTickets } from '@/hooks/use-tickets';
import { useDebouncedSearch } from '@/hooks/use-debounced-search';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ErrorState } from '@/components/ui/error-state';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FONT_FAMILY } from '@/lib/theme';
import { stripHtml, formatDate } from '@/lib/format';
import type { HDTicket } from '@/types/frappe';

type StatusFilter = 'All' | 'Open' | 'Closed';
type SortField = 'creation' | 'modified';
type SortDirection = 'asc' | 'desc';

const STATUS_FILTERS: StatusFilter[] = ['All', 'Open', 'Closed'];

export default function DashboardPage() {
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
          <h1 className="text-xl font-medium" style={{ color: '#000', fontFamily: FONT_FAMILY }}>
            Tickets
          </h1>
          <Link href="/tickets/new">
            <Button className="h-8 px-2 rounded-lg cursor-pointer" style={{ fontFamily: FONT_FAMILY }}>
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
                style={{ fontFamily: FONT_FAMILY }}
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="mb-6 flex-shrink-0 flex space-x-2">
            {STATUS_FILTERS.map((filter) => (
              <Badge
                key={filter}
                variant={statusFilter === filter ? 'default' : 'outline'}
                className={`h-8 px-3 text-sm cursor-pointer ${statusFilter === filter ? 'cursor-default' : ''}`}
                onClick={() => setStatusFilter(filter)}
                style={{ fontFamily: FONT_FAMILY }}
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
                <span className="text-sm font-medium" style={{ color: '#6B7280', fontFamily: FONT_FAMILY }}>Subject</span>
              </div>
              <div className="col-span-2 flex items-center">
                <span className="text-sm font-medium" style={{ color: '#6B7280', fontFamily: FONT_FAMILY }}>Status</span>
              </div>
              <div className="col-span-2 flex items-center">
                <button
                  onClick={() => handleSort('creation')}
                  className="flex items-center text-sm font-medium hover:text-gray-900 transition-colors"
                  style={{ color: '#6B7280', fontFamily: FONT_FAMILY }}
                >
                  Created{getSortIcon('creation')}
                </button>
              </div>
              <div className="col-span-2 flex items-center">
                <button
                  onClick={() => handleSort('modified')}
                  className="flex items-center text-sm font-medium hover:text-gray-900 transition-colors"
                  style={{ color: '#6B7280', fontFamily: FONT_FAMILY }}
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
                      <Button style={{ fontFamily: FONT_FAMILY }}>Create a ticket</Button>
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
                          <h3 className="text-sm font-medium mb-1" style={{ color: '#000', fontFamily: FONT_FAMILY }}>
                            {ticket.subject}
                          </h3>
                          <p className="text-xs line-clamp-1" style={{ color: '#6B7280', fontFamily: FONT_FAMILY }}>
                            {stripHtml(ticket.description)}
                          </p>
                        </div>
                        <div className="col-span-2 flex items-center">
                          <Badge variant={ticket.status === 'Open' ? 'default' : 'outline'} className="text-xs">
                            {ticket.status}
                          </Badge>
                        </div>
                        <div className="col-span-2 flex items-center">
                          <span className="text-xs" style={{ color: '#6B7280', fontFamily: FONT_FAMILY }}>
                            {ticket.creation ? formatDate(ticket.creation) : 'N/A'}
                          </span>
                        </div>
                        <div className="col-span-2 flex items-center">
                          <span className="text-xs" style={{ color: '#6B7280', fontFamily: FONT_FAMILY }}>
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
