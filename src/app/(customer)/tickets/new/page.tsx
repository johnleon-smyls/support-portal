// === TICKET CREATION (FR-04: Submit new support ticket with subject and description) ===
// Creates HD Ticket via Frappe API. Backend set_customer() auto-links the HD Customer.

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Loader2, Plus } from 'lucide-react';
import { useCreateTicket } from '@/hooks/use-tickets';
import { GradientButton } from '@/components/ui/gradient-button';
import { stripHtml } from '@/lib/format';
import { useAuth } from '@/lib/auth';

export default function NewTicketPage() {
  const { user } = useAuth();
  const router = useRouter();
  const createTicket = useCreateTicket();

  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [ticketType, setTicketType] = useState('Support');
  const [priority, setPriority] = useState<'Low' | 'Medium' | 'High' | 'Urgent'>('Medium');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!subject.trim() || !stripHtml(description).trim()) {
      setError('Subject and description are required');
      return;
    }

    setError(null);

    try {
      await createTicket.mutateAsync({
        subject,
        description,
        ticket_type: ticketType || 'Support',
        priority,
        raised_by: user?.email || '',
      });

      router.push('/dashboard');
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to create ticket. Please try again.';
      setError(message);
    }
  };

  return (
    <>
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Create New Support Ticket</CardTitle>
            <CardDescription>
              Describe your issue and we&apos;ll get back to you as soon as possible
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Ticket Type */}
              <div className="space-y-2">
                <Label htmlFor="ticketType">Ticket Type</Label>
                <Select
                  value={ticketType}
                  onValueChange={setTicketType}
                  disabled={createTicket.isPending}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Support">Support</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Priority */}
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={priority}
                  onValueChange={(v) => setPriority(v as 'Low' | 'Medium' | 'High' | 'Urgent')}
                  disabled={createTicket.isPending}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Subject */}
              <div className="space-y-2">
                <Label htmlFor="subject">
                  Subject <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => {
                    setSubject(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="Brief description of your issue"
                  required
                  disabled={createTicket.isPending}
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">
                  Description <span className="text-red-500">*</span>
                </Label>
                <RichTextEditor
                  content={description}
                  onChange={(content) => {
                    setDescription(content);
                    if (error) setError(null);
                  }}
                  placeholder="Provide detailed information about your issue. Include any error messages, steps to reproduce, and what you expected to happen. You can format text, add images, and more using the toolbar above."
                  disabled={createTicket.isPending}
                />
                <p className="text-sm text-gray-500">
                  Use the toolbar to format your text, add images, links, and more
                </p>
              </div>

              {/* Form Actions */}
              <div className="flex justify-between pt-6">
                <Link href="/dashboard">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={createTicket.isPending}
                    className="cursor-pointer"
                  >
                    Cancel
                  </Button>
                </Link>

                <GradientButton
                  type="submit"
                  disabled={createTicket.isPending}
                  className="cursor-pointer"
                >
                  {createTicket.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Ticket...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Create
                    </>
                  )}
                </GradientButton>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
