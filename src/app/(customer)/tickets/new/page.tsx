'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
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
import { stripHtml } from '@/lib/format';
import { useAuth } from '@/lib/auth';
import { ScreenRecorder } from '@/components/screen-recorder/ScreenRecorder';

interface TicketForm {
  subject: string;
  description: string;
  ticketType: string;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
}

export default function NewTicketPage() {
  const { user } = useAuth();
  const router = useRouter();
  const createTicket = useCreateTicket();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<{ url: string; name: string }[]>([]);

  const { register, handleSubmit, control, formState: { errors }, setValue } = useForm<TicketForm>({
    defaultValues: {
      subject: '',
      description: '',
      ticketType: 'Support',
      priority: 'Medium',
    },
  });

  const onSubmit = async (data: TicketForm) => {
    if (!stripHtml(data.description).trim()) {
      setSubmitError('Description is required');
      return;
    }

    setSubmitError(null);

    try {
      await createTicket.mutateAsync({
        subject: data.subject,
        description: data.description,
        ticket_type: data.ticketType || 'Support',
        priority: data.priority,
        raised_by: user?.email || '',
      });
      router.push('/dashboard');
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to create ticket.');
    }
  };

  return (
    <>
      <header className="bg-white border-b border-border">
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
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {submitError && (
                <Alert variant="destructive">
                  <AlertDescription>{submitError}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="ticketType">Ticket Type</Label>
                <Controller
                  name="ticketType"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange} disabled={createTicket.isPending}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Support">Support</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Controller
                  name="priority"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange} disabled={createTicket.isPending}>
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
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">
                  Subject <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="subject"
                  placeholder="Brief description of your issue"
                  disabled={createTicket.isPending}
                  aria-invalid={!!errors.subject}
                  {...register('subject', { required: 'Subject is required' })}
                />
                {errors.subject && (
                  <p className="text-sm text-destructive">{errors.subject.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">
                  Description <span className="text-destructive">*</span>
                </Label>
                <Controller
                  name="description"
                  control={control}
                  render={({ field }) => (
                    <RichTextEditor
                      content={field.value}
                      onChange={field.onChange}
                      placeholder="Provide detailed information about your issue."
                      disabled={createTicket.isPending}
                    />
                  )}
                />
                <p className="text-sm text-muted-foreground">
                  Use the toolbar to format text, add images, links, and more
                </p>
              </div>

              {/* Screen Recording */}
              <div className="space-y-2">
                <Label>Screen Recording</Label>
                <ScreenRecorder
                  onRecordingReady={(url, name) => setAttachments(prev => [...prev, { url, name }])}
                  disabled={createTicket.isPending}
                />
                {attachments.length > 0 && (
                  <div className="space-y-1">
                    {attachments.map((a, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="truncate">{a.name}</span>
                        <button
                          type="button"
                          className="text-destructive hover:underline text-xs"
                          onClick={() => setAttachments(prev => prev.filter((_, j) => j !== i))}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-between pt-6">
                <Link href="/dashboard">
                  <Button type="button" variant="outline" disabled={createTicket.isPending}>
                    Cancel
                  </Button>
                </Link>

                <Button type="submit" disabled={createTicket.isPending}>
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
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
