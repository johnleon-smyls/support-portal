// === TICKET DETAILS & REPLIES (FR-09: Reply to open tickets with conversation thread) ===
// Displays ticket info, conversation history, and reply form.
// Backend has_permission() handles access control via HD Customer linking.

'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  AlertCircle,
  CheckCircle,
  XCircle,
  MessageSquare,
  Calendar,
  Clock,
  Tag,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useTicket, useTicketReplies, useAddReply } from '@/hooks/use-tickets';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ErrorState } from '@/components/ui/error-state';
import { BRAND_GRADIENT, BRAND_PRIMARY } from '@/lib/theme';
import { stripHtml, transformFrappeUrls, formatDate } from '@/lib/format';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { ScreenRecorder } from '@/components/screen-recorder/ScreenRecorder';
import type { HDTicket } from '@/types/frappe';

function getStatusIcon(status: HDTicket['status']) {
  switch (status) {
    case 'Open':
      return <AlertCircle className="h-4 w-4" />;
    case 'Closed':
      return <XCircle className="h-4 w-4" />;
    default:
      return <AlertCircle className="h-4 w-4" />;
  }
}

export default function TicketDetailsPage() {
  const params = useParams();
  const ticketId = params?.id as string;
  const { user } = useAuth();
  const [newReply, setNewReply] = useState('');

  const { data: ticket, isLoading, error: ticketError } = useTicket(ticketId);
  const { data: replies = [], isLoading: isLoadingReplies } = useTicketReplies(ticketId);
  const { mutate: submitReply, isPending: isSubmittingReply } = useAddReply(ticketId);

  const handleSubmitReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripHtml(newReply).trim() || !ticketId || !user) return;

    submitReply(newReply, {
      onSuccess: () => setNewReply(''),
    });
  };

  if (isLoading) {
    return (
      <>
        <div className="flex-1 flex items-center justify-center h-full">
          <LoadingSpinner message="Loading ticket details..." />
        </div>
      </>
    );
  }

  if (ticketError) {
    return (
      <>
        <div className="flex flex-col min-h-0 h-full">
          <div className="h-12 flex items-center px-6 border-b border-gray-200 flex-shrink-0">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Tickets
              </Button>
            </Link>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <ErrorState
              message={ticketError instanceof Error ? ticketError.message : 'Failed to load ticket'}
              backLink={{ href: '/dashboard', label: 'Back to Tickets' }}
            />
          </div>
        </div>
      </>
    );
  }

  if (!ticket) {
    return (
      <>
        <div className="flex-1 flex items-center justify-center h-full">
          <ErrorState
            message="Ticket not found"
            backLink={{ href: '/dashboard', label: 'Back to Tickets' }}
          />
        </div>
      </>
    );
  }

  return (
    <>
      <div className="flex flex-col min-h-0 h-full">
        {/* Header Bar */}
        <div className="h-12 flex items-center justify-between px-6 border-b border-gray-200 flex-shrink-0">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Tickets
            </Button>
          </Link>
          <span className="text-sm text-gray-500">
            #{ticket.name}
          </span>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto min-h-0 p-6">
          {/* Ticket Header Card with inline metadata */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-xl mb-3">
                    {ticket.subject}
                  </CardTitle>

                  {/* Inline metadata row */}
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                    <Badge
                      className={`flex items-center space-x-1 ${
                        ticket.status === 'Open'
                          ? 'text-white border-none'
                          : 'border-2 bg-transparent'
                      }`}
                      style={
                        ticket.status === 'Open'
                          ? { background: BRAND_GRADIENT }
                          : {
                              borderColor: BRAND_PRIMARY,
                              background: BRAND_GRADIENT,
                              WebkitBackgroundClip: 'text',
                              WebkitTextFillColor: 'transparent',
                              backgroundClip: 'text',
                            }
                      }
                    >
                      <span className={ticket.status === 'Open' ? 'text-white' : ''}>
                        {getStatusIcon(ticket.status)}
                      </span>
                      <span>{ticket.status}</span>
                    </Badge>

                    {ticket.ticket_type && (
                      <div className="flex items-center space-x-1">
                        <Tag className="h-3.5 w-3.5" />
                        <span>{ticket.ticket_type}</span>
                      </div>
                    )}

                    <div className="flex items-center space-x-1">
                      <span>Raised by {ticket.raised_by}</span>
                    </div>

                    <div className="flex items-center space-x-1">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{formatDate(ticket.creation)}</span>
                    </div>

                    {ticket.modified !== ticket.creation && (
                      <div className="flex items-center space-x-1">
                        <Clock className="h-3.5 w-3.5" />
                        <span>Updated {formatDate(ticket.modified)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Description */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Description</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className="prose max-w-none prose-gray"
                dangerouslySetInnerHTML={{ __html: transformFrappeUrls(ticket.description) }}
              />
            </CardContent>
          </Card>

          {/* Resolution (if resolved) */}
          {ticket.resolution && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span>Resolution</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className="prose max-w-none prose-gray"
                  dangerouslySetInnerHTML={{ __html: transformFrappeUrls(ticket.resolution) }}
                />
              </CardContent>
            </Card>
          )}

          {/* Conversation */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center space-x-2">
                <MessageSquare
                  className="h-5 w-5"
                  style={{
                    background: BRAND_GRADIENT,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                />
                <span>Conversation</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {isLoadingReplies ? (
                  <div className="py-8">
                    <LoadingSpinner message="Loading conversation..." />
                  </div>
                ) : (
                  <>
                    {replies.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                        <p>No replies yet. Be the first to reply!</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {[...replies]
                          .sort((a, b) => new Date(a.creation).getTime() - new Date(b.creation).getTime())
                          .map((reply) => {
                            const sender = reply.sender || reply.owner;
                            const isFromCurrentUser = sender === user?.email;
                            const isFromAgent = reply.sent_or_received === 'Sent';

                            const getBackgroundStyle = () => {
                              if (isFromCurrentUser) return {};
                              if (isFromAgent) return { background: BRAND_PRIMARY, borderColor: BRAND_PRIMARY, color: 'white' };
                              return {};
                            };

                            return (
                              <div
                                key={reply.name}
                                className={`p-4 rounded-lg border ${
                                  isFromCurrentUser
                                    ? 'bg-gray-50 border-gray-200 ml-12'
                                    : 'mr-12'
                                }`}
                                style={getBackgroundStyle()}
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center space-x-2">
                                    <div
                                      className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${
                                        isFromCurrentUser ? 'bg-gray-600' : 'bg-white bg-opacity-20'
                                      }`}
                                    >
                                      {sender?.charAt(0)?.toUpperCase() || 'U'}
                                    </div>
                                    <div>
                                      <p className={`text-sm font-medium ${isFromCurrentUser ? 'text-gray-900' : 'text-white'}`}>
                                        {sender}
                                      </p>
                                      <p className={`text-xs ${isFromCurrentUser ? 'text-gray-500' : 'text-white text-opacity-80'}`}>
                                        {new Date(reply.creation).toLocaleString()}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                                <div
                                  className={`prose max-w-none ${isFromCurrentUser ? 'prose-gray' : 'prose-invert'}`}
                                  dangerouslySetInnerHTML={{ __html: transformFrappeUrls(reply.content) }}
                                />
                              </div>
                            );
                          })}
                      </div>
                    )}

                    {/* Reply form */}
                    {ticket.status !== 'Closed' && (
                      <form onSubmit={handleSubmitReply} className="mt-6 pt-6 border-t">
                        <div className="space-y-4">
                          <div>
                            <label htmlFor="reply" className="block text-sm font-medium text-gray-700 mb-2">
                              Add a reply
                            </label>
                            <RichTextEditor
                              content={newReply}
                              onChange={setNewReply}
                              placeholder="Type your reply here. You can format text, add images, links, and more using the toolbar above."
                              disabled={isSubmittingReply}
                            />
                            <p className="text-sm text-muted-foreground mt-2">
                              Use the toolbar to format text, add images, links, and more
                            </p>
                          </div>
                          <ScreenRecorder
                            onRecordingReady={(url) => {
                              setNewReply(prev => prev + `<p><a href="${url}" target="_blank">Screen Recording</a></p>`);
                            }}
                            disabled={isSubmittingReply}
                          />
                          <div className="flex justify-end">
                            <Button
                              type="submit"
                              disabled={isSubmittingReply || !stripHtml(newReply).trim()}
                            >
                              {isSubmittingReply ? (
                                <>
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                                  Sending...
                                </>
                              ) : (
                                <>
                                  <MessageSquare className="h-4 w-4 mr-2" />
                                  Send Reply
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </form>
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
