'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Send, MessageSquare, StickyNote, Loader2, Sparkles, FileText } from 'lucide-react';
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
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ErrorState } from '@/components/ui/error-state';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import {
  useAdminTicket,
  useReplyToCustomer,
  useAddInternalNote,
  useUpdateTicket,
  useAssignTicket,
  useAgents,
} from '@/hooks/use-admin-tickets';
import { useAuth } from '@/lib/auth';
import { formatDate, stripHtml, sanitizeHtml } from '@/lib/format';
import { useAISuggestReply, useAISummarize } from '@/hooks/use-ai';

type ReplyMode = 'reply' | 'note';

export default function AdminTicketDetailPage() {
  const params = useParams();
  const ticketId = params?.id as string;
  const { user } = useAuth();
  const { data: ticket, isLoading, error } = useAdminTicket(ticketId);
  const { data: agents } = useAgents();
  const replyMutation = useReplyToCustomer(ticketId);
  const noteMutation = useAddInternalNote(ticketId);
  const updateMutation = useUpdateTicket(ticketId);
  const assignMutation = useAssignTicket(ticketId);

  const [replyContent, setReplyContent] = useState('');
  const [replyMode, setReplyMode] = useState<ReplyMode>('reply');
  const [suggestions, setSuggestions] = useState<{ label: string; content: string }[]>([]);
  const [summary, setSummary] = useState<string | null>(null);
  const suggestMutation = useAISuggestReply();
  const summarizeMutation = useAISummarize();

  if (isLoading) {
    return <div className="flex items-center justify-center h-full"><LoadingSpinner message="Loading ticket..." /></div>;
  }

  if (error || !ticket) {
    return <ErrorState message="Ticket not found" backLink={{ href: '/admin/tickets', label: 'Back to Tickets' }} />;
  }

  const communications = (ticket.communications as Array<Record<string, unknown>>) || [];
  const comments = (ticket.comments as Array<Record<string, unknown>>) || [];
  const assignee = (() => {
    try { return JSON.parse(ticket._assign as string || '[]')[0]; } catch { return null; }
  })();

  const handleSendReply = async () => {
    if (!stripHtml(replyContent).trim()) return;
    if (replyMode === 'reply') {
      await replyMutation.mutateAsync(replyContent);
    } else {
      await noteMutation.mutateAsync(replyContent);
    }
    setReplyContent('');
  };

  const handleStatusChange = (status: string) => {
    updateMutation.mutate({ status });
  };

  const handlePriorityChange = (priority: string) => {
    updateMutation.mutate({ priority });
  };

  const handleAssign = (agentEmail: string) => {
    assignMutation.mutate(agentEmail);
  };

  const isSending = replyMutation.isPending || noteMutation.isPending;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="h-12 flex items-center px-6 border-b border-border flex-shrink-0">
        <Link href="/admin/tickets">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Tickets
          </Button>
        </Link>
        <span className="ml-4 text-sm text-muted-foreground">#{String(ticket.name)}</span>
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Main area */}
        <div className="flex-1 overflow-auto p-6 space-y-6">
          {/* Subject */}
          <div>
            <h1 className="text-xl font-semibold text-foreground">{ticket.subject as string}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Created by {ticket.raised_by as string} on {formatDate(ticket.creation as string)}
            </p>
          </div>

          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Description</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: sanitizeHtml(ticket.description as string) }} />
            </CardContent>
          </Card>

          {/* Conversation */}
          <div>
            <h2 className="text-sm font-semibold text-foreground mb-4">
              Conversation ({communications.length})
            </h2>
            {communications.length === 0 ? (
              <p className="text-sm text-muted-foreground">No replies yet.</p>
            ) : (
              <div className="space-y-3">
                {communications.map((comm) => (
                  <div
                    key={comm.name as string}
                    className="p-4 rounded-lg border border-border"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground">
                          {String((comm.user as Record<string, unknown>)?.name || comm.sender || '')}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {comm.sender === user?.email ? 'You' : 'Customer'}
                        </Badge>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(comm.creation as string)}
                      </span>
                    </div>
                    <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: sanitizeHtml(comm.content as string) }} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Internal Notes */}
          {comments.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-foreground mb-4">
                Internal Notes ({comments.length})
              </h2>
              <div className="space-y-3">
                {comments.map((comment) => (
                  <div
                    key={comment.name as string}
                    className="p-4 rounded-lg border border-dashed border-status-yellow-300 bg-status-yellow-50"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">{comment.commented_by as string}</span>
                      <span className="text-xs text-muted-foreground">{formatDate(comment.creation as string)}</span>
                    </div>
                    <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: sanitizeHtml(comment.content as string) }} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reply Box */}
          <Card>
            <CardHeader>
              <div className="flex gap-2 flex-wrap">
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
              </div>
              {replyMode === 'note' && (
                <p className="text-xs text-status-yellow-700 mt-2">
                  Internal notes are only visible to agents, not customers.
                </p>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {/* AI Summary */}
              {summary && (
                <div className="p-3 rounded-md bg-smyls-blue-50 border border-smyls-blue-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-smyls-blue-700">AI Summary</span>
                    <button className="text-xs text-muted-foreground hover:underline" onClick={() => setSummary(null)}>Dismiss</button>
                  </div>
                  <pre className="text-sm text-foreground whitespace-pre-wrap font-sans">{summary}</pre>
                </div>
              )}

              {/* AI Suggestions */}
              {suggestions.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground">AI Suggestions</span>
                    <button className="text-xs text-muted-foreground hover:underline" onClick={() => setSuggestions([])}>Dismiss</button>
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
                        <span className="text-xs font-semibold text-primary">{s.label}</span>
                        <div className="text-sm text-muted-foreground mt-1 line-clamp-2" dangerouslySetInnerHTML={{ __html: sanitizeHtml(s.content) }} />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <RichTextEditor
                content={replyContent}
                onChange={setReplyContent}
                placeholder={replyMode === 'reply' ? 'Type your reply to the customer...' : 'Add an internal note...'}
                disabled={isSending}
              />
              <div className="flex justify-end mt-4">
                <Button
                  onClick={handleSendReply}
                  disabled={isSending || !stripHtml(replyContent).trim()}
                >
                  {isSending ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Sending...</>
                  ) : (
                    <><MessageSquare className="h-4 w-4 mr-2" />{replyMode === 'reply' ? 'Send Reply' : 'Add Note'}</>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="w-72 border-l border-border p-6 overflow-auto flex-shrink-0 space-y-6">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</label>
            <Select value={ticket.status as string} onValueChange={handleStatusChange}>
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
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Priority</label>
            <Select value={ticket.priority as string} onValueChange={handlePriorityChange}>
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
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Assigned To</label>
            <Select value={assignee || ''} onValueChange={handleAssign}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Unassigned" />
              </SelectTrigger>
              <SelectContent>
                {agents?.map((a) => (
                  <SelectItem key={a.name} value={a.user}>{a.agent_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="border-t border-border pt-4 space-y-3">
            <div>
              <span className="text-xs text-muted-foreground">Company</span>
              <p className="text-sm font-medium">{ticket.customer as string || '—'}</p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">Raised By</span>
              <p className="text-sm font-medium">{ticket.raised_by as string}</p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">Type</span>
              <p className="text-sm font-medium">{ticket.ticket_type as string || '—'}</p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">Created</span>
              <p className="text-sm">{formatDate(ticket.creation as string)}</p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">Last Updated</span>
              <p className="text-sm">{formatDate(ticket.modified as string)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
