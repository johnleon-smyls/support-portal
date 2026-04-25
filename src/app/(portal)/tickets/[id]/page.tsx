'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft,
  Send,
  MessageSquare,
  StickyNote,
  Loader2,
  Sparkles,
  FileText,
  Tag,
  Calendar,
  Clock,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import {
  useAdminTicket,
  useReplyToCustomer,
  useAddInternalNote,
  useUpdateTicket,
  useAssignTicket,
  useAgents,
} from '@/hooks/use-admin-tickets';
import { useAddReply } from '@/hooks/use-tickets';
import { useAISuggestReply, useAISummarize } from '@/hooks/use-ai';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ErrorState } from '@/components/ui/error-state';
import { stripHtml, sanitizeHtml, formatDate } from '@/lib/format';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { ScreenRecorder } from '@/components/screen-recorder/ScreenRecorder';

type ReplyMode = 'reply' | 'note';

export default function TicketDetailPage() {
  const params = useParams();
  const ticketId = params?.id as string;
  const { user, isAgent } = useAuth();
  const queryClient = useQueryClient();

  // ── Data fetching ──────────────────────────────────────────────────────────
  // Use the agent's get_one API for everyone — it works for all authenticated users
  const { data: ticket, isLoading, error } = useAdminTicket(ticketId);

  // Agent-only hooks (always called for hook rules, but data only fetched for agents)
  const { data: agents } = useAgents(isAgent);
  const replyMutation = useReplyToCustomer(ticketId);
  const noteMutation = useAddInternalNote(ticketId);
  const updateMutation = useUpdateTicket(ticketId);
  const assignMutation = useAssignTicket(ticketId);

  // Customer mutation
  const customerReplyMutation = useAddReply(ticketId);

  // AI mutations (agent only, but safe to initialise unconditionally)
  const suggestMutation = useAISuggestReply();
  const summarizeMutation = useAISummarize();

  // ── Local state ────────────────────────────────────────────────────────────
  const [replyContent, setReplyContent] = useState('');
  const [replyMode, setReplyMode] = useState<ReplyMode>('reply');
  const [suggestions, setSuggestions] = useState<{ label: string; content: string }[]>([]);
  const [summary, setSummary] = useState<string | null>(null);

  // ── Derived data ───────────────────────────────────────────────────────────
  const communications = ticket
    ? ((ticket.communications as Array<Record<string, unknown>>) || [])
        .sort((a, b) => new Date(a.creation as string).getTime() - new Date(b.creation as string).getTime())
    : [];
  const comments = ticket
    ? ((ticket.comments as Array<Record<string, unknown>>) || [])
    : [];
  const assignee = (() => {
    if (!ticket) return null;
    try {
      return JSON.parse((ticket._assign as string) || '[]')[0];
    } catch {
      return null;
    }
  })();

  // ── Handlers ───────────────────────────────────────────────────────────────
  const isSending =
    replyMutation.isPending || noteMutation.isPending || customerReplyMutation.isPending;

  const handleSendReply = async () => {
    if (!stripHtml(replyContent).trim()) return;

    if (isAgent) {
      if (replyMode === 'reply') {
        await replyMutation.mutateAsync(replyContent);
      } else {
        await noteMutation.mutateAsync(replyContent);
      }
    } else {
      customerReplyMutation.mutate(replyContent, {
        onSuccess: () => {
          // Also refresh the ticket data (from get_one) and the ticket list
          queryClient.invalidateQueries({ queryKey: ['admin-ticket', ticketId] });
          queryClient.invalidateQueries({ queryKey: ['tickets'] });
        },
      });
    }

    setReplyContent('');
  };

  const handleStatusChange = (status: string) => updateMutation.mutate({ status });
  const handlePriorityChange = (priority: string) => updateMutation.mutate({ priority });
  const handleAssign = (agentEmail: string) => assignMutation.mutate(agentEmail);

  // ── Loading / error states ─────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center h-full">
        <LoadingSpinner message="Loading ticket details..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col min-h-0 h-full">
        <div className="h-12 flex items-center px-6 border-b border-border flex-shrink-0">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Tickets
            </Button>
          </Link>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <ErrorState
            message={error instanceof Error ? error.message : 'Failed to load ticket'}
            backLink={{ href: '/dashboard', label: 'Back to Tickets' }}
          />
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="flex-1 flex items-center justify-center h-full">
        <ErrorState
          message="Ticket not found"
          backLink={{ href: '/dashboard', label: 'Back to Tickets' }}
        />
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  const ticketStatus = ticket.status as string;

  return (
    <div className="flex flex-col h-full">
      {/* ── Header bar ──────────────────────────────────────────────────────── */}
      <div className="h-12 flex items-center justify-between px-6 border-b border-border flex-shrink-0">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Tickets
          </Button>
        </Link>
        <span className="text-sm text-muted-foreground">#{String(ticket.name)}</span>
      </div>

      {/* ── Body: main content + optional sidebar ───────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">
        {/* ── Main area (scrollable) ────────────────────────────────────────── */}
        <div className="flex-1 overflow-auto p-6 space-y-6">
          {/* Subject + metadata row */}
          <div>
            <h1 className="text-xl font-semibold text-foreground">
              {ticket.subject as string}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mt-2">
              <StatusBadge status={ticketStatus} />

              {(ticket.ticket_type as string) && (
                <div className="flex items-center space-x-1">
                  <Tag className="h-3.5 w-3.5" />
                  <span>{ticket.ticket_type as string}</span>
                </div>
              )}

              <div className="flex items-center space-x-1">
                <span>Raised by {ticket.raised_by as string}</span>
              </div>

              <div className="flex items-center space-x-1">
                <Calendar className="h-3.5 w-3.5" />
                <span>{formatDate(ticket.creation as string)}</span>
              </div>

              {ticket.modified !== ticket.creation && (
                <div className="flex items-center space-x-1">
                  <Clock className="h-3.5 w-3.5" />
                  <span>Updated {formatDate(ticket.modified as string)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Description</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className="prose prose-sm max-w-none prose-zinc"
                dangerouslySetInnerHTML={{
                  __html: sanitizeHtml(ticket.description as string),
                }}
              />
            </CardContent>
          </Card>

          {/* ── Conversation thread ─────────────────────────────────────────── */}
          <div>
            <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-primary" />
              Conversation ({communications.length})
            </h2>

            {communications.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="h-12 w-12 text-zinc-300 mx-auto mb-3" />
                <p>No replies yet. Be the first to reply!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {communications.map((comm) => {
                  const senderEmail =
                    (comm.sender as string) || (comm.owner as string) || '';
                  const senderName =
                    String(
                      (comm.user as Record<string, unknown>)?.name || senderEmail
                    );
                  const initial = senderName.charAt(0).toUpperCase() || 'U';

                  return (
                    <div
                      key={comm.name as string}
                      className="p-4 rounded-lg border border-border"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-zinc-600 text-white flex items-center justify-center text-sm font-medium">
                            {initial}
                          </div>
                          <div>
                            <span className="text-sm font-medium text-foreground">
                              {senderName}
                            </span>
                            {senderEmail !== senderName && (
                              <span className="text-xs text-muted-foreground ml-1">
                                ({senderEmail})
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(comm.creation as string)}
                        </span>
                      </div>
                      <div
                        className="prose prose-sm max-w-none prose-zinc"
                        dangerouslySetInnerHTML={{
                          __html: sanitizeHtml(comm.content as string),
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Internal notes (agent only) ─────────────────────────────────── */}
          {isAgent && comments.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                <StickyNote className="h-4 w-4 text-status-yellow-600" />
                Internal Notes ({comments.length})
              </h2>
              <div className="space-y-3">
                {comments.map((comment) => (
                  <div
                    key={comment.name as string}
                    className="p-4 rounded-lg border border-dashed border-status-yellow-300 bg-status-yellow-50"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">
                        {comment.commented_by as string}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(comment.creation as string)}
                      </span>
                    </div>
                    <div
                      className="prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{
                        __html: sanitizeHtml(comment.content as string),
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Reply box ───────────────────────────────────────────────────── */}
          {ticketStatus !== 'Closed' && (
            <Card>
              <CardHeader>
                <div className="flex gap-2 flex-wrap">
                  {isAgent ? (
                    <>
                      <Button
                        variant={replyMode === 'reply' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setReplyMode('reply')}
                      >
                        <Send className="h-3 w-3 mr-1" />
                        Reply to Customer
                      </Button>
                      <Button
                        variant={replyMode === 'note' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setReplyMode('note')}
                      >
                        <StickyNote className="h-3 w-3 mr-1" />
                        Internal Note
                      </Button>
                      <div className="ml-auto flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            const result = await suggestMutation.mutateAsync(ticketId);
                            setSuggestions(result);
                          }}
                          disabled={suggestMutation.isPending}
                        >
                          {suggestMutation.isPending ? (
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          ) : (
                            <Sparkles className="h-3 w-3 mr-1" />
                          )}
                          AI Suggest
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            const result = await summarizeMutation.mutateAsync(ticketId);
                            setSummary(result);
                          }}
                          disabled={summarizeMutation.isPending}
                        >
                          {summarizeMutation.isPending ? (
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          ) : (
                            <FileText className="h-3 w-3 mr-1" />
                          )}
                          Summarize
                        </Button>
                      </div>
                    </>
                  ) : (
                    <label className="block text-sm font-medium text-foreground">
                      Add a reply
                    </label>
                  )}
                </div>

                {isAgent && replyMode === 'note' && (
                  <p className="text-xs text-status-yellow-700 mt-2">
                    Internal notes are only visible to agents, not customers.
                  </p>
                )}
              </CardHeader>

              <CardContent className="space-y-4">
                {/* AI Summary (agent only) */}
                {isAgent && summary && (
                  <div className="p-3 rounded-md bg-smyls-blue-50 border border-smyls-blue-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-smyls-blue-700">
                        AI Summary
                      </span>
                      <button
                        className="text-xs text-muted-foreground hover:underline"
                        onClick={() => setSummary(null)}
                      >
                        Dismiss
                      </button>
                    </div>
                    <pre className="text-sm text-foreground whitespace-pre-wrap font-sans">
                      {summary}
                    </pre>
                  </div>
                )}

                {/* AI Suggestions (agent only) */}
                {isAgent && suggestions.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-muted-foreground">
                        AI Suggestions
                      </span>
                      <button
                        className="text-xs text-muted-foreground hover:underline"
                        onClick={() => setSuggestions([])}
                      >
                        Dismiss
                      </button>
                    </div>
                    <div className="grid gap-2">
                      {suggestions.map((s, i) => (
                        <button
                          key={i}
                          type="button"
                          className="text-left p-3 rounded-md border border-border hover:border-primary hover:bg-smyls-blue-50 transition-colors"
                          onClick={() => {
                            setReplyContent(s.content);
                            setSuggestions([]);
                          }}
                        >
                          <span className="text-xs font-semibold text-primary">
                            {s.label}
                          </span>
                          <div
                            className="text-sm text-muted-foreground mt-1 line-clamp-2"
                            dangerouslySetInnerHTML={{
                              __html: sanitizeHtml(s.content),
                            }}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <RichTextEditor
                  content={replyContent}
                  onChange={setReplyContent}
                  placeholder={
                    isAgent
                      ? replyMode === 'reply'
                        ? 'Type your reply to the customer...'
                        : 'Add an internal note...'
                      : 'Type your reply here. You can format text, add images, links, and more using the toolbar above.'
                  }
                  disabled={isSending}
                />

                {/* Screen recorder (customer only) */}
                {!isAgent && (
                  <ScreenRecorder
                    onRecordingReady={(url) => {
                      setReplyContent(
                        (prev) =>
                          prev +
                          `<p><a href="${url}" target="_blank">Screen Recording</a></p>`
                      );
                    }}
                    disabled={isSending}
                  />
                )}

                <div className="flex justify-end">
                  <Button
                    onClick={handleSendReply}
                    disabled={isSending || !stripHtml(replyContent).trim()}
                  >
                    {isSending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <MessageSquare className="h-4 w-4 mr-2" />
                        {isAgent
                          ? replyMode === 'reply'
                            ? 'Send Reply'
                            : 'Add Note'
                          : 'Send Reply'}
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* ── Sidebar (agent only) ──────────────────────────────────────────── */}
        {isAgent && (
          <div className="w-72 border-l border-border p-6 overflow-auto flex-shrink-0 space-y-6">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Status
              </label>
              <Select
                value={ticketStatus}
                onValueChange={handleStatusChange}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Open">Open</SelectItem>
                  <SelectItem value="Replied">Replied</SelectItem>
                  <SelectItem value="Resolved">Resolved</SelectItem>
                  <SelectItem value="Closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Priority
              </label>
              <Select
                value={ticket.priority as string}
                onValueChange={handlePriorityChange}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Low">Low</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Assigned To
              </label>
              <Select value={assignee || ''} onValueChange={handleAssign}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent>
                  {agents?.map((a) => (
                    <SelectItem key={a.name} value={a.user}>
                      {a.agent_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="border-t border-border pt-4 space-y-3">
              <div>
                <span className="text-xs text-muted-foreground">Company</span>
                <p className="text-sm font-medium">
                  {(ticket.customer as string) || '\u2014'}
                </p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Raised By</span>
                <p className="text-sm font-medium">
                  {ticket.raised_by as string}
                </p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Type</span>
                <p className="text-sm font-medium">
                  {(ticket.ticket_type as string) || '\u2014'}
                </p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Created</span>
                <p className="text-sm">
                  {formatDate(ticket.creation as string)}
                </p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Last Updated</span>
                <p className="text-sm">
                  {formatDate(ticket.modified as string)}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
